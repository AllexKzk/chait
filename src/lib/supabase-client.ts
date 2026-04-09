import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let realtimeClient: SupabaseClient | null = null;

export function getRealtimeClient(): SupabaseClient {
  if (realtimeClient) return realtimeClient;

  realtimeClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { realtime: { params: { eventsPerSecond: 10 } } }
  );
  return realtimeClient;
}
