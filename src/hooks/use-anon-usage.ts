"use client";

import { useQuery } from "@tanstack/react-query";

interface AnonUsage {
  used: number;
  limit: number;
  unlimited: boolean;
}

async function fetchUsage(): Promise<AnonUsage> {
  const res = await fetch("/api/anon/usage", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export function useAnonUsage() {
  return useQuery<AnonUsage>({
    queryKey: ["anon-usage"],
    queryFn: fetchUsage,
    staleTime: 30 * 1000,
  });
}
