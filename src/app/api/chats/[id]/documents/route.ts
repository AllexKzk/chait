import { NextRequest, NextResponse } from "next/server";
import { requireChatAccess } from "@/lib/chat-access";
import { chunkText } from "@/lib/chunking";
import {
  getDataUrlPayloadBytes,
  isContentLengthOverLimit,
  MAX_DOCUMENT_CHARACTERS,
  MAX_DOCUMENT_NAME_LENGTH,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_TEXT_UPLOAD_BYTES,
  MAX_UPLOAD_REQUEST_BYTES,
} from "@/lib/security";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isSupportedTextFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    normalizedName.endsWith(".txt") ||
    normalizedName.endsWith(".md") ||
    normalizedName.endsWith(".csv") ||
    normalizedName.endsWith(".json")
  );
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
    const { db, errorResponse } = await requireChatAccess(id);

    if (errorResponse) {
      return errorResponse;
    }

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
    if (
      isContentLengthOverLimit(
        req.headers.get("content-length"),
        MAX_UPLOAD_REQUEST_BYTES
      )
    ) {
      return NextResponse.json(
        { error: "Upload payload is too large" },
        { status: 413 }
      );
    }

    const { id: chatId } = await params;
    const { db, errorResponse } = await requireChatAccess(chatId);

    if (errorResponse) {
      return errorResponse;
    }

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

    if (upload.name.length > MAX_DOCUMENT_NAME_LENGTH) {
      return NextResponse.json(
        { error: "File name is too long" },
        { status: 400 }
      );
    }

    if (file && !isImageFile(file) && !isSupportedTextFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (file) {
      const maxBytes = isImageFile(file)
        ? MAX_IMAGE_UPLOAD_BYTES
        : MAX_TEXT_UPLOAD_BYTES;

      if (file.size > maxBytes) {
        return NextResponse.json(
          {
            error: isImageFile(file)
              ? "Image is too large"
              : "Document is too large",
          },
          { status: 413 }
        );
      }
    }

    if (upload.isImage && !isImageDataUrl(upload.content)) {
      return NextResponse.json(
        { error: "Invalid image payload" },
        { status: 400 }
      );
    }

    if (
      upload.isImage &&
      getDataUrlPayloadBytes(upload.content) > MAX_IMAGE_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        { error: "Image is too large" },
        { status: 413 }
      );
    }

    if (!upload.content.trim()) {
      return NextResponse.json(
        { error: "File is empty or could not be read" },
        { status: 400 }
      );
    }

    if (!upload.isImage && upload.content.length > MAX_DOCUMENT_CHARACTERS) {
      return NextResponse.json(
        { error: "Document is too large" },
        { status: 413 }
      );
    }

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
