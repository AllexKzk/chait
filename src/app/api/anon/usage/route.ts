import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { FREE_LIMIT, getAnonUsageCount } from "@/lib/anon-usage";

export async function GET() {
  try {
    const { userId, anonId } = await getAuthContext();

    if (userId) {
      return NextResponse.json({ used: 0, limit: FREE_LIMIT, unlimited: true });
    }

    if (!anonId) {
      return NextResponse.json({ used: 0, limit: FREE_LIMIT, unlimited: false });
    }

    const db = createServerSupabase();
    const used = await getAnonUsageCount(db, anonId);

    return NextResponse.json({
      used,
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
