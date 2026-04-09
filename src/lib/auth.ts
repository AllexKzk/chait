import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase-server";
import { v4 as uuid } from "uuid";

export interface AuthContext {
  userId: string | null;
  anonId: string | null;
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

  if (user?.email) {
    const db = createServerSupabase();

    // Upsert to guarantee the row exists, then return the id
    const { data: dbUser } = await db
      .from("users")
      .upsert({ email: user.email }, { onConflict: "email" })
      .select("id")
      .single();

    return { userId: dbUser?.id ?? null, anonId: null };
  }

  const anonId = cookieStore.get("anon_id")?.value ?? null;
  return { userId: null, anonId };
}

export async function ensureAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("anon_id")?.value;
  if (existing) return existing;

  const id = uuid();
  cookieStore.set("anon_id", id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
