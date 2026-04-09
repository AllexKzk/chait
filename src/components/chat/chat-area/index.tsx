"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageBubble,
  StreamingBubble,
} from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { DocumentList } from "@/components/chat/document-list";
import { useMessages } from "@/hooks/use-messages";
import { useChatCompletion } from "@/hooks/use-chat-completion";
import { useUploadDocument } from "@/hooks/use-documents";
import type { Message } from "@/types";

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { data: messages = [], isLoading } = useMessages(chatId);
  const { streamingContent, streamingReasoning, isStreaming, send } =
    useChatCompletion(chatId);
  const uploadDoc = useUploadDocument(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = (content: string, model: string) => {
    send(content, model);
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDoc.mutate(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DocumentList chatId={chatId} />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Loading messages...
            </p>
          )}
          {!isLoading && messages.length === 0 && !isStreaming && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Send a message to start the conversation.
            </p>
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
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          disabled={isStreaming}
          showAttach
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
