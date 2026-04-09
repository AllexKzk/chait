"use client";

import { Trash2 } from "lucide-react";
import type { Chat } from "@/types";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  return (
    <button
      onClick={() => onSelect(chat.id)}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-accent group transition-colors w-full",
        isActive && "bg-accent font-medium"
      )}
    >
      <span className="truncate flex-1">{chat.title}</span>
      <Trash2
        className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 ml-2 hover:text-destructive"
        onClick={(e) => onDelete(e, chat.id)}
      />
    </button>
  );
}
