import { NextResponse } from "next/server";
import { requireChatAccess } from "@/lib/chat-access";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db, errorResponse } = await requireChatAccess(id);

    if (errorResponse) {
      return errorResponse;
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
