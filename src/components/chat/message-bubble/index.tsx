"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "./markdown-content";
import { ReasoningBlock } from "./reasoning-block";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingReasoning?: string;
  deliveryState?: "sent" | "failed";
  deliveryError?: string;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isStreaming = false,
  streamingReasoning = "",
  deliveryState = "sent",
  deliveryError,
  onRetry,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const reasoningDetails = message.metadata?.reasoning_details;
  const persistedReasoning = reasoningDetails?.map((r) => r.content).join("\n") ?? "";
  const reasoningContent = streamingReasoning || persistedReasoning;
  const hasReasoning = reasoningContent.trim().length > 0;
  const hasContent = message.content.trim().length > 0;
  const isFailedDelivery = deliveryState === "failed";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? isFailedDelivery
              ? "border border-destructive/30 bg-destructive/10 text-foreground"
              : "bg-primary text-primary-foreground"
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
        {isFailedDelivery && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Message not delivered</p>
                {deliveryError && <p className="wrap-break-word">{deliveryError}</p>}
              </div>
            </div>
            {onRetry && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="shrink-0"
                onClick={onRetry}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Resend
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
