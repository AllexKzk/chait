import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";

export const FREE_LIMIT = 3;
const ANON_USAGE_COOKIE_NAME = "anon_usage";

const MISSING_ANON_USAGE_CODES = new Set(["PGRST202", "PGRST205"]);

function isMissingAnonUsageSchema(code?: string) {
  return !!code && MISSING_ANON_USAGE_CODES.has(code);
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
  // We persist usage in an httpOnly cookie so deleted chats do not reset the limit.
  return getFallbackAnonUsageCount(anonId);
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
    await incrementFallbackAnonUsage(anonId);
    return;
  }

  throw result.error;
}
