import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase-server";

export interface AuthContext {
  userId: string | null;
  isRegistered: boolean;
}

const GUEST_USER_COOKIE_NAME = "guest_user_id";
const LEGACY_ANON_COOKIE_NAME = "anon_id";

function getGuestUserCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

async function getStoredGuestUserId() {
  const cookieStore = await cookies();
  return (
    cookieStore.get(GUEST_USER_COOKIE_NAME)?.value ??
    cookieStore.get(LEGACY_ANON_COOKIE_NAME)?.value ??
    null
  );
}

async function persistGuestUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_USER_COOKIE_NAME, userId, getGuestUserCookieOptions());
  cookieStore.set(LEGACY_ANON_COOKIE_NAME, "", {
    ...getGuestUserCookieOptions(),
    maxAge: 0,
  });
}

async function migrateGuestChatsToUser(guestUserId: string, userId: string) {
  const db = createServerSupabase();
  const { error } = await db
    .from("chats")
    .update({ user_id: userId })
    .eq("user_id", guestUserId);

  if (error) {
    throw error;
  }
}

export async function syncRegisteredUser(
  authUserId: string,
  email: string | null,
  guestUserId?: string | null,
) {
  const db = createServerSupabase();
  const { data: existingUser, error: existingUserError } = await db
    .from("users")
    .select("id, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  let dbUser = existingUser;

  if (!dbUser) {
    const { data: guestUser, error: guestUserError } = guestUserId
      ? await db
          .from("users")
          .select("id, is_registered")
          .eq("id", guestUserId)
          .maybeSingle()
      : { data: null, error: null };

    if (guestUserError) {
      throw guestUserError;
    }

    if (guestUser && !guestUser.is_registered) {
      const result = await db
        .from("users")
        .update({
          auth_user_id: authUserId,
          email,
          is_registered: true,
        })
        .eq("id", guestUser.id)
        .select("id, email")
        .single();

      if (result.error) {
        throw result.error;
      }

      dbUser = result.data;
    }
  }

  if (!dbUser && email) {
    const { data: existingEmailUser, error: existingEmailUserError } = await db
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingEmailUserError) {
      throw existingEmailUserError;
    }

    if (existingEmailUser) {
      const result = await db
        .from("users")
        .update({
          auth_user_id: authUserId,
          email,
          is_registered: true,
        })
        .eq("id", existingEmailUser.id)
        .select("id, email")
        .single();

      if (result.error) {
        throw result.error;
      }

      dbUser = result.data;
    }
  }

  if (!dbUser) {
    const result = await db
      .from("users")
      .insert({
        email,
        auth_user_id: authUserId,
        is_registered: true,
      })
      .select("id, email")
      .single();

    if (result.error) {
      throw result.error;
    }

    dbUser = result.data;
  } else if (email && dbUser.email !== email) {
    const result = await db
      .from("users")
      .update({ email })
      .eq("id", dbUser.id)
      .select("id, email")
      .single();

    if (result.error) {
      throw result.error;
    }

    dbUser = result.data;
  }

  if (guestUserId && guestUserId !== dbUser.id) {
    const { data: guestUser, error: guestUserError } = await db
      .from("users")
      .select("id, is_registered")
      .eq("id", guestUserId)
      .maybeSingle();

    if (guestUserError) {
      throw guestUserError;
    }

    if (guestUser && !guestUser.is_registered) {
      await migrateGuestChatsToUser(guestUser.id, dbUser.id);
    }
  }

  return dbUser.id;
}

export async function clearGuestUserId() {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_USER_COOKIE_NAME, "", {
    ...getGuestUserCookieOptions(),
    maxAge: 0,
  });
  cookieStore.set(LEGACY_ANON_COOKIE_NAME, "", {
    ...getGuestUserCookieOptions(),
    maxAge: 0,
  });
}

async function getRegisteredAuthContext() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const guestUserId = await getStoredGuestUserId();
    const userId = await syncRegisteredUser(user.id, user.email ?? null, guestUserId);
    return { userId, isRegistered: true };
  }

  return null;
}

async function getExistingGuestAuthContext(): Promise<AuthContext> {
  const existingGuestUserId = await getStoredGuestUserId();
  if (!existingGuestUserId) {
    return { userId: null, isRegistered: false };
  }

  const db = createServerSupabase();
  const { data: existingGuestUser, error } = await db
    .from("users")
    .select("id, is_registered")
    .eq("id", existingGuestUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existingGuestUser && !existingGuestUser.is_registered) {
    return {
      userId: existingGuestUser.id,
      isRegistered: false,
    };
  }

  return { userId: null, isRegistered: false };
}

export async function getAuthContext(): Promise<AuthContext> {
  const registeredAuthContext = await getRegisteredAuthContext();
  if (registeredAuthContext) {
    return registeredAuthContext;
  }

  return getExistingGuestAuthContext();
}

export async function ensureAuthContext(): Promise<AuthContext> {
  const registeredAuthContext = await getRegisteredAuthContext();
  if (registeredAuthContext) {
    return registeredAuthContext;
  }

  const guestAuthContext = await getExistingGuestAuthContext();
  if (guestAuthContext.userId) {
    await persistGuestUserId(guestAuthContext.userId);
    return guestAuthContext;
  }

  const db = createServerSupabase();
  const { data: newGuestUser, error: insertError } = await db
    .from("users")
    .insert({ is_registered: false })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  await persistGuestUserId(newGuestUser.id);
  return {
    userId: newGuestUser.id,
    isRegistered: false,
  };
}

export async function getGuestUserIdFromCookies() {
  return getStoredGuestUserId();
}
