"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // For anonymous users, anonId is managed server-side via cookies.
  // We pass null here since Realtime filtering by anon_id
  // requires the anon_id value which is in an httpOnly cookie.
  // Anonymous users still get sync via query invalidation on message send.
  useRealtimeSync(user?.id ?? null, null);

  return <>{children}</>;
}
