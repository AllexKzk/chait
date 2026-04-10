"use client";

import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useCreateChat } from "@/hooks/use-chats";
import { useRouter } from "next/navigation";
import { Chat } from "@/types";

export function AddChatButton() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const createChat = useCreateChat();

  const handleNewChat = async () => {
    createChat.mutate(undefined, {
      onSuccess: (chat: Chat) => {
        router.push(`/c/${chat.id}`);
      },
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleNewChat}
      disabled={createChat.isPending || !isAuthenticated}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
