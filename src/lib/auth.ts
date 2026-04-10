import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase-server";
import { v4 as uuid } from "uuid";
import { clearFallbackAnonUsage } from "./anon-usage";

export interface AuthContext {
  userId: string | null;
  anonId: string | null;
}

const ANON_COOKIE_NAME = "anon_id";

function getAnonCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function syncUserAndMigrateAnonChat(
  authUserId: string,
  email: string,
  anonId?: string | null,
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
    const result = await db
      .from("users")
      .upsert({ email, auth_user_id: authUserId }, { onConflict: "email" })
      .select("id, email")
      .single();

    if (result.error) {
      throw result.error;
    }

    dbUser = result.data;
  } else if (dbUser.email !== email) {
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

  if (anonId) {
    const { data: latestAnonChat, error: chatError } = await db
      .from("chats")
      .select("id")
      .eq("anon_id", anonId)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (chatError) {
      throw chatError;
    }

    if (latestAnonChat) {
      const { error: updateError } = await db
        .from("chats")
        .update({ user_id: dbUser.id, anon_id: null })
        .eq("id", latestAnonChat.id);

      if (updateError) {
        throw updateError;
      }
    }
  }

  return dbUser.id;
}

export async function clearAnonId() {
  const cookieStore = await cookies();
  cookieStore.set(ANON_COOKIE_NAME, "", {
    ...getAnonCookieOptions(),
    maxAge: 0,
  });
  await clearFallbackAnonUsage();
}

export async function getAuthContext(): Promise<AuthContext> {
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

  if (user?.id && user.email) {
    const userId = await syncUserAndMigrateAnonChat(user.id, user.email);
    return { userId, anonId: null };
  }

  const anonId = cookieStore.get(ANON_COOKIE_NAME)?.value ?? null;
  return { userId: null, anonId };
}

export async function ensureAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = uuid();
  cookieStore.set(ANON_COOKIE_NAME, id, getAnonCookieOptions());
  return id;
}
