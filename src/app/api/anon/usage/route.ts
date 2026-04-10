import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { FREE_LIMIT, getRemainingFreeMessages } from "@/lib/anon-usage";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

export async function GET() {
  try {
    const { userId, isRegistered } = await getAuthContext();
    if (isRegistered) {
      return NextResponse.json({ used: 0, limit: FREE_LIMIT, unlimited: true });
    }

    const db = isRegistered
      ? await createAuthServerClient()
      : createServerSupabase();
    const remaining = await getRemainingFreeMessages(db, userId);

    return NextResponse.json({
      used: Math.max(0, FREE_LIMIT - remaining),
      limit: FREE_LIMIT,
      unlimited: false,
    });
  } catch (err) {
    console.error("GET /api/anon/usage error:", err);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
