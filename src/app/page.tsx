"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";
import { StatusSidebar } from "@/components/StatusSidebar";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isStatusPinned, setIsStatusPinned] = useState(false);

  // Load pinned state from localStorage on mount
  useEffect(() => {
    const pinned = localStorage.getItem("statusSidebarPinned") === "true";
    setIsStatusPinned(pinned);
    if (pinned) {
      setIsStatusOpen(true);
    }
  }, []);

  // Save pinned state to localStorage
  const handleTogglePin = () => {
    const newPinned = !isStatusPinned;
    setIsStatusPinned(newPinned);
    localStorage.setItem("statusSidebarPinned", String(newPinned));
    if (newPinned) {
      setIsStatusOpen(true);
    }
  };

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
      <div 
        className="flex-1 max-w-4xl mx-auto w-full overflow-hidden transition-all duration-300"
        style={{
          marginRight: isStatusPinned && isStatusOpen ? '320px' : '0',
        }}
      >
        <Chat />
      </div>
      <StatusSidebar 
        isOpen={isStatusOpen} 
        onClose={() => setIsStatusOpen(false)}
        isPinned={isStatusPinned}
        onTogglePin={handleTogglePin}
      />
    </main>
  );
}
