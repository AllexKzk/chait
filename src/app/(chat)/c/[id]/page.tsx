"use client";

import { useParams } from "next/navigation";
import { ChatArea } from "@/components/chat/chat-area";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  return <ChatArea chatId={chatId} />;
}
