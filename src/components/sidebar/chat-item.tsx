"use client";

import type { Chat } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function ChatItem({ chat, isActive, onSelect }: ChatItemProps) {
  return (
    <Button
      variant="outline"
      className={cn("w-[112px]", isActive && "bg-muted dark:bg-input/50")}
      onClick={() => onSelect(chat.id)}
    >
      <span className="truncate">{chat.title}</span>
    </Button>
  );
}
