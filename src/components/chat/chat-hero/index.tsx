"use client";

import { cn } from "@/lib/utils";

interface ChatHeroProps {
  className?: string;
}

export function ChatHero({ className }: ChatHeroProps) {
  return (
    <div className={cn("hero-gradient-reveal text-center", className)}>
      <h1 className="hero-gradient-reveal__title mb-2 text-3xl font-bold sm:text-4xl">
        CH<i>AI</i>T
      </h1>
      <p className="hero-gradient-reveal__subtitle px-4 text-sm text-muted-foreground sm:text-base">
        Another one AI chat UI for test assignment.
      </p>
    </div>
  );
}
