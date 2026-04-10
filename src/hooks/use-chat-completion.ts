"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiKey } from "@/components/header/user-settings-dialog";
import type { Message } from "@/types";

export function useChatCompletion(chatId: string) {
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  const send = useCallback(
    async (content: string, model?: string) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        alert(
          "Please set your OpenRouter API key first (Settings in sidebar).",
        );
        return;
      }

      setIsStreaming(true);
      setStreamingContent("");
      setStreamingReasoning("");

      queryClient.setQueryData<Message[]>(["messages", chatId], (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          chat_id: chatId,
          role: "user",
          content,
          metadata: null,
          created_at: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch(`/api/chats/${chatId}/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-llm-key": apiKey,
          },
          body: JSON.stringify({ content, model }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Request failed" }));
          alert(err.error || "Request failed");
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let accContent = "";
        let accReasoning = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  accContent += delta.content;
                  setStreamingContent(accContent);
                }
                if (delta?.reasoning) {
                  accReasoning += delta.reasoning;
                  setStreamingReasoning(accReasoning);
                }
              } catch {
                // skip
              }
            }
          }
        }

        if (accContent || accReasoning) {
          queryClient.setQueryData<Message[]>(
            ["messages", chatId],
            (old = []) => [
              ...old,
              {
                id: `temp-assistant-${Date.now()}`,
                chat_id: chatId,
                role: "assistant",
                content: accContent,
                metadata: accReasoning
                  ? {
                      reasoning_details: [
                        { type: "thinking", content: accReasoning },
                      ],
                    }
                  : null,
                created_at: new Date().toISOString(),
              },
            ],
          );
        }
      } catch (err) {
        console.error("Streaming error:", err);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingReasoning("");
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["anon-usage"] });
      }
    },
    [chatId, queryClient],
  );

  return { streamingContent, streamingReasoning, isStreaming, send };
}
