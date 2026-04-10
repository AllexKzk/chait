"use client";

import { CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserSettingsDialog } from "@/components/header/user-settings-dialog";

export function UserButton() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowSettings(true)}
      >
        <CircleUser className="h-5 w-5" />
      </Button>
      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
