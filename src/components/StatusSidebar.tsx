"use client";

import { useState, useEffect } from "react";
import { StatusResponse } from "@/types/status";
import { X, Activity, Cpu, Clock, Zap, ChevronRight, Bot, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export function StatusSidebar({ isOpen, onClose, isPinned, onTogglePin }: StatusSidebarProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/status");
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Backdrop (only show when not pinned and on mobile) */}
      {isOpen && !isPinned && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 glass-panel rounded-none border-y-0 border-r-0 border-l",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isPinned ? "z-30" : "z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Session Status
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePin}
              className={cn(
                "glass-button-secondary rounded-lg p-2 hover:bg-white/10 transition-colors",
                isPinned && "bg-primary/20 text-primary"
              )}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin className={cn("w-4 h-4 transition-transform", isPinned && "rotate-45")} />
            </button>
            {!isPinned && (
              <button
                onClick={onClose}
                className="glass-button-secondary rounded-lg p-2 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {error && (
            <div className="glass-card p-4 border-destructive/50 bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {status && !loading && (
            <>
              {/* Main Session */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Main Session</h3>
                    <p className="text-xs text-muted-foreground">
                      {status.mainSession.model}
                    </p>
                  </div>
                </div>

                {/* Context Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Context</span>
                    <span className="font-mono">
                      {status.mainSession.contextPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        status.mainSession.contextPercent < 50
                          ? "bg-green-500"
                          : status.mainSession.contextPercent < 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                      style={{
                        width: `${status.mainSession.contextPercent}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(status.mainSession.contextUsed / 1000)}k /{" "}
                    {Math.round(status.mainSession.contextTotal / 1000)}k tokens
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-2 text-xs pt-2">
                  <Zap className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Thinking</p>
                    <p className="font-medium capitalize">
                      {status.mainSession.thinking}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Agents */}
              {status.subAgents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Bot className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-sm">
                      Sub-Agents ({status.subAgents.length})
                    </h3>
                  </div>

                  {status.subAgents.map((agent) => (
                    <div
                      key={agent.sessionKey}
                      className="glass-card p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {agent.label || agent.agentId || "Unnamed Agent"}
                          </p>
                          {agent.task && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {agent.task}
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            agent.status === "active"
                              ? "bg-green-500 animate-pulse"
                              : agent.status === "idle"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          )}
                        />
                      </div>

                      {/* Context Bar (always show for sub-agents) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Context</span>
                          <span className="font-mono">
                            {agent.contextPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              agent.contextPercent < 50
                                ? "bg-green-500"
                                : agent.contextPercent < 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            )}
                            style={{ width: `${agent.contextPercent}%` }}
                          />
                        </div>
                        {agent.contextUsed > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(agent.contextUsed / 1000)}k /{" "}
                            {Math.round(agent.contextTotal / 1000)}k tokens
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Runtime: {agent.uptime}</span>
                        <span className="capitalize">{agent.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {status.subAgents.length === 0 && (
                <div className="glass-card p-4 text-center">
                  <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No active sub-agents
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground text-center">
            Auto-refreshes every 5 seconds
          </p>
        </div>
      </aside>
    </>
  );
}

// Toggle button component
export function StatusToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-button-secondary rounded-lg p-2 flex items-center gap-2"
      title="Toggle status sidebar"
    >
      <Activity className="w-4 h-4" />
      <ChevronRight className="w-3 h-3 lg:hidden" />
    </button>
  );
}
