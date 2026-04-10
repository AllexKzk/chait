"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/chat/model-selector";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useAnonUsage } from "@/hooks/use-anon-usage";
import { DEFAULT_MODEL } from "@/lib/openrouter";
import { DocumentList } from "../document-list";

interface ChatInputProps {
  onSend: (message: string, model: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
  showAttach?: boolean;
  chatId: string;
  canAttach?: boolean;
}

export function ChatInput({
  onSend,
  onAttach,
  disabled = false,
  chatId,
  canAttach = true,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: usage } = useAnonUsage();

  const showAnonUsage =
    !authLoading && !isAuthenticated && !!usage && !usage.unlimited;
  const remainingMessages = showAnonUsage
    ? Math.max(0, usage.limit - usage.used)
    : null;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, model);
    setValue("");
    textareaRef.current?.focus();
  }, [value, disabled, onSend, model]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-3 p-4 flex flex-col gap-2 rounded-2xl border  max-w-4xl mx-auto">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={onAttach}
            disabled={disabled || !onAttach || !canAttach}
            className="h-full rounded-lg"
          >
            <Paperclip />
            <span className="text-muted-foreground">
              {canAttach ? "Attach file or image" : "1 attachment max"}
            </span>
          </Button>
          <ModelSelector value={model} onChange={setModel} />
          <DocumentList chatId={chatId} />
        </div>
        <div className="flex items-center gap-2">
          {showAnonUsage && remainingMessages !== null && (
            <Badge
              variant="outline"
              className="rounded-sm h-full text-muted-foreground"
            >
              {remainingMessages} free messages left
            </Badge>
          )}
          <Button
            size="icon"
            variant="outline"
            onClick={handleSubmit}
            disabled={disabled || !value.trim() || remainingMessages === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
