import { createServerSupabase } from "@/lib/supabase-server";

export const FREE_LIMIT = 3;

const MISSING_ANON_USAGE_CODES = new Set(["PGRST202", "PGRST205"]);

function isMissingAnonUsageSchema(code?: string) {
  return !!code && MISSING_ANON_USAGE_CODES.has(code);
}

export async function getAnonUsageCount(
  db: ReturnType<typeof createServerSupabase>,
  anonId: string,
) {
  const usageResult = await db
    .from("anon_usage")
    .select("message_count")
    .eq("anon_id", anonId)
    .maybeSingle();

  if (!usageResult.error) {
    return usageResult.data?.message_count ?? 0;
  }

  if (!isMissingAnonUsageSchema(usageResult.error.code)) {
    throw usageResult.error;
  }

  // Fallback for databases where anon_usage migration has not been applied yet.
  const chatsResult = await db.from("chats").select("id").eq("anon_id", anonId);
  if (chatsResult.error) {
    throw chatsResult.error;
  }

  const chatIds = (chatsResult.data ?? []).map((chat) => chat.id);
  if (chatIds.length === 0) {
    return 0;
  }

  const messageResult = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("chat_id", chatIds)
    .eq("role", "user");

  if (messageResult.error) {
    throw messageResult.error;
  }

  return messageResult.count ?? 0;
}

export async function incrementAnonUsage(
  db: ReturnType<typeof createServerSupabase>,
  anonId: string,
) {
  const result = await db.rpc("increment_anon_usage", { p_anon_id: anonId });
  if (!result.error) {
    return;
  }

  if (isMissingAnonUsageSchema(result.error.code)) {
    return;
  }

  throw result.error;
}
