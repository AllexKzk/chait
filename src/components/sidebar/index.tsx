"use client";

import { useRouter, useParams } from "next/navigation";
import { Plus, Menu, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chats";
import { useState } from "react";
import { UserSettingsDialog } from "@/components/settings/user-settings-dialog";
import { ChatItem } from "./chat-item";
import { ThemeToggle } from "./theme-toggle";
import type { Chat } from "@/types";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const params = useParams();
  const activeChatId = params?.id as string | undefined;

  const { data: chats = [], isLoading } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const [showSettings, setShowSettings] = useState(false);

  const handleNewChat = async () => {
    createChat.mutate(undefined, {
      onSuccess: (chat: Chat) => {
        router.push(`/c/${chat.id}`);
        onNavigate?.();
      },
    });
  };

  const handleSelect = (chatId: string) => {
    router.push(`/c/${chatId}`);
    onNavigate?.();
  };

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat.mutate(chatId);
    if (activeChatId === chatId) {
      router.push("/");
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold text-sm">Chats</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            disabled={createChat.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {isLoading && (
              <p className="p-3 text-xs text-muted-foreground">Loading...</p>
            )}
            {!isLoading && chats.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">No chats yet</p>
            )}
            {chats.map((chat: Chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <CircleUser className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <UserSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex h-full w-64 flex-col border-r bg-muted/30">
        <SidebarContent />
      </aside>

      <div className="md:hidden absolute top-3 left-3 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
