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
      <div className="flex h-screen">
        <Header />
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
