"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isActivityOpen, setIsActivityOpen] = useState(true); // Default open

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
        <Chat />
      </div>
      <AgentActivityPanel
        isOpen={isActivityOpen}
        onToggle={() => setIsActivityOpen(!isActivityOpen)}
      />
    </main>
  );
}
