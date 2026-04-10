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
import { MAX_MESSAGE_LENGTH } from "@/lib/security";
import { DocumentList } from "../document-list";

interface ChatInputProps {
  onSend: (message: string, model: string) => void;
  onAttach?: () => void;
  onPasteImage?: (file: File) => void;
  disabled?: boolean;
  showAttach?: boolean;
  chatId: string;
  canAttach?: boolean;
}

function getPastedImageFile(items: DataTransferItemList) {
  for (const item of items) {
    if (!item.type.startsWith("image/")) continue;

    const file = item.getAsFile();
    if (!file) continue;

    const mimeSubtype = file.type.split("/")[1]?.split("+")[0] ?? "png";
    const fileName =
      file.name || `pasted-image-${Date.now()}.${mimeSubtype.toLowerCase()}`;

    return new File([file], fileName, {
      type: file.type || "image/png",
      lastModified: Date.now(),
    });
  }

  return null;
}

export function ChatInput({
  onSend,
  onAttach,
  onPasteImage,
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || !canAttach || !onPasteImage) return;

    const file = getPastedImageFile(e.clipboardData.items);
    if (!file) return;

    e.preventDefault();
    onPasteImage(file);
  };

  return (
    <div className="mx-auto mb-3 flex max-w-4xl flex-col gap-3 rounded-2xl border p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
            <Button
              variant="outline"
              size="xs"
              onClick={onAttach}
              disabled={disabled || !onAttach || !canAttach}
              className="h-8 justify-start rounded-lg min-[420px]:h-full"
            >
              <Paperclip />
              <span className="truncate text-muted-foreground">
                {canAttach ? "Attach file or image" : "1 attachment max"}
              </span>
            </Button>
            <ModelSelector
              value={model}
              onChange={setModel}
              className="h-8 w-full min-[420px]:w-auto"
            />
          </div>
          <DocumentList chatId={chatId} />
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {showAnonUsage && remainingMessages !== null && (
            <Badge
              variant="outline"
              className="h-8 rounded-sm text-muted-foreground"
            >
              {remainingMessages} free messages left
            </Badge>
          )}
          <Button
            size="icon"
            variant="outline"
            onClick={handleSubmit}
            disabled={disabled || !value.trim() || remainingMessages === 0}
            className="shrink-0"
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
          onPaste={handlePaste}
          placeholder="Type a message..."
          maxLength={MAX_MESSAGE_LENGTH}
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
