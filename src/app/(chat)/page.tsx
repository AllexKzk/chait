import { ensureAnonId, getAuthContext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { LandingChatInput } from "@/components/chat/landing-chat-input";

async function getLandingChatId() {
  const { userId, anonId } = await getAuthContext();
  const db = createServerSupabase();

  if (userId) {
    const { data: existingChat, error: existingChatError } = await db
      .from("chats")
      .select("id")
      .eq("user_id", userId)
      .eq("title", "New Chat")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingChatError) {
      throw existingChatError;
    }

    if (existingChat) {
      return existingChat.id;
    }

    const { data: newChat, error: newChatError } = await db
      .from("chats")
      .insert({
        user_id: userId,
        anon_id: null,
        title: "New Chat",
      })
      .select("id")
      .single();

    if (newChatError) {
      throw newChatError;
    }

    return newChat.id;
  }

  const resolvedAnonId = anonId ?? (await ensureAnonId());

  const { data: existingChat, error: existingChatError } = await db
    .from("chats")
    .select("id")
    .eq("anon_id", resolvedAnonId)
    .is("user_id", null)
    .eq("title", "New Chat")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingChatError) {
    throw existingChatError;
  }

  if (existingChat) {
    return existingChat.id;
  }

  const { data: newChat, error: newChatError } = await db
    .from("chats")
    .insert({
      user_id: null,
      anon_id: resolvedAnonId,
      title: "New Chat",
    })
    .select("id")
    .single();

  if (newChatError) {
    throw newChatError;
  }

  return newChat.id;
}

export default async function HomePage() {
  const landingChatId = await getLandingChatId();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="hero-gradient-reveal text-center">
          <h1 className="hero-gradient-reveal__title text-4xl font-bold mb-2">
            CH<i>AI</i>T
          </h1>
          <p className="hero-gradient-reveal__subtitle text-muted-foreground">
            Another one AI chat UI for test assignment.
          </p>
        </div>
      </div>

      <LandingChatInput chatId={landingChatId} />
    </div>
  );
}

