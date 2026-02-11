"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { A2UIButtonGroupProps, A2UIAction, A2UIVariant } from "@/types/a2ui";
import { A2UIComponentWrapper } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { Loader2 } from "lucide-react";

// ============================================================
// Button Styles
// ============================================================

const buttonVariants: Record<A2UIVariant, string> = {
  default: "glass-button-secondary",
  primary: "glass-button",
  secondary: "glass-button-secondary",
  success: "bg-green-600 hover:bg-green-500 text-white border-green-500",
  warning: "bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-500",
  error: "bg-red-600 hover:bg-red-500 text-white border-red-500",
  danger: "bg-red-600 hover:bg-red-500 text-white border-red-500",
  info: "bg-blue-600 hover:bg-blue-500 text-white border-blue-500",
};

// ============================================================
// ButtonGroup Component
// ============================================================

function ButtonGroup({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIButtonGroupProps;
  const { buttons, layout = "horizontal", fullWidth = false, title } = props;

  const handleClick = useCallback(
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
      component={component}
      onAction={onAction}
      showHeader={!!title}
    >
      <div
        className={cn(
          "flex gap-2",
          layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
          fullWidth && "w-full"
        )}
      >
        {buttons.map((button, index) => (
          <ButtonGroupButton
            key={button.action + index}
            button={button}
            onClick={handleClick}
            fullWidth={fullWidth}
          />
        ))}
      </div>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Individual Button
// ============================================================

interface ButtonGroupButtonProps {
  button: A2UIAction;
  onClick: (action: string) => void;
  fullWidth?: boolean;
}

function ButtonGroupButton({ button, onClick, fullWidth }: ButtonGroupButtonProps) {
  const variant = button.variant || "secondary";
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    onClick(button.action);
    // Reset after 2 seconds
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={button.disabled || isLoading}
      title={button.tooltip}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 border",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        buttonVariants[variant],
        fullWidth && "flex-1"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        button.icon && <span>{button.icon}</span>
      )}
      <span>{button.label}</span>
    </button>
  );
}

// ============================================================
// Standalone ButtonGroup
// ============================================================

export function StandaloneButtonGroup({
  title,
  buttons,
  layout = "horizontal",
  fullWidth = false,
  className,
  onAction,
}: A2UIButtonGroupProps & {
  className?: string;
  onAction: (action: string) => void;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div
        className={cn(
          "flex gap-2",
          layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
          fullWidth && "w-full"
        )}
      >
        {buttons.map((button, index) => (
          <ButtonGroupButton
            key={button.action + index}
            button={button}
            onClick={onAction}
            fullWidth={fullWidth}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("ButtonGroup", ButtonGroup, "Button Group");

export { ButtonGroup };
export default ButtonGroup;
