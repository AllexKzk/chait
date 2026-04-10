"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/chat-input";

interface LandingChatInputProps {
  chatId: string;
}

export function LandingChatInput({ chatId }: LandingChatInputProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSend = (message: string, model: string) => {
    sessionStorage.setItem(
      `pending-chat:${chatId}`,
      JSON.stringify({ message, model }),
    );
    setIsNavigating(true);
    router.push(`/c/${chatId}`);
  };

  return (
    <div className="w-full">
      <div className="mx-auto overflow-hidden bg-background/90 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/75">
        <div
          className={[
            "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-16 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChatInput
            chatId={chatId}
            onSend={handleSend}
            disabled={isNavigating}
          />
        </div>
      </div>
    </div>
  );
}
