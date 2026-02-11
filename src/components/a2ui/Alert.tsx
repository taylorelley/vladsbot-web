"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { A2UIAlertProps, A2UIVariant } from "@/types/a2ui";
import { A2UIActions } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

// ============================================================
// Alert Styles
// ============================================================

const alertStyles: Record<A2UIVariant, { bg: string; border: string; text: string }> = {
  default: {
    bg: "bg-white/5",
    border: "border-white/10",
    text: "text-foreground",
  },
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/50",
    text: "text-green-500",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/50",
    text: "text-yellow-500",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/50",
    text: "text-red-500",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    text: "text-blue-500",
  },
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/50",
    text: "text-primary",
  },
  secondary: {
    bg: "bg-white/5",
    border: "border-white/20",
    text: "text-muted-foreground",
  },
  danger: {
    bg: "bg-red-600/10",
    border: "border-red-600/50",
    text: "text-red-600",
  },
};

const alertIcons: Record<A2UIVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  primary: Info,
  secondary: Info,
  danger: AlertCircle,
};

// ============================================================
// Alert Component
// ============================================================

function Alert({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIAlertProps;
  const {
    title,
    message,
    variant = "info",
    dismissible = false,
    actions,
    icon,
    autoHide,
  } = props;

  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onAction) {
        onAction({
          type: "dismiss",
          componentId: component.id,
          action: "dismiss",
          timestamp: Date.now(),
        });
      }
    }, 200);
  }, [component.id, onAction]);

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

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && autoHide > 0) {
      const timer = setTimeout(handleDismiss, autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide, handleDismiss]);

  if (!isVisible) return null;

  const styles = alertStyles[variant];
  const IconComponent = icon ? null : alertIcons[variant];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        styles.bg,
        styles.border,
        isExiting && "opacity-0 transform -translate-y-2"
      )}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-0.5", styles.text)}>
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            IconComponent && <IconComponent className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-semibold text-sm mb-1", styles.text)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-foreground/80">{message}</p>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="mt-3">
              <A2UIActions actions={actions} onAction={handleAction} size="sm" />
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Standalone Alert
// ============================================================

export function StandaloneAlert({
  title,
  message,
  variant = "info",
  dismissible = false,
  actions,
  icon,
  autoHide,
  className,
  onDismiss,
  onAction,
}: A2UIAlertProps & {
  className?: string;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (autoHide && autoHide > 0) {
      const timer = setTimeout(handleDismiss, autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide, handleDismiss]);

  if (!isVisible) return null;

  const styles = alertStyles[variant];
  const IconComponent = icon ? null : alertIcons[variant];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        styles.bg,
        styles.border,
        isExiting && "opacity-0 transform -translate-y-2",
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", styles.text)}>
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            IconComponent && <IconComponent className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-semibold text-sm mb-1", styles.text)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-foreground/80">{message}</p>

          {actions && actions.length > 0 && onAction && (
            <div className="mt-3">
              <A2UIActions actions={actions} onAction={onAction} size="sm" />
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Alert", Alert, "Alert");

export { Alert };
export default Alert;
