import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  clearGuestUserId,
  getGuestUserIdFromCookies,
  syncRegisteredUser,
} from "@/lib/auth";

export async function POST() {
  try {
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

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const guestUserId = await getGuestUserIdFromCookies();
    await syncRegisteredUser(user.id, user.email ?? null, guestUserId);
    await clearGuestUserId();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
