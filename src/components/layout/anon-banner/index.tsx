"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAnonUsage } from "@/hooks/use-anon-usage";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AnonBanner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: usage } = useAnonUsage();

  if (authLoading || isAuthenticated || !usage || usage.unlimited) return null;

  const remaining = Math.max(0, usage.limit - usage.used);

  return (
    <div className="flex items-center justify-center gap-2 bg-muted px-4 py-2 text-sm border-b">
      <Badge variant="secondary">{remaining} free messages left</Badge>
      <Link href="/login" className="text-primary hover:underline">
        Sign in for unlimited access
      </Link>
    </div>
  );
}
