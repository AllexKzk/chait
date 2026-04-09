"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

async function fetchUser(): Promise<User | null> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const subscribed = useRef(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    const supabase = getSupabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    });

    return () => {
      subscription.unsubscribe();
      subscribed.current = false;
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    router.push("/login");
  }, [queryClient, router]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
