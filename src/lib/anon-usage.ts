import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_LIMIT = 3;
function missingUserQuotaSchemaError() {
  return new Error(
    "User quota schema is missing. Apply the latest Supabase migrations before serving production traffic."
  );
}

export async function getRemainingFreeMessages(
  db: SupabaseClient,
  userId: string,
) {
  const usageResult = await db
    .from("users")
    .select("remaining_free_messages")
    .eq("id", userId)
    .maybeSingle();

  if (usageResult.error) {
    throw usageResult.error;
  }

  return usageResult.data?.remaining_free_messages ?? FREE_LIMIT;
}

export async function consumeUserQuota(
  db: SupabaseClient,
  userId: string,
) {
  const result = await db.rpc("consume_user_quota", {
    p_user_id: userId,
  });

  if (!result.error) {
    return result.data === true;
  }

  if (result.error.code === "PGRST202") {
    throw missingUserQuotaSchemaError();
  }

  throw result.error;
}
