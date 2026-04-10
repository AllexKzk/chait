import { notFound } from "next/navigation";
import { ChatArea } from "@/components/chat/chat-area";
import { requireChatAccess } from "@/lib/chat-access";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = await params;
  const { errorResponse } = await requireChatAccess(chatId);

  if (errorResponse) {
    notFound();
  }

  return <ChatArea chatId={chatId} />;
}
