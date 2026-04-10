"use client";

import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chats";
import { useState } from "react";
import { ChatItem } from "./chat-item";
import type { Chat } from "@/types";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const params = useParams();
  const activeChatId = params?.id as string | undefined;
  const router = useRouter();
  const { data: chats = [] } = useChats();
  const deleteChat = useDeleteChat();

  const handleSelect = (chatId: string) => {
    router.push(`/c/${chatId}`);
  };

  return (
    <aside className="relative h-full pt-11">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 pl-3 pt-3">
          {chats.map((chat: Chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
