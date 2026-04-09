import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getAuthContext } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, anonId } = await getAuthContext();
    const db = createServerSupabase();

    const { data: chat } = await db
      .from("chats")
      .select("user_id, anon_id")
      .eq("id", id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const isOwner =
      (userId && chat.user_id === userId) ||
      (!userId && anonId && chat.anon_id === anonId);

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await db.from("chats").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/chats/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
