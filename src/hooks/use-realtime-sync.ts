"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRealtimeClient } from "@/lib/supabase-client";

export function useRealtimeSync(userId: string | null, chatId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !chatId) return;

    const supabase = getRealtimeClient();

    const channel = supabase
      .channel(`chat-${chatId}-changes`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${chatId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${chatId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient, userId]);
}
