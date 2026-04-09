import { Sidebar } from "@/components/sidebar";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { AnonBanner } from "@/components/layout/anon-banner";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AnonBanner />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
