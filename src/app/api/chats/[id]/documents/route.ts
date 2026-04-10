import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { chunkText } from "@/lib/chunking";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createServerSupabase();

    const { data, error } = await db
      .from("documents")
      .select("id, chat_id, name, created_at")
      .eq("chat_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/chats/[id]/documents error:", err);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    if (!text.trim()) {
      return NextResponse.json(
        { error: "File is empty or could not be read" },
        { status: 400 }
      );
    }

    const db = createServerSupabase();
    const { count, error: countError } = await db
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("chat_id", chatId);

    if (countError) throw countError;

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "Only one file can be attached at a time" },
        { status: 400 }
      );
    }

    const { data: doc, error: docError } = await db
      .from("documents")
      .insert({
        chat_id: chatId,
        name: file.name,
        content: text,
      })
      .select()
      .single();

    if (docError) throw docError;

    const chunks = chunkText(text);
    const chunkRows = chunks.map((content, i) => ({
      document_id: doc.id,
      chunk_index: i,
      content,
    }));

    if (chunkRows.length > 0) {
      const { error: chunkError } = await db
        .from("document_chunks")
        .insert(chunkRows);
      if (chunkError) throw chunkError;
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("POST /api/chats/[id]/documents error:", err);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
