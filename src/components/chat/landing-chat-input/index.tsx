"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/chat-input";
import { useCreateChat } from "@/hooks/use-chats";
import type { Chat } from "@/types";

export function LandingChatInput() {
  const router = useRouter();
  const createChat = useCreateChat();
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSend = (message: string, model: string) => {
    setIsNavigating(true);
    createChat.mutate(undefined, {
      onSuccess: (chat: Chat) => {
        sessionStorage.setItem(
          `pending-chat:${chat.id}`,
          JSON.stringify({ message, model }),
        );
        router.push(`/c/${chat.id}`);
      },
      onError: () => {
        setIsNavigating(false);
      },
    });
  };

  return (
    <div className="w-full">
      <div className="mx-auto overflow-hidden bg-background/90">
        <div
          className={[
            "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-16 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChatInput
            chatId="landing"
            onSend={handleSend}
            disabled={isNavigating || createChat.isPending}
            showAttach={false}
          />
        </div>
      </div>
    </div>
  );
}
