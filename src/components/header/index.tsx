"use client";

import { ThemeToggle } from "./theme-toggle";
import { UserButton } from "./user-button";
import { AddChatButton } from "./add-chat-button";
import { useEffect, useState } from "react";
import { DeleteChatButton } from "./delete-chat-button";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="absolute top-3 px-3 z-50 flex gap-2 w-full justify-between">
      <div className="flex gap-2">
        <UserButton />
        <ThemeToggle />
        <AddChatButton />
      </div>
      <DeleteChatButton />
    </header>
  );
}
