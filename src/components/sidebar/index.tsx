"use client";

import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChats } from "@/hooks/use-chats";
import { ChatItem } from "./chat-item";
import type { Chat } from "@/types";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimatedChat = {
  chat: Chat;
  state: "idle" | "entering" | "exiting";
};

export function Sidebar() {
  const params = useParams();
  const activeChatId = params?.id as string | undefined;
  const router = useRouter();
  const { data: chats = [], isFetched } = useChats();
  const previousChatsRef = useRef<Chat[] | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [animatedChats, setAnimatedChats] = useState<AnimatedChat[]>([]);
  const [visibleChatId, setVisibleChatId] = useState<string | null>(null);

  const handleSelect = (chatId: string) => {
    router.push(`/c/${chatId}`);
  };

  useLayoutEffect(() => {
    if (!isFetched) {
      return;
    }

    if (previousChatsRef.current === null) {
      previousChatsRef.current = chats;
      setAnimatedChats(chats.map((chat) => ({ chat, state: "idle" })));
      return;
    }

    const previousChats = previousChatsRef.current;
    const currentChatIds = new Set(chats.map((chat) => chat.id));
    const previousChatIds = new Set(previousChats.map((chat) => chat.id));

    const addedChat = chats.find((chat) => !previousChatIds.has(chat.id));
    const removedChat = previousChats.find(
      (chat) => !currentChatIds.has(chat.id)
    );

    previousChatsRef.current = chats;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (addedChat) {
      setAnimatedChats(
        chats.map((chat) => ({
          chat,
          state: chat.id === addedChat.id ? "entering" : "idle",
        }))
      );
      setVisibleChatId(null);

      requestAnimationFrame(() => {
        setVisibleChatId(addedChat.id);
      });

      timeoutRef.current = window.setTimeout(() => {
        setAnimatedChats(chats.map((chat) => ({ chat, state: "idle" })));
        setVisibleChatId(null);
      }, 520);
      return;
    }

    if (removedChat) {
      setAnimatedChats(
        previousChats.map((chat) => ({
          chat,
          state: chat.id === removedChat.id ? "exiting" : "idle",
        }))
      );
      setVisibleChatId(removedChat.id);

      requestAnimationFrame(() => {
        setVisibleChatId(null);
      });

      timeoutRef.current = window.setTimeout(() => {
        setAnimatedChats(chats.map((chat) => ({ chat, state: "idle" })));
      }, 360);
      return;
    }

    setAnimatedChats(chats.map((chat) => ({ chat, state: "idle" })));

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [chats, isFetched]);

  return (
    <aside className="relative h-full pt-11">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col pl-3 pt-3">
          {animatedChats.map(({ chat, state }) => (
            <div
              key={chat.id}
              className={cn(
                "overflow-hidden transition-[max-height,margin] duration-200 ease-out",
                state === "entering" &&
                  (visibleChatId === chat.id
                    ? "mb-2 max-h-8"
                    : "mb-0 max-h-0"),
                state === "exiting" &&
                  (visibleChatId === chat.id
                    ? "mb-2 max-h-8"
                    : "mb-0 max-h-0 delay-150"),
                state === "idle" && "mb-2 max-h-8 last:mb-0"
              )}
            >
              <div
                className={cn(
                  "transition duration-300 ease-out",
                  state === "entering" &&
                    (visibleChatId === chat.id
                      ? "translate-x-0 opacity-100 delay-200"
                      : "-translate-x-full opacity-0"),
                  state === "exiting" &&
                    (visibleChatId === chat.id
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-full opacity-0")
                )}
              >
                <ChatItem
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
