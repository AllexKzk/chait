import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

const FREE_LIMIT = 3;

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
    const { data: usage } = await db
      .from("anon_usage")
      .select("message_count")
      .eq("anon_id", anonId)
      .single();

    return NextResponse.json({
      used: usage?.message_count ?? 0,
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
