import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

type ChatAccessResult =
  | {
      db: SupabaseClient;
      userId: string | null;
      isRegistered: boolean;
      chat: { id: string; user_id: string };
      errorResponse: null;
    }
  | {
      db: SupabaseClient;
      userId: string | null;
      isRegistered: boolean;
      chat: null;
      errorResponse: NextResponse;
    };

export async function requireChatAccess(
  chatId: string
): Promise<ChatAccessResult> {
  const { userId, isRegistered } = await getAuthContext();
  const db = isRegistered
    ? await createAuthServerClient()
    : createServerSupabase();

  const { data: chat, error } = await db
    .from("chats")
    .select("id, user_id")
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!chat || chat.user_id !== userId) {
    return {
      db,
      userId,
      isRegistered,
      chat: null,
      errorResponse: NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      ),
    };
  }

  return {
    db,
    userId,
    isRegistered,
    chat,
    errorResponse: null,
  };
}
