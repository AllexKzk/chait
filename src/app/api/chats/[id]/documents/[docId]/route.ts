import { NextResponse } from "next/server";
import { requireChatAccess } from "@/lib/chat-access";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const { db, errorResponse } = await requireChatAccess(id);

    if (errorResponse) {
      return errorResponse;
    }

    const { data: deletedDoc, error } = await db
      .from("documents")
      .delete()
      .eq("id", docId)
      .eq("chat_id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!deletedDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/chats/[id]/documents/[docId] error:", err);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
