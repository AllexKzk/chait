"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { streamingContent, streamingReasoning, isStreaming, send } =
    useChatCompletion(chatId);
  const { data: docs = [] } = useDocuments(chatId);
  const uploadDoc = useUploadDocument(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPromptHandledRef = useRef(false);
  const [isHeroDocked, setIsHeroDocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(sessionStorage.getItem(`pending-chat:${chatId}`));
  });
  const canAttach = docs.length === 0 && !uploadDoc.isPending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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

  const handleSend = (content: string, model: string) => {
    setIsHeroDocked(true);
    send(content, model);
  };

  const handleAttach = () => {
    if (!canAttach) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canAttach) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      uploadDoc.mutate(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
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
          {isStreaming && (
            <StreamingBubble
              content={streamingContent}
              reasoning={streamingReasoning}
            />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="mx-auto w-full">
        <ChatInput
          chatId={chatId}
          onSend={handleSend}
          onAttach={handleAttach}
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
    </div>
  );
}
