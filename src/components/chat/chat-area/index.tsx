"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Upload, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/message-bubble";
import { StreamingBubble } from "@/components/chat/message-bubble/streaming-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHero } from "@/components/chat/chat-hero";
import { useMessages } from "@/hooks/use-messages";
import { useChatCompletion } from "@/hooks/use-chat-completion";
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { data: messages = [], isLoading } = useMessages(chatId);
  const {
    streamingContent,
    streamingReasoning,
    isStreaming,
    failedMessages,
    lastError,
    clearError,
    send,
    retryFailedMessage,
  } = useChatCompletion(chatId);
  const { data: docs = [] } = useDocuments(chatId);
  const uploadDoc = useUploadDocument(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPromptHandledRef = useRef(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [isHeroDocked, setIsHeroDocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(sessionStorage.getItem(`pending-chat:${chatId}`));
  });
  const canAttach = docs.length === 0 && !uploadDoc.isPending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, failedMessages]);

  useEffect(() => {
    pendingPromptHandledRef.current = false;
    setIsHeroDocked(
      typeof window !== "undefined" &&
        Boolean(sessionStorage.getItem(`pending-chat:${chatId}`)),
    );
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      setIsHeroDocked(true);
    }
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (pendingPromptHandledRef.current) return;

    const rawPendingPrompt = sessionStorage.getItem(`pending-chat:${chatId}`);
    if (!rawPendingPrompt) return;

    pendingPromptHandledRef.current = true;
    sessionStorage.removeItem(`pending-chat:${chatId}`);

    try {
      const { message, model } = JSON.parse(rawPendingPrompt) as {
        message?: string;
        model?: string;
      };

      if (message?.trim()) {
        setIsHeroDocked(true);
        send(message, model);
      }
    } catch {
      // Ignore malformed pending prompt payloads.
    }
  }, [chatId, send]);

  useEffect(() => {
    if (!uploadToast) return;

    const timeoutId = window.setTimeout(() => {
      setUploadToast(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [uploadToast]);

  const handleSend = (content: string, model: string) => {
    setIsHeroDocked(true);
    send(content, model);
  };

  const handleAttach = () => {
    if (!canAttach) return;
    fileInputRef.current?.click();
  };

  const handleUploadFile = (file: File) => {
    uploadDoc.mutate(file, {
      onError: (error) => {
        setUploadToast(
          error instanceof Error ? error.message : "Failed to upload file",
        );
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canAttach) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4">
          {!isLoading && (
            <div
              className={cn(
                "flex justify-center px-4 transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isHeroDocked ? "pb-4 pt-0" : "pb-12 pt-[22vh]",
              )}
            >
              <ChatHero className="w-full" />
            </div>
          )}
          {messages.map((msg: Message) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {failedMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={{
                id: msg.id,
                chat_id: chatId,
                role: "user",
                content: msg.content,
                metadata: null,
                created_at: msg.created_at,
              }}
              deliveryState="failed"
              deliveryError={msg.error}
              onRetry={() => retryFailedMessage(msg)}
            />
          ))}
          {isStreaming && (
            <StreamingBubble
              content={streamingContent}
              reasoning={streamingReasoning}
            />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      {lastError && (
        <div className="mx-auto mb-3 w-full max-w-4xl px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{lastError.title}</p>
              <p className="text-foreground/90">{lastError.message}</p>
              {lastError.details && (
                <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
                  Reason: {lastError.details}
                </p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={clearError}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="mx-auto w-full">
        <ChatInput
          chatId={chatId}
          onSend={handleSend}
          onAttach={handleAttach}
          onPasteImage={handleUploadFile}
          disabled={isStreaming}
          canAttach={canAttach}
          showAttach
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/bmp"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadToast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm">
          <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-destructive/25 bg-background px-4 py-3 shadow-lg">
            <Upload className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="text-sm font-medium">File upload failed</p>
              <p className="wrap-break-word text-xs text-muted-foreground">
                {uploadToast}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
