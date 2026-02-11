"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  A2UIComponentState, 
  A2UIAction, 
  A2UIActionEvent,
  A2UIVariant 
} from "@/types/a2ui";
import { X, ChevronDown, ChevronUp } from "lucide-react";

// ============================================================
// Types
// ============================================================

interface A2UIComponentWrapperProps {
  component: A2UIComponentState;
  children: React.ReactNode;
  onAction?: (event: A2UIActionEvent) => void;
  className?: string;
  showHeader?: boolean;
  collapsible?: boolean;
  dismissible?: boolean;
}

// ============================================================
// Variant Styles
// ============================================================

const variantStyles: Record<A2UIVariant, string> = {
  default: "border-white/10",
  success: "border-green-500/50 bg-green-500/5",
  warning: "border-yellow-500/50 bg-yellow-500/5",
  error: "border-red-500/50 bg-red-500/5",
  info: "border-blue-500/50 bg-blue-500/5",
  primary: "border-primary/50 bg-primary/5",
  secondary: "border-white/20 bg-white/5",
  danger: "border-red-600/50 bg-red-600/5",
};

const variantIconColors: Record<A2UIVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  info: "text-blue-500",
  primary: "text-primary",
  secondary: "text-muted-foreground",
  danger: "text-red-600",
};

// ============================================================
// Component
// ============================================================

export function A2UIComponentWrapper({
  component,
  children,
  onAction,
  className,
  showHeader = true,
  collapsible = false,
  dismissible = false,
}: A2UIComponentWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(
    (component.props as { defaultCollapsed?: boolean }).defaultCollapsed ?? false
  );

  const variant = ((component.props as { variant?: A2UIVariant }).variant) || "default";
  const title = (component.props as { title?: string }).title;
  const subtitle = (component.props as { subtitle?: string }).subtitle;
  const icon = (component.props as { icon?: string }).icon;

  const handleAction = useCallback(
    (action: string) => {
      if (onAction) {
        onAction({
          type: "action",
          componentId: component.id,
          action,
          timestamp: Date.now(),
        });
      }
    },
    [component.id, onAction]
  );

  const handleDismiss = useCallback(() => {
    handleAction("dismiss");
  }, [handleAction]);

  return (
    <div
      className={cn(
        "glass-card border rounded-lg overflow-hidden transition-all duration-200",
        variantStyles[variant],
        className
      )}
      data-component-id={component.id}
      data-component-type={component.component}
    >
      {/* Header */}
      {showHeader && (title || dismissible || collapsible) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && (
              <span className={cn("text-lg", variantIconColors[variant])}>
                {icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-semibold text-sm truncate">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            )}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!isCollapsed && <div className="p-4">{children}</div>}
    </div>
  );
}

// ============================================================
// Action Button Component
// ============================================================

interface A2UIActionButtonProps {
  action: A2UIAction;
  onClick: (action: string) => void;
  size?: "sm" | "md" | "lg";
}

export function A2UIActionButton({
  action,
  onClick,
  size = "md",
}: A2UIActionButtonProps) {
  const variant = action.variant || "secondary";

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const buttonVariants: Record<A2UIVariant, string> = {
    default: "glass-button-secondary",
    primary: "glass-button",
    secondary: "glass-button-secondary",
    success: "bg-green-600 hover:bg-green-500 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-500 text-white",
    error: "bg-red-600 hover:bg-red-500 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    info: "bg-blue-600 hover:bg-blue-500 text-white",
  };

  return (
    <button
      onClick={() => onClick(action.action)}
      disabled={action.disabled}
      title={action.tooltip}
      className={cn(
        "rounded-lg font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeStyles[size],
        buttonVariants[variant]
      )}
    >
      {action.icon && <span className="mr-1">{action.icon}</span>}
      {action.label}
    </button>
  );
}

// ============================================================
// Action Button Group
// ============================================================

interface A2UIActionsProps {
  actions: A2UIAction[];
  onAction: (action: string) => void;
  layout?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function A2UIActions({
  actions,
  onAction,
  layout = "horizontal",
  size = "md",
  className,
}: A2UIActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {actions.map((action, index) => (
        <A2UIActionButton
          key={action.action + index}
          action={action}
          onClick={onAction}
          size={size}
        />
      ))}
    </div>
  );
}

export default A2UIComponentWrapper;
