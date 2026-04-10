"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiKey } from "@/components/header/user-settings-dialog";
import { DEFAULT_MODEL, FREE_MODEL_ID } from "@/lib/openrouter";
import type { Message } from "@/types";

const failedMessagesStorageKey = (chatId: string) =>
  `failed-chat-messages:${chatId}`;

export interface FailedChatMessage {
  id: string;
  content: string;
  model: string;
  error: string;
  created_at: string;
}

export interface ChatErrorState {
  title: string;
  message: string;
  details?: string;
}

interface CompletionErrorPayload {
  error?: string;
  details?: unknown;
  deliveryStatus?: "delivered" | "not_delivered";
}

function readFailedMessages(chatId: string): FailedChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(failedMessagesStorageKey(chatId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeErrorDetails(details: unknown): string | undefined {
  if (!details) return undefined;

  if (typeof details === "string") {
    const trimmed = details.trim();
    if (!trimmed) return undefined;

    try {
      return normalizeErrorDetails(JSON.parse(trimmed)) ?? trimmed;
    } catch {
      return trimmed;
    }
  }

  if (typeof details === "object") {
    const record = details as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.detail === "string") {
      return record.detail;
    }

    if (
      record.error &&
      typeof record.error === "object" &&
      typeof (record.error as { message?: unknown }).message === "string"
    ) {
      return (record.error as { message: string }).message;
    }

    try {
      return JSON.stringify(details);
    } catch {
      return "Unknown error details";
    }
  }

  return String(details);
}

function isFreeModelQuotaExceeded(details: string | undefined, model: string) {
  if (model !== FREE_MODEL_ID || !details) return false;

  return /free-models-per-day|rate limit exceeded/i.test(details);
}

export function useChatCompletion(chatId: string) {
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [failedMessages, setFailedMessages] = useState<FailedChatMessage[]>([]);
  const [lastError, setLastError] = useState<ChatErrorState | null>(null);
  const [storageReadyForChatId, setStorageReadyForChatId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedMessages = readFailedMessages(chatId);
    setFailedMessages(storedMessages);
    setStorageReadyForChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (storageReadyForChatId !== chatId) return;

    if (failedMessages.length === 0) {
      window.localStorage.removeItem(failedMessagesStorageKey(chatId));
      return;
    }

    window.localStorage.setItem(
      failedMessagesStorageKey(chatId),
      JSON.stringify(failedMessages),
    );
  }, [chatId, failedMessages, storageReadyForChatId]);

  const upsertFailedMessage = useCallback(
    (message: FailedChatMessage) => {
      setFailedMessages((old) => {
        const next = old.filter((item) => item.id !== message.id);
        next.push(message);
        return next.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      });
    },
    [],
  );

  const removeFailedMessage = useCallback((messageId: string) => {
    setFailedMessages((old) => old.filter((message) => message.id !== messageId));
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const send = useCallback(
    async (
      content: string,
      model = DEFAULT_MODEL,
      options?: { failedMessageId?: string },
    ) => {
      const apiKey = getApiKey();
      const createdAt = new Date().toISOString();
      const failedMessageId =
        options?.failedMessageId ?? `failed-${crypto.randomUUID()}`;

      setLastError(null);

      if (!apiKey) {
        const errorMessage =
          "Set your OpenRouter API key in Settings and then resend the message.";
        setLastError({
          title: "Message was not delivered",
          message: errorMessage,
        });
        upsertFailedMessage({
          id: failedMessageId,
          content,
          model,
          error: errorMessage,
          created_at: createdAt,
        });
        return;
      }

      removeFailedMessage(failedMessageId);
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingReasoning("");

      // Prevent an older in-flight fetch from overwriting the optimistic user message.
      await queryClient.cancelQueries({ queryKey: ["messages", chatId] });
      const optimisticId = `temp-${crypto.randomUUID()}`;
      queryClient.setQueryData<Message[]>(["messages", chatId], (old = []) => [
        ...old,
        {
          id: optimisticId,
          chat_id: chatId,
          role: "user",
          content,
          metadata: null,
          created_at: createdAt,
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
          const err = (await res
            .json()
            .catch(() => ({ error: "Request failed" }))) as CompletionErrorPayload;
          const details = normalizeErrorDetails(err.details);
          const wasDelivered = err.deliveryStatus === "delivered";
          const freeModelQuotaExceeded = isFreeModelQuotaExceeded(details, model);

          setLastError({
            title: freeModelQuotaExceeded
              ? "Free model limit reached"
              : wasDelivered
                ? "LLM returned an error"
                : "Message was not delivered",
            message: freeModelQuotaExceeded
              ? "This OpenRouter key has exhausted its daily free-model quota. Add credits, switch to a paid model, or use another API key."
              : wasDelivered
                ? "Your message was saved, but the model could not generate a response."
                : "The message was saved locally so you can resend it.",
            details: freeModelQuotaExceeded
              ? "OpenRouter daily free-model limit reached for this API key."
              : details ?? err.error ?? "Request failed",
          });

          if (!wasDelivered) {
            queryClient.setQueryData<Message[]>(
              ["messages", chatId],
              (old = []) => old.filter((message) => message.id !== optimisticId),
            );
            upsertFailedMessage({
              id: failedMessageId,
              content,
              model,
              error: details ?? err.error ?? "Request failed",
              created_at: createdAt,
            });
          }

          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setLastError({
            title: "LLM returned an error",
            message: "Your message was saved, but the response stream did not start.",
            details: "The browser did not receive a readable stream from the server.",
          });
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
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
        queryClient.setQueryData<Message[]>(
          ["messages", chatId],
          (old = []) => old.filter((message) => message.id !== optimisticId),
        );

        const errorMessage =
          err instanceof Error ? err.message : "Network request failed";

        setLastError({
          title: "Message was not delivered",
          message: "Could not confirm delivery to the server. The message was saved locally so you can resend it.",
          details: errorMessage,
        });
        upsertFailedMessage({
          id: failedMessageId,
          content,
          model,
          error: errorMessage,
          created_at: createdAt,
        });
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingReasoning("");
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["anon-usage"] });
      }
    },
    [chatId, queryClient, removeFailedMessage, upsertFailedMessage],
  );

  const retryFailedMessage = useCallback(
    async (message: FailedChatMessage) => {
      await send(message.content, message.model, {
        failedMessageId: message.id,
      });
    },
    [send],
  );

  return {
    streamingContent,
    streamingReasoning,
    isStreaming,
    failedMessages,
    lastError,
    clearError,
    send,
    retryFailedMessage,
  };
}
