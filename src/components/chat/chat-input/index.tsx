"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/chat/model-selector";
import { DEFAULT_MODEL } from "@/lib/openrouter";

interface ChatInputProps {
  onSend: (message: string, model: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
  showAttach?: boolean;
}

export function ChatInput({
  onSend,
  onAttach,
  disabled = false,
  showAttach = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="border-t p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ModelSelector value={model} onChange={setModel} />
      </div>
      <div className="flex items-end gap-2">
        {showAttach && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onAttach}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
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
        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
