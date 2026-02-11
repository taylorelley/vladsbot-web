"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  A2UIActivity,
  A2UIAnalytics,
  A2UISubAgent,
  A2UISidebarTab,
  A2UITabConfig,
  A2UIComponentState,
  A2UIActionEvent,
} from "@/types/a2ui";
import {
  Zap,
  BarChart3,
  Layout,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Cpu,
  ChevronDown,
  ChevronRight,
  Activity,
  DollarSign,
  Wrench,
  Bot,
} from "lucide-react";
import { DynamicComponent } from "./A2UIRegistry";

// ============================================================
// Types
// ============================================================

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

interface A2UISidebarProps {
  isOpen: boolean;
}

// ============================================================
// Tab Configuration
// ============================================================

const tabs: A2UITabConfig[] = [
  { id: "overview", label: "Overview", icon: "layout" },
  { id: "activity", label: "Activity", icon: "zap" },
  { id: "analytics", label: "Analytics", icon: "chart" },
];

// ============================================================
// Main Sidebar Component
// ============================================================

export function A2UISidebar({ isOpen }: A2UISidebarProps) {
  const [activeTab, setActiveTab] = useState<A2UISidebarTab>("overview");
  const [activities, setActivities] = useState<A2UIActivity[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [components, setComponents] = useState<A2UIComponentState[]>([]);
  const [subAgents, setSubAgents] = useState<A2UISubAgent[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activities
        const activitiesRes = await fetch("/api/a2ui/activities");
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data.data?.activities || []);
          setSubAgents(data.data?.subAgents || []);
        }

        // Fetch session status
        const statusRes = await fetch("/api/status");
        if (statusRes.ok) {
          const status = await statusRes.json();
          setSessionStatus(status);
        }

        // Fetch components for sidebar
        const componentsRes = await fetch("/api/a2ui/render?location=sidebar");
        if (componentsRes.ok) {
          const data = await componentsRes.json();
          setComponents(data.data?.components || []);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback((event: A2UIActionEvent) => {
    fetch("/api/a2ui/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(console.error);
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 glass-panel border-y-0 border-l-0 border-r z-40",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            badge={
              tab.id === "activity"
                ? activities.filter((a) => a.status === "active").length
                : undefined
            }
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <OverviewTab
            sessionStatus={sessionStatus}
            subAgents={subAgents}
            components={components}
            onAction={handleAction}
          />
        )}
        {activeTab === "activity" && (
          <ActivityTab activities={activities} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab sessionStatus={sessionStatus} activities={activities} />
        )}
      </div>
    </aside>
  );
}

// ============================================================
// Tab Button
// ============================================================

