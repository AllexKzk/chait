"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CHAT_HERO_ANIMATION_KEY = "chat-hero-animation-played";

interface ChatHeroProps {
  className?: string;
}

export function ChatHero({ className }: ChatHeroProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const hasPlayedAnimation = window.sessionStorage.getItem(
      CHAT_HERO_ANIMATION_KEY,
    );

    if (hasPlayedAnimation) {
      return;
    }

    setShouldAnimate(true);
    window.sessionStorage.setItem(CHAT_HERO_ANIMATION_KEY, "true");
  }, []);

  return (
    <div
      className={cn(
        "text-center",
        shouldAnimate
          ? "hero-gradient-reveal"
          : "hero-gradient-reveal hero-gradient-reveal--static",
        className,
      )}
    >
      <h1 className="hero-gradient-reveal__title mb-2 text-4xl font-bold">
        CH<i>AI</i>T
      </h1>
      <p className="hero-gradient-reveal__subtitle text-muted-foreground">
        Another one AI chat UI for test assignment.
      </p>
    </div>
  );
}
