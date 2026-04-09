"use client";

import type { Message } from "@/types";
import { MessageBubble } from "./index";

interface StreamingBubbleProps {
  content: string;
  reasoning: string;
}

export function StreamingBubble({ content, reasoning }: StreamingBubbleProps) {
  const streamingMessage: Message = {
    id: "streaming-assistant",
    chat_id: "streaming",
    role: "assistant",
    content,
    metadata: null,
    created_at: new Date(0).toISOString(),
  };

  return (
    <MessageBubble
      message={streamingMessage}
      isStreaming
      streamingReasoning={reasoning}
    />
  );
}
