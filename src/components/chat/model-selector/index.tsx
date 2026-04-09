"use client";

import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/openrouter";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value || DEFAULT_MODEL}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
    >
      {AVAILABLE_MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
