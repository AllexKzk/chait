import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

type ChatAccessResult =
  | {
      db: ReturnType<typeof createServerSupabase>;
      userId: string | null;
      anonId: string | null;
      chat: { id: string; user_id: string | null; anon_id: string | null };
      errorResponse: null;
    }
  | {
      db: ReturnType<typeof createServerSupabase>;
      userId: string | null;
      anonId: string | null;
      chat: null;
      errorResponse: NextResponse;
    };

function isChatOwner(
  userId: string | null,
  anonId: string | null,
  chat: { user_id: string | null; anon_id: string | null }
) {
  return (
    (Boolean(userId) && chat.user_id === userId) ||
    (!userId && Boolean(anonId) && chat.anon_id === anonId)
  );
}

export async function requireChatAccess(
  chatId: string
): Promise<ChatAccessResult> {
  const { userId, anonId } = await getAuthContext();
  const db = createServerSupabase();

  const { data: chat, error } = await db
    .from("chats")
    .select("id, user_id, anon_id")
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!chat || !isChatOwner(userId, anonId, chat)) {
    return {
      db,
      userId,
      anonId,
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
    anonId,
    chat,
    errorResponse: null,
  };
}
