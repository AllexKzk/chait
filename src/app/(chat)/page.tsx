import { ChatHero } from "@/components/chat/chat-hero";
import { LandingChatInput } from "@/components/chat/landing-chat-input";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <ChatHero />
      </div>

      <LandingChatInput />
    </div>
  );
}

