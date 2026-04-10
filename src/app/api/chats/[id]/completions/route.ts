import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { getAuthContext, ensureAnonId } from "@/lib/auth";
import {
  FREE_LIMIT,
  getAnonUsageCount,
  incrementAnonUsage,
} from "@/lib/anon-usage";
import {
  OPENROUTER_API_URL,
  DEFAULT_MODEL,
  FREE_MODEL_ID,
} from "@/lib/openrouter";

const completionSchema = z.object({
  content: z.string().min(1),
  model: z.string().optional(),
});

type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface HistoryMessage {
  role: "user" | "assistant" | "system";
  content: string | MessageContentPart[];
  reasoning_details?: { type: string; content: string }[];
}

function isImageAttachment(content: string | null) {
  return typeof content === "string" && content.startsWith("data:image/");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;
    const llmKey = req.headers.get("x-llm-key");

    if (!llmKey) {
      return Response.json(
        { error: "Missing OpenRouter API key" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = completionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = await getAuthContext();
    const anonId = userId ? null : await ensureAnonId();

    const db = createServerSupabase();

    const { data: chat } = await db
      .from("chats")
      .select("id, user_id, anon_id")
      .eq("id", chatId)
      .single();

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const isOwner =
      (userId && chat.user_id === userId) ||
      (!userId && anonId && chat.anon_id === anonId);

    if (!isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!userId && anonId) {
      const usageCount = await getAnonUsageCount(db, anonId);

      if (usageCount >= FREE_LIMIT) {
        return Response.json(
          {
            error:
              "Free message limit reached. Please sign in to continue.",
          },
          { status: 403 }
        );
      }
    }

    await db.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: parsed.data.content,
    });

    // Increment anonymous usage counter
    if (!userId && anonId) {
      await incrementAnonUsage(db, anonId);
    }

    const { count: msgCount } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("chat_id", chatId);

    if (msgCount === 1) {
      const title =
        parsed.data.content.length > 50
          ? parsed.data.content.slice(0, 50) + "..."
          : parsed.data.content;
      await db.from("chats").update({ title }).eq("id", chatId);
    }

    // Load history including metadata (for reasoning_details)
    const { data: history } = await db
      .from("messages")
      .select("role, content, metadata")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    const model = parsed.data.model || DEFAULT_MODEL;
    const isFreeModel = model === FREE_MODEL_ID;

    const messages: HistoryMessage[] = (history ?? []).map((m) => {
      const msg: HistoryMessage = {
        role: m.role as "user" | "assistant",
        content: m.content,
      };
      // Preserve reasoning_details for assistant messages (needed by free model)
      if (
        m.role === "assistant" &&
        m.metadata?.reasoning_details
      ) {
        msg.reasoning_details = m.metadata.reasoning_details;
      }
      return msg;
    });

    const { data: attachedDocs } = await db
      .from("documents")
      .select("id, name, content")
      .eq("chat_id", chatId);

    const textDocIds =
      attachedDocs
        ?.filter((doc) => !isImageAttachment(doc.content))
        .map((doc) => doc.id) ?? [];

    // RAG context
    const { data: chunks } =
      textDocIds.length > 0
        ? await db
            .from("document_chunks")
            .select("content, document_id")
            .in("document_id", textDocIds)
        : { data: [] as { content: string; document_id: string }[] };

    const systemParts: string[] = ["You are a helpful assistant."];

    if (chunks && chunks.length > 0) {
      const context = chunks.map((c) => c.content).join("\n\n---\n\n");
      systemParts.push(
        `The user has uploaded documents. Use the following context to answer questions:\n\n${context}`
      );
    }

    // Build the OpenRouter request body
    const imageMessages: HistoryMessage[] =
      attachedDocs
        ?.filter((doc) => isImageAttachment(doc.content))
        .map((doc) => ({
          role: "user",
          content: [
            {
              type: "text",
              text: `The user attached an image named "${doc.name}". Use it as conversation context.`,
            },
            {
              type: "image_url",
              image_url: { url: doc.content! },
            },
          ],
        })) ?? [];

    const requestBody: Record<string, unknown> = {
      model,
      stream: true,
      messages: [
        { role: "system", content: systemParts.join("\n\n") },
        ...imageMessages,
        ...messages,
      ],
    };

    if (isFreeModel) {
      requestBody.reasoning = { enabled: true };
    }

    const openRouterRes = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") ?? "http://localhost:3000",
      },
      body: JSON.stringify(requestBody),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("OpenRouter error:", errText);
      return Response.json(
        { error: "LLM request failed", details: errText },
        { status: 502 }
      );
    }

    const reader = openRouterRes.body?.getReader();
    if (!reader) {
      return Response.json(
        { error: "No stream from LLM" },
        { status: 502 }
      );
    }

    let fullContent = "";
    let fullReasoning = "";

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            // Forward raw SSE to client
            controller.enqueue(encoder.encode(text));

            const lines = text.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
                try {
                  const json = JSON.parse(line.slice(6));
                  const delta = json.choices?.[0]?.delta;
                  if (delta?.content) {
                    fullContent += delta.content;
                  }
                  if (delta?.reasoning) {
                    fullReasoning += delta.reasoning;
                  }
                } catch {
                  // skip
                }
              }
            }
          }
        } finally {
          controller.close();

          if (fullContent) {
            const metadata =
              fullReasoning
                ? {
                    reasoning_details: [
                      { type: "thinking", content: fullReasoning },
                    ],
                  }
                : null;

            await db.from("messages").insert({
              chat_id: chatId,
              role: "assistant",
              content: fullContent,
              metadata,
            });
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("POST /api/chats/[id]/completions error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
