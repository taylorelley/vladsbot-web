"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";
import { A2UISidebar } from "@/components/a2ui/A2UISidebar";
import { FloatingA2UI } from "@/components/a2ui/A2UIRenderer";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isActivityOpen, setIsActivityOpen] = useState(true); // Default open

  // Load panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("activityPanelOpen");
    if (saved !== null) {
      setIsActivityOpen(saved === "true");
    }
  }, []);

  // Save panel state to localStorage
  const handleToggleActivity = () => {
    const newState = !isActivityOpen;
    setIsActivityOpen(newState);
    localStorage.setItem("activityPanelOpen", String(newState));
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
      <Header 
        onToggleActivity={handleToggleActivity}
        isActivityOpen={isActivityOpen}
      />
      <div className="flex-1 flex overflow-hidden">
        <A2UISidebar isOpen={isActivityOpen} />
        <div 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isActivityOpen ? "ml-80" : "ml-0"
          )}
        >
          <div className="max-w-4xl mx-auto w-full h-full">
            <Chat />
          </div>
        </div>
      </div>
      {/* Floating A2UI Components */}
      <FloatingA2UI />
    </main>
  );
}
