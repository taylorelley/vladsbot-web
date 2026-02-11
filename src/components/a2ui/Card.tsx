"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { A2UICardProps, A2UIActionEvent, A2UIVariant } from "@/types/a2ui";
import { A2UIComponentWrapper, A2UIActions } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import ReactMarkdown from "react-markdown";

// ============================================================
// Variant Icons
// ============================================================

const variantIcons: Record<A2UIVariant, string> = {
  default: "",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
  primary: "🔷",
  secondary: "",
  danger: "🔴",
};

// ============================================================
// Card Component
// ============================================================

function Card({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UICardProps;
  const effectiveIcon = props.icon || (props.variant && variantIcons[props.variant]) || undefined;

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

  return (
    <A2UIComponentWrapper
      component={{
        ...component,
        props: {
          ...props,
          icon: effectiveIcon,
        },
      }}
      onAction={onAction}
      collapsible={props.collapsible}
      dismissible={!!props.actions?.some((a) => a.action === "dismiss")}
    >
      {/* Content */}
      {props.content && (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{props.content}</ReactMarkdown>
        </div>
      )}

      {/* Actions */}
      {props.actions && props.actions.length > 0 && (
        <div className="mt-4">
          <A2UIActions actions={props.actions} onAction={handleAction} />
        </div>
      )}

      {/* Footer */}
      {props.footer && (
        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-muted-foreground">
          {props.footer}
        </div>
      )}
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Standalone Card (without wrapper for embedding)
// ============================================================

export function StandaloneCard({
  title,
  subtitle,
  content,
  icon,
  variant = "default",
  actions,
  footer,
  className,
  onAction,
}: A2UICardProps & {
  className?: string;
  onAction?: (action: string) => void;
}) {
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

  const effectiveIcon = icon || variantIcons[variant] || undefined;

  return (
    <div
      className={cn(
        "glass-card border rounded-lg overflow-hidden",
        variantStyles[variant],
        className
      )}
    >
      {/* Header */}
      {(title || icon) && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {effectiveIcon && <span className="text-lg">{effectiveIcon}</span>}
            <div>
              {title && <h3 className="font-semibold text-sm">{title}</h3>}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {content && (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && onAction && (
          <div className="mt-4">
            <A2UIActions actions={actions} onAction={onAction} />
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Card", Card, "Card");

export { Card };
export default Card;
