"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";
import { StatusSidebar } from "@/components/StatusSidebar";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isStatusOpen, setIsStatusOpen] = useState(false);

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
      <Header onToggleStatus={() => setIsStatusOpen(!isStatusOpen)} />
      <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
        <Chat />
      </div>
      <StatusSidebar isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
    </main>
  );
}
