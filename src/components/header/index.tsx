"use client";

import { PanelLeft } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserButton } from "./user-button";
import { AddChatButton } from "./add-chat-button";
import { useEffect, useState } from "react";
import { DeleteChatButton } from "./delete-chat-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <header className="absolute top-3 z-50 flex w-full items-start justify-between gap-2 px-3">
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <UserButton />
          <ThemeToggle />
          <AddChatButton />
        </div>
        <DeleteChatButton />
      </header>
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm gap-0 p-0 md:hidden">
          <SheetHeader className="border-b">
            <SheetTitle>Chats</SheetTitle>
            <SheetDescription>Switch between your recent conversations.</SheetDescription>
          </SheetHeader>
          <Sidebar
            className="min-h-0 flex-1 w-full pt-0"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
