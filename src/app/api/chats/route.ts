import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { ensureAuthContext, getAuthContext } from "@/lib/auth";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

export async function GET() {
  try {
    const { userId, isRegistered } = await getAuthContext();
    const db = isRegistered
      ? await createAuthServerClient()
      : createServerSupabase();

    if (isRegistered) {
      const { data, error } = await db
        .from("chats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    const { data, error } = await db
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

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
    const { userId, isRegistered } = await ensureAuthContext();
    const db = isRegistered
      ? await createAuthServerClient()
      : createServerSupabase();

    if (!isRegistered) {
      const { data: existingChat, error: existingChatError } = await db
        .from("chats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingChatError) throw existingChatError;
      if (existingChat) {
        return NextResponse.json(existingChat);
      }
    }

    const { data, error } = await db
      .from("chats")
      .insert({
        user_id: userId,
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
