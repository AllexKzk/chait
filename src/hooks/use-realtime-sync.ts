"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRealtimeClient } from "@/lib/supabase-client";

export function useRealtimeSync(userId: string | null, anonId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId && !anonId) return;

    const supabase = getRealtimeClient();

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        (payload) => {
          const chat = payload.new as { user_id: string | null; anon_id: string | null };
          const isOwner =
            (userId && chat.user_id === userId) ||
            (!userId && anonId && chat.anon_id === anonId);

          if (isOwner) {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { chat_id: string };
          queryClient.invalidateQueries({
            queryKey: ["messages", msg.chat_id],
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chats" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, anonId, queryClient]);
}
