"use client";

import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/openrouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  className,
}: ModelSelectorProps) {
  const resolved = value || DEFAULT_MODEL;

  return (
    <Select
      value={resolved}
      onValueChange={(next) => {
        if (next != null) onChange(next);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-full min-w-[140px] text-xs text-muted-foreground",
          className,
        )}
      >
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
