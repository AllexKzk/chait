import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabase-browser";

export function getRealtimeClient(): SupabaseClient {
  return getSupabaseBrowser();
}
