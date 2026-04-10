"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChats, useCreateChat } from "@/hooks/use-chats";
import type { Chat } from "@/types";

export function ChatBootstrapRedirect() {
  const router = useRouter();
  const { data: chats, isLoading, isError } = useChats();
  const createChat = useCreateChat();
  const hasRedirectedRef = useRef(false);
  const hasRequestedChatRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current || isError) return;

    const latestChat = chats?.[0];
    if (latestChat) {
      hasRedirectedRef.current = true;
      router.replace(`/c/${latestChat.id}`);
      return;
    }

    if (isLoading || hasRequestedChatRef.current || chats?.length !== 0) {
      return;
    }

    hasRequestedChatRef.current = true;
    createChat.mutate(undefined, {
      onSuccess: (chat: Chat) => {
        hasRedirectedRef.current = true;
        router.replace(`/c/${chat.id}`);
      },
      onError: () => {
        hasRequestedChatRef.current = false;
      },
    });
  }, [chats, createChat, isError, isLoading, router]);

  if (isError || createChat.isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        Failed to open chat. Refresh and try again.
      </div>
    );
  }

  return <div className="flex flex-1" />;
}
