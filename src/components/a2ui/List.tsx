"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { A2UIListProps, A2UIListItem, A2UIStatus } from "@/types/a2ui";
import { A2UIComponentWrapper, A2UIActions } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Circle 
} from "lucide-react";

// ============================================================
// Status Icons & Colors
// ============================================================

const statusIcons: Record<A2UIStatus, React.ComponentType<{ className?: string }>> = {
  active: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

const statusColors: Record<A2UIStatus, string> = {
  active: "text-blue-500",
  completed: "text-green-500",
  failed: "text-red-500",
  pending: "text-gray-400",
};

// ============================================================
// List Component
// ============================================================

function List({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIListProps;
  const {
    items,
    variant = "simple",
    interactive = false,
    collapsible = false,
  } = props;

  const handleAction = useCallback(
    (action: string, itemIndex?: number) => {
      if (onAction) {
        onAction({
          type: "action",
          componentId: component.id,
          action,
          data: itemIndex !== undefined ? { itemIndex } : undefined,
          timestamp: Date.now(),
        });
      }
    },
    [component.id, onAction]
  );

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      <div className={cn(
        "space-y-1",
        variant === "timeline" && "border-l-2 border-white/10 ml-2 pl-4"
      )}>
        {items.map((item, index) => (
          <ListItem
            key={index}
            item={item}
            index={index}
            variant={variant}
            interactive={interactive}
            collapsible={collapsible}
            onAction={handleAction}
          />
        ))}
      </div>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// List Item Component
// ============================================================

interface ListItemProps {
  item: A2UIListItem;
  index: number;
  variant: A2UIListProps["variant"];
  interactive: boolean;
  collapsible: boolean;
  depth?: number;
  onAction: (action: string, itemIndex?: number) => void;
}

function ListItem({ 
  item, 
  index, 
  variant, 
  interactive, 
  collapsible, 
  depth = 0,
  onAction 
}: ListItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  // Determine icon
  const renderIcon = () => {
    if (item.icon) {
      return <span className="flex-shrink-0">{item.icon}</span>;
    }

    if (variant === "checklist" || item.status) {
      const status = item.status || "pending";
      const StatusIcon = statusIcons[status];
      const statusColor = statusColors[status];
      return (
        <StatusIcon 
          className={cn(
            "w-4 h-4 flex-shrink-0",
            statusColor,
            status === "active" && "animate-spin"
          )} 
        />
      );
    }

    if (variant === "timeline") {
      return (
        <div 
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 -ml-5",
            item.status === "completed" ? "bg-green-500" :
            item.status === "active" ? "bg-blue-500" :
            item.status === "failed" ? "bg-red-500" :
            "bg-gray-400"
          )}
        />
      );
    }

    if (variant === "tree" || hasChildren) {
      return null; // Tree uses expand/collapse icons
    }

    return <Circle className="w-2 h-2 flex-shrink-0 fill-current opacity-50" />;
  };

  return (
    <div className={cn(depth > 0 && "ml-4")}>
      <div
        className={cn(
          "flex items-start gap-2 py-1.5 px-2 rounded-lg",
          interactive && "cursor-pointer hover:bg-white/5 transition-colors",
          item.status === "completed" && variant === "checklist" && "opacity-60"
        )}
        onClick={() => {
          if (hasChildren && collapsible) {
            setIsExpanded(!isExpanded);
          } else if (interactive) {
            onAction("item_click", index);
          }
        }}
      >
        {/* Expand/Collapse for tree */}
        {(variant === "tree" || hasChildren) && collapsible && (
          <button
            className="flex-shrink-0 p-0.5 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )
            ) : (
              <span className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Icon */}
        {renderIcon()}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className={cn(
                "text-sm",
                item.status === "completed" && variant === "checklist" && "line-through"
              )}
            >
              {item.text}
            </span>
            {item.time && (
              <span className="text-xs text-muted-foreground">{item.time}</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* Item Actions */}
        {item.actions && item.actions.length > 0 && (
          <div className="flex-shrink-0">
            <A2UIActions 
              actions={item.actions} 
              onAction={(action) => onAction(action, index)}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.children!.map((child, childIndex) => (
            <ListItem
              key={childIndex}
              item={child}
              index={childIndex}
              variant={variant}
              interactive={interactive}
              collapsible={collapsible}
              depth={depth + 1}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Standalone List
// ============================================================

export function StandaloneList({
  items,
  variant = "simple",
  className,
}: A2UIListProps & { className?: string }) {
  return (
    <div className={cn(
      "space-y-1",
      variant === "timeline" && "border-l-2 border-white/10 ml-2 pl-4",
      className
    )}>
      {items.map((item, index) => (
        <ListItem
          key={index}
          item={item}
          index={index}
          variant={variant}
          interactive={false}
          collapsible={false}
          onAction={() => {}}
        />
      ))}
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("List", List, "List");

export { List };
export default List;
