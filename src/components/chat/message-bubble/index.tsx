"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./markdown-content";
import { ReasoningBlock } from "./reasoning-block";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingReasoning?: string;
}

export function MessageBubble({
  message,
  isStreaming = false,
  streamingReasoning = "",
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const reasoningDetails = message.metadata?.reasoning_details;
  const persistedReasoning = reasoningDetails?.map((r) => r.content).join("\n") ?? "";
  const reasoningContent = streamingReasoning || persistedReasoning;
  const hasReasoning = reasoningContent.trim().length > 0;
  const hasContent = message.content.trim().length > 0;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {hasReasoning && (
          isStreaming ? (
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                <span>Thinking...</span>
              </div>
              <div className="max-h-[200px] overflow-y-auto rounded-md border bg-background/50 p-2.5 text-xs text-muted-foreground">
                <MarkdownContent content={reasoningContent} compact />
              </div>
            </div>
          ) : (
            <ReasoningBlock content={reasoningContent} />
          )
        )}
        {hasContent ? (
          <MarkdownContent content={message.content} />
        ) : (
          isStreaming &&
          !hasReasoning && <span className="text-muted-foreground">Thinking...</span>
        )}
      </div>
    </div>
  );
}
