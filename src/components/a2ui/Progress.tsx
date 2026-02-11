"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { A2UIProgressProps, A2UIVariant } from "@/types/a2ui";
import { A2UIComponentWrapper } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// ============================================================
// Progress Bar Colors
// ============================================================

const progressColors: Record<A2UIVariant, string> = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  primary: "bg-primary",
  secondary: "bg-gray-500",
  danger: "bg-red-600",
};

// ============================================================
// Progress Component
// ============================================================

function Progress({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIProgressProps;
  const {
    current,
    total,
    percentage,
    status,
    variant = "default",
    showPercentage = true,
    animated = true,
    steps,
    title,
  } = props;

  // Calculate percentage if not provided
  const computedPercentage = percentage ?? Math.round((current / total) * 100);
  const isComplete = computedPercentage >= 100;
  const isFailed = variant === "error" || variant === "danger";

  return (
    <A2UIComponentWrapper component={component} onAction={onAction} showHeader={!!title}>
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              {isFailed ? (
                <XCircle className="w-3 h-3 text-red-500" />
              ) : isComplete ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <span>
                {current}/{total}
              </span>
            </span>
            {showPercentage && (
              <span className="font-mono font-medium">{computedPercentage}%</span>
            )}
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                animated && !isComplete && !isFailed && "animate-pulse",
                progressColors[variant],
                isComplete && "bg-green-500",
                isFailed && "bg-red-500"
              )}
              style={{
                width: `${Math.min(computedPercentage, 100)}%`,
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
        </div>

        {/* Status Text */}
        {status && (
          <p className="text-xs text-muted-foreground">{status}</p>
        )}

        {/* Steps (if provided) */}
        {steps && steps.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  step.completed ? "text-green-500" : "text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-current" />
                )}
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Standalone Progress Bar
// ============================================================

export function StandaloneProgress({
  current,
  total,
  percentage,
  status,
  variant = "default",
  showPercentage = true,
  animated = true,
  className,
}: A2UIProgressProps & { className?: string }) {
  const computedPercentage = percentage ?? Math.round((current / total) * 100);
  const isComplete = computedPercentage >= 100;
  const isFailed = variant === "error" || variant === "danger";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {current}/{total}
        </span>
        {showPercentage && (
          <span className="font-mono font-medium">{computedPercentage}%</span>
        )}
      </div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            animated && !isComplete && !isFailed && "animate-pulse",
            progressColors[variant],
            isComplete && "bg-green-500",
            isFailed && "bg-red-500"
          )}
          style={{
            width: `${Math.min(computedPercentage, 100)}%`,
            transition: "width 0.5s ease-out",
          }}
        />
      </div>
      {status && (
        <p className="text-xs text-muted-foreground">{status}</p>
      )}
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Progress", Progress, "Progress");

export { Progress };
export default Progress;
