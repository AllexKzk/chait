import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getAuthContext, ensureAnonId } from "@/lib/auth";

export async function GET() {
  try {
    const { userId, anonId } = await getAuthContext();
    const db = createServerSupabase();

    let query = db
      .from("chats")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (anonId) {
      query = query.eq("anon_id", anonId);
    } else {
      return NextResponse.json([]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/chats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { userId } = await getAuthContext();
    const anonId = userId ? null : await ensureAnonId();

    const db = createServerSupabase();
    const { data, error } = await db
      .from("chats")
      .insert({
        user_id: userId,
        anon_id: anonId,
        title: "New Chat",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/chats error:", err);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
