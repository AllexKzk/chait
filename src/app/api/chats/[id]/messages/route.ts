import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireChatAccess } from "@/lib/chat-access";
import { MAX_MESSAGE_LENGTH } from "@/lib/security";

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
}).strict();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db, errorResponse } = await requireChatAccess(id);

    if (errorResponse) {
      return errorResponse;
    }

    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("chat_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/chats/[id]/messages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db, errorResponse } = await requireChatAccess(id);

    if (errorResponse) {
      return errorResponse;
    }

    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("messages")
      .insert({
        chat_id: id,
        role: "user",
        content: parsed.data.content,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/chats/[id]/messages error:", err);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
