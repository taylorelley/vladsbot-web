"use client";

import { useState, useEffect } from "react";
import { A2UIActivity } from "@/types/a2ui";
import { Zap, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AgentActivityPanel({ isOpen, onToggle }: AgentActivityPanelProps) {
  const [activities, setActivities] = useState<A2UIActivity[]>([]);

  useEffect(() => {
    // Poll for activity updates every 2 seconds
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/a2ui/activities');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      }
    };

    fetchActivities(); // Initial fetch
    const interval = setInterval(fetchActivities, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeCount = activities.filter(a => a.status === 'active').length;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isOpen ? "w-96" : "w-auto"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "glass-button-secondary rounded-lg p-3 flex items-center gap-2 mb-2 ml-auto",
          activeCount > 0 && "bg-primary/20 border-primary/50"
        )}
        title={isOpen ? "Hide agent activity" : "Show agent activity"}
      >
        <Zap className={cn("w-4 h-4", activeCount > 0 && "text-primary animate-pulse")} />
        {activeCount > 0 && (
          <span className="text-xs font-medium">{activeCount}</span>
        )}
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Activity Panel */}
      {isOpen && (
        <div className="glass-card p-4 max-h-96 overflow-y-auto">
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
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: A2UIActivity }) {
  const StatusIcon = {
    active: Loader2,
    completed: CheckCircle,
    failed: XCircle,
  }[activity.status];

  const statusColor = {
    active: "text-blue-500",
    completed: "text-green-500",
    failed: "text-red-500",
  }[activity.status];

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
