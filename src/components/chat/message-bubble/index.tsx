"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { ReasoningBlock } from "./reasoning-block";

export { StreamingBubble } from "./streaming-bubble";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const reasoningDetails = message.metadata?.reasoning_details;
  const hasReasoning = reasoningDetails && reasoningDetails.length > 0;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {hasReasoning && (
          <ReasoningBlock
            content={reasoningDetails.map((r) => r.content).join("\n")}
          />
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