interface TabButtonProps {
  tab: A2UITabConfig;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

function TabButton({ tab, isActive, onClick, badge }: TabButtonProps) {
  const Icon =
    tab.icon === "layout"
      ? Layout
      : tab.icon === "zap"
      ? Zap
      : BarChart3;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
        "border-b-2 -mb-px",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{tab.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Overview Tab
// ============================================================

interface OverviewTabProps {
  sessionStatus: SessionStatus | null;
  subAgents: A2UISubAgent[];
  components: A2UIComponentState[];
  onAction: (event: A2UIActionEvent) => void;
}

function OverviewTab({
  sessionStatus,
  subAgents,
  components,
  onAction,
}: OverviewTabProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Session Status */}
      {sessionStatus && (
        <SessionStatusCard status={sessionStatus} />
      )}

      {/* Sub-Agent Tree */}
      {subAgents.length > 0 && (
        <SubAgentTree agents={subAgents} />
      )}

      {/* Sidebar Components */}
      {components.length > 0 && (
        <div className="space-y-3">
          {components.map((component) => (
            <DynamicComponent
              key={component.id}
              component={component}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!sessionStatus && subAgents.length === 0 && components.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No session data</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Session Status Card
// ============================================================

function SessionStatusCard({ status }: { status: SessionStatus }) {
  const { mainSession } = status;
  const contextColor =
    mainSession.contextPercent < 50
      ? "bg-green-500"
      : mainSession.contextPercent < 75
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Main Session</h3>
      </div>

      <p className="text-xs text-muted-foreground">{mainSession.model}</p>

      {/* Context Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Context</span>
          <span className="font-mono">{mainSession.contextPercent}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", contextColor)}
            style={{ width: `${mainSession.contextPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round(mainSession.contextUsed / 1000)}k /{" "}
          {Math.round(mainSession.contextTotal / 1000)}k tokens
        </p>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-muted-foreground">Thinking: </span>
          <span className="font-medium capitalize">{mainSession.thinking}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Compactions: </span>
          <span className="font-medium">{mainSession.compactions}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-Agent Tree
// ============================================================

interface SubAgentTreeProps {
  agents: A2UISubAgent[];
}

function SubAgentTree({ agents }: SubAgentTreeProps) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Sub-Agents</h3>
      </div>

      <div className="space-y-1">
        {agents.map((agent) => (
          <SubAgentNode key={agent.id} agent={agent} depth={0} />
        ))}
      </div>
    </div>
  );
}

interface SubAgentNodeProps {
  agent: A2UISubAgent;
  depth: number;
}

function SubAgentNode({ agent, depth }: SubAgentNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = agent.children && agent.children.length > 0;

  const statusIcon = {
    active: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
    completed: <CheckCircle className="w-3 h-3 text-green-500" />,
    failed: <XCircle className="w-3 h-3 text-red-500" />,
    pending: <Clock className="w-3 h-3 text-gray-400" />,
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded hover:bg-white/5 cursor-pointer",
          depth > 0 && "ml-4"
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )
        ) : (
          <span className="w-3" />
        )}
        {statusIcon[agent.status]}
        <span className="text-xs truncate flex-1">{agent.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {agent.children!.map((child) => (
            <SubAgentNode key={child.id} agent={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Activity Tab
// ============================================================

interface ActivityTabProps {
  activities: A2UIActivity[];
}

function ActivityTab({ activities }: ActivityTabProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active tasks</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: A2UIActivity }) {
  const statusIcons = {
    active: Loader2,
    completed: CheckCircle,
    failed: XCircle,
    pending: Clock,
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
            activity.status === "active" && "animate-spin"
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

// ============================================================
// Analytics Tab
// ============================================================

interface AnalyticsTabProps {
  sessionStatus: SessionStatus | null;
  activities: A2UIActivity[];
}

function AnalyticsTab({ sessionStatus, activities }: AnalyticsTabProps) {
  const completedCount = activities.filter((a) => a.status === "completed").length;
  const failedCount = activities.filter((a) => a.status === "failed").length;
  const activeCount = activities.filter((a) => a.status === "active").length;

  // Calculate mock analytics (in real implementation, fetch from API)
  const toolUsage = activities.reduce((acc, activity) => {
    if (activity.type === "tool_call") {
      acc[activity.title] = (acc[activity.title] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Active"
          value={activeCount}
          color="text-blue-500"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Done"
          value={completedCount}
          color="text-green-500"
        />
        <StatCard
          icon={<XCircle className="w-4 h-4" />}
          label="Failed"
          value={failedCount}
          color="text-red-500"
        />
      </div>

      {/* Tool Usage */}
      {Object.keys(toolUsage).length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Tool Usage</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(toolUsage)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([tool, count]) => (
                <div key={tool} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{tool}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Context Health */}
      {sessionStatus && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Context Health</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span
                className={cn(
                  "font-medium",
                  sessionStatus.mainSession.contextPercent < 50
                    ? "text-green-500"
                    : sessionStatus.mainSession.contextPercent < 75
                    ? "text-yellow-500"
                    : "text-red-500"
                )}
              >
                {sessionStatus.mainSession.contextPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Compactions</span>
              <span className="font-medium">{sessionStatus.mainSession.compactions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost Estimate (placeholder) */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Session Cost</h3>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">$0.00</p>
          <p className="text-xs text-muted-foreground">Estimated cost</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stat Card
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

function StatCard({ icon, label, value, color = "text-primary" }: StatCardProps) {
  return (
    <div className="glass-card p-3 text-center">
      <div className={cn("flex items-center justify-center mb-1", color)}>
        {icon}
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ============================================================
// Toggle Button Export
// ============================================================

export function A2UISidebarToggle({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-button-secondary rounded-lg p-2 flex items-center gap-2"
      title={isOpen ? "Hide sidebar" : "Show sidebar"}
    >
      <Zap className="w-4 h-4" />
      {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
    </button>
  );
}

export default A2UISidebar;
