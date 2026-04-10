"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "openrouter-api-key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function UserSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getApiKey());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    onOpenChange(false);
    signOut();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        {isAuthenticated && (
          <DialogHeader>
            <DialogTitle>{isAuthenticated}</DialogTitle>
            <DialogDescription>
              {isAuthenticated && `Signed in as ${user?.email}`}
            </DialogDescription>
          </DialogHeader>
        )}

        <div className="flex flex-col gap-4">
          {isAuthenticated ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  OpenRouter API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-or-..."
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setSaved(false);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Stored in your browser only. Never sent to our server.
                </p>
                <Button onClick={handleSave} size="sm">
                  {saved ? "Saved!" : "Save key"}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = "/auth?type=signup";
                }}
              >
                <UserPlus className="h-4 w-4" />
                Sign up
              </Button>
              <div className="flex gap-5">
                <Separator className="flex-1 my-auto" />
                or
                <Separator className="flex-1 my-auto" />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = "/auth";
                }}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
