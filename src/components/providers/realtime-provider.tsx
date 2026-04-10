"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useParams } from "next/navigation";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams<{ id?: string }>();
  const chatId = typeof params?.id === "string" ? params.id : null;

  useRealtimeSync(user?.id ?? null, chatId);

  return <>{children}</>;
}
