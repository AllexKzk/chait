import { Sidebar } from "@/components/sidebar";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { Header } from "@/components/header";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <div className="flex h-dvh overflow-hidden">
        <Header />
        <Sidebar className="hidden md:flex" />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
