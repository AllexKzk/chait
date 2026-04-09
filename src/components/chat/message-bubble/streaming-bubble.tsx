"use client";

import { Brain } from "lucide-react";

interface StreamingBubbleProps {
  content: string;
  reasoning: string;
}

export function StreamingBubble({ content, reasoning }: StreamingBubbleProps) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground">
        {reasoning && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Brain className="h-3 w-3 animate-pulse" />
              <span>Thinking...</span>
            </div>
            <div className="rounded-md bg-background/50 p-2.5 text-xs text-muted-foreground whitespace-pre-wrap border max-h-[200px] overflow-y-auto">
              {reasoning}
            </div>
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {content ||
            (!reasoning && (
              <span className="text-muted-foreground">Thinking...</span>
            ))}
        </div>
      </div>
    </div>
  );
}
