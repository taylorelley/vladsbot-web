"use client";

import { useState, useEffect } from "react";
import { A2UIActivity } from "@/types/a2ui";
import { Zap, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionStatus {
  mainSession: {
    model: string;
    contextPercent: number;
    contextUsed: number;
    contextTotal: number;
    thinking: string;
    compactions: number;
  };
}

interface AgentActivityPanelProps {
  isOpen: boolean;
}

export function AgentActivityPanel({ isOpen }: AgentActivityPanelProps) {
  const [activities, setActivities] = useState<A2UIActivity[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);

  useEffect(() => {
    // Poll for activity updates and session status every 2 seconds
    const fetchData = async () => {
      try {
        // Fetch activities
        const activitiesRes = await fetch('/api/a2ui/activities');
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data.activities || []);
        }

        // Fetch session status
        const statusRes = await fetch('/api/status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          setSessionStatus(status);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeCount = activities.filter(a => a.status === 'active').length;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 glass-panel border-y-0 border-l-0 border-r z-40",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Activity Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Session Status Header */}
          {sessionStatus && (
            <div className="space-y-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Main Session</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {sessionStatus.mainSession.model}
                </p>

                {/* Context Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Context</span>
                    <span className="font-mono">
                      {sessionStatus.mainSession.contextPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        sessionStatus.mainSession.contextPercent < 50
                          ? "bg-green-500"
                          : sessionStatus.mainSession.contextPercent < 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                      style={{
                        width: `${sessionStatus.mainSession.contextPercent}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(sessionStatus.mainSession.contextUsed / 1000)}k /{" "}
                    {Math.round(sessionStatus.mainSession.contextTotal / 1000)}k tokens
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Thinking: </span>
                    <span className="font-medium capitalize">
                      {sessionStatus.mainSession.thinking}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Compactions: </span>
                    <span className="font-medium">
                      {sessionStatus.mainSession.compactions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activities Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Agent Activity
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active tasks
              </p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
      </div>
    </aside>
  );
}

function ActivityItem({ activity }: { activity: A2UIActivity }) {
  const statusIcons = {
    active: Loader2,
    completed: CheckCircle,
    failed: XCircle,
    pending: Loader2,
  };
  
  const statusColors = {
    active: "text-blue-500",
    completed: "text-green-500",
    failed: "text-red-500",
    pending: "text-gray-400",
  };

  const StatusIcon = statusIcons[activity.status] || Loader2;
  const statusColor = statusColors[activity.status] || "text-gray-400";

  return (
    <div className="glass-card p-3 space-y-2">
      <div className="flex items-start gap-2">
        <StatusIcon
          className={cn(
            "w-4 h-4 flex-shrink-0 mt-0.5",
            statusColor,
            activity.status === 'active' && "animate-spin"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{activity.title}</p>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {activity.progress !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono">{activity.progress}%</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${activity.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Toggle button component for header
export function AgentActivityToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className="glass-button-secondary rounded-lg p-2 flex items-center gap-2"
      title={isOpen ? "Hide activity panel" : "Show activity panel"}
    >
      <Zap className="w-4 h-4" />
      {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
    </button>
  );
}
