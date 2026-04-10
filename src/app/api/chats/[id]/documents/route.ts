import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { chunkText } from "@/lib/chunking";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isImageDataUrl(value: string) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

async function readUploadContent(file: File) {
  if (!isImageFile(file)) {
    return {
      content: await file.text(),
      isImage: false,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    content: `data:${file.type};base64,${buffer.toString("base64")}`,
    isImage: true,
  };
}

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
    const imageDataUrl = formData.get("imageDataUrl");
    const file = formData.get("file") as File | null;

    const upload =
      typeof imageDataUrl === "string"
        ? {
            name: file?.name ?? "image",
            content: imageDataUrl,
            isImage: true,
          }
        : file
          ? {
              name: file.name,
              ...(await readUploadContent(file)),
            }
          : null;

    if (!upload) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (upload.isImage && !isImageDataUrl(upload.content)) {
      return NextResponse.json(
        { error: "Invalid image payload" },
        { status: 400 }
      );
    }

    if (!upload.content.trim()) {
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
        name: upload.name,
        content: upload.content,
      })
      .select()
      .single();

    if (docError) throw docError;

    const chunks = upload.isImage ? [] : chunkText(upload.content);
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
