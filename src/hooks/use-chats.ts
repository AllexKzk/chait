"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Chat } from "@/types";

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats");
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

async function createChat(): Promise<Chat> {
  const res = await fetch("/api/chats", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create chat");
  return res.json();
}

async function deleteChat(id: string): Promise<void> {
  const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete chat");
}

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });
}

export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChat,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });
}

export function useDeleteChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    onMutate: async (deletedChatId: string) => {
      await qc.cancelQueries({ queryKey: ["chats"] });
      const previousChats = qc.getQueryData<Chat[]>(["chats"]);

      qc.setQueryData<Chat[]>(["chats"], (old = []) =>
        old.filter((chat) => chat.id !== deletedChatId)
      );

      return { previousChats };
    },
    onError: (_error, _deletedChatId, context) => {
      if (context?.previousChats) {
        qc.setQueryData(["chats"], context.previousChats);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });
}
