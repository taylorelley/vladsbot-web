"use client";

import { signOut, useSession } from "next-auth/react";
import { Bot, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentActivityToggle } from "./AgentActivityPanel";

interface HeaderProps {
  onToggleActivity?: () => void;
  isActivityOpen?: boolean;
}

export function Header({ onToggleActivity, isActivityOpen = false }: HeaderProps = {}) {
  const { data: session } = useSession();

  return (
    <header className="glass-panel border-t-0 border-x-0 rounded-none px-4 py-3 relative z-50">
      <div className="max-w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleActivity && (
            <AgentActivityToggle onClick={onToggleActivity} isOpen={isActivityOpen} />
          )}
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">VladsBot</h1>
            <p className="text-xs text-muted-foreground">Web Chat Interface</p>
          </div>
        </div>

        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="hidden sm:inline text-muted-foreground">
                {session.user.name || session.user.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className={cn(
                "glass-button-secondary rounded-lg p-2",
                "flex items-center gap-2 text-sm"
              )}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
