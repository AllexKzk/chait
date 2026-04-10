import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_LIMIT = 3;
const ANON_USAGE_COOKIE_NAME = "anon_usage";

const MISSING_ANON_USAGE_CODES = new Set(["PGRST202", "PGRST205"]);

function isMissingAnonUsageSchema(code?: string) {
  return !!code && MISSING_ANON_USAGE_CODES.has(code);
}

function canUseFallbackAnonUsage() {
  return process.env.NODE_ENV !== "production";
}

function missingAnonUsageSchemaError() {
  return new Error(
    "anon_usage schema is missing. Apply the latest Supabase migrations before serving production traffic."
  );
}

function getAnonUsageCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

async function getFallbackAnonUsageCount(anonId: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ANON_USAGE_COOKIE_NAME)?.value;

  if (!raw) {
    return 0;
  }

  const [storedAnonId, rawCount] = raw.split(":");
  if (storedAnonId !== anonId) {
    return 0;
  }

  const count = Number(rawCount);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

async function incrementFallbackAnonUsage(anonId: string) {
  const cookieStore = await cookies();
  const currentCount = await getFallbackAnonUsageCount(anonId);

  cookieStore.set(
    ANON_USAGE_COOKIE_NAME,
    `${anonId}:${currentCount + 1}`,
    getAnonUsageCookieOptions(),
  );
}

export async function clearFallbackAnonUsage() {
  const cookieStore = await cookies();
  cookieStore.set(ANON_USAGE_COOKIE_NAME, "", {
    ...getAnonUsageCookieOptions(),
    maxAge: 0,
  });
}

export async function getAnonUsageCount(
  db: SupabaseClient,
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

  if (!canUseFallbackAnonUsage()) {
    throw missingAnonUsageSchemaError();
  }

  // Dev-only fallback for databases where anon_usage migration has not been applied yet.
  return getFallbackAnonUsageCount(anonId);
}

export async function consumeAnonQuota(
  db: SupabaseClient,
  anonId: string,
  limit: number,
) {
  const result = await db.rpc("consume_anon_quota", {
    p_anon_id: anonId,
    p_limit: limit,
  });
  if (!result.error) {
    return result.data === true;
  }

  if (isMissingAnonUsageSchema(result.error.code)) {
    if (!canUseFallbackAnonUsage()) {
      throw missingAnonUsageSchemaError();
    }

    const currentCount = await getFallbackAnonUsageCount(anonId);
    if (currentCount >= limit) {
      return false;
    }

    await incrementFallbackAnonUsage(anonId);
    return true;
  }

  throw result.error;
}
