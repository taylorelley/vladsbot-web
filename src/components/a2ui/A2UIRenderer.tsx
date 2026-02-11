"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  A2UIComponentState,
  A2UIActionEvent,
  A2UILocation,
  A2UISSEMessage,
} from "@/types/a2ui";
import { DynamicComponent } from "./A2UIRegistry";
import { showToast } from "./Toast";

// Import all components to ensure they're registered
import "./Card";
import "./ButtonGroup";
import "./Form";
import "./Table";
import "./Progress";
import "./List";
import "./Chart";
import "./Accordion";
import "./Alert";
import "./Code";

// ============================================================
// Types
// ============================================================

interface A2UIRendererProps {
  location: A2UILocation;
  className?: string;
  onAction?: (event: A2UIActionEvent) => void;
}

// ============================================================
// A2UI Renderer Component
// ============================================================

export function A2UIRenderer({ location, className, onAction }: A2UIRendererProps) {
  const [components, setComponents] = useState<A2UIComponentState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming action and forward to parent
  const handleAction = useCallback(
    (event: A2UIActionEvent) => {
      // Show immediate feedback toast
      showToast({
        type: "success",
        title: "Action received",
        message: `Processing: ${event.action}`,
        duration: 2000,
      });

      // Send action to backend
      fetch("/api/a2ui/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      })
        .then((res) => {
          if (res.ok) {
            showToast({
              type: "success",
              message: "Action completed successfully",
              duration: 2000,
            });
          } else {
            throw new Error("Action failed");
          }
        })
        .catch((err) => {
          showToast({
            type: "error",
            title: "Action failed",
            message: err.message || "Failed to process action",
            duration: 3000,
          });
        });

      // Forward to parent handler
      onAction?.(event);
    },
    [onAction]
  );

  // Connect to SSE stream
  useEffect(() => {
    const connect = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/a2ui/events");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log("A2UI SSE connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const message: A2UISSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case "component.render":
              setComponents((prev) => {
                const component = message.data as A2UIComponentState;
                // Filter by location
                if (component.location !== location) return prev;
                // Add or update component
                const existing = prev.findIndex((c) => c.id === component.id);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = component;
                  return updated;
                }
                return [...prev, component];
              });
              break;

            case "component.update":
              setComponents((prev) => {
                const component = message.data as A2UIComponentState;
                if (component.location !== location) return prev;
                return prev.map((c) =>
                  c.id === component.id ? component : c
                );
              });
              break;

            case "component.remove":
              const { componentId } = message.data as { componentId: string };
              setComponents((prev) => prev.filter((c) => c.id !== componentId));
              break;

            case "heartbeat":
              // Keep-alive, no action needed
              break;
          }
        } catch (err) {
          console.error("A2UI SSE parse error:", err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        
        // Reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    // Initial fetch of components
    fetch(`/api/a2ui/render?location=${location}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.components) {
          setComponents(data.data.components);
        }
      })
      .catch(console.error);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [location]);

  if (components.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {components.map((component) => (
        <DynamicComponent
          key={component.id}
          component={component}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

// ============================================================
// Chat Message A2UI Renderer
// ============================================================

interface ChatA2UIProps {
  messageId: string;
  components?: A2UIComponentState[];
  className?: string;
  onAction?: (event: A2UIActionEvent) => void;
}

export function ChatA2UI({ messageId, components, className, onAction }: ChatA2UIProps) {
  const handleAction = useCallback(
    (event: A2UIActionEvent) => {
      // Show immediate feedback toast
      showToast({
        type: "success",
        title: "Action received",
        message: `Processing: ${event.action}`,
        duration: 2000,
      });

      // Send action to backend
      fetch("/api/a2ui/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          data: { ...event.data, messageId },
        }),
      })
        .then((res) => {
          if (res.ok) {
            showToast({
              type: "success",
              message: "Action completed successfully",
              duration: 2000,
            });
          } else {
            throw new Error("Action failed");
          }
        })
        .catch((err) => {
          showToast({
            type: "error",
            title: "Action failed",
            message: err.message || "Failed to process action",
            duration: 3000,
          });
        });

      // Forward to parent handler
      onAction?.(event);
    },
    [messageId, onAction]
  );

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3 mt-3", className)}>
      {components.map((component) => (
        <DynamicComponent
          key={component.id}
          component={component}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

// ============================================================
// Floating A2UI Renderer
// ============================================================

interface FloatingA2UIProps {
  className?: string;
  onAction?: (event: A2UIActionEvent) => void;
}

export function FloatingA2UI({ className, onAction }: FloatingA2UIProps) {
  const [components, setComponents] = useState<A2UIComponentState[]>([]);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Fetch floating components
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await fetch("/api/a2ui/render?location=floating");
        const data = await res.json();
        if (data.success && data.data?.components) {
          setComponents(data.data.components);
        }
      } catch (err) {
        console.error("Failed to fetch floating components:", err);
      }
    };

    fetchComponents();
    const interval = setInterval(fetchComponents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback(
    (event: A2UIActionEvent) => {
      // Show immediate feedback toast
      showToast({
        type: "success",
        title: "Action received",
        message: `Processing: ${event.action}`,
        duration: 2000,
      });

      fetch("/api/a2ui/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      })
        .then((res) => {
          if (res.ok) {
            showToast({
              type: "success",
              message: "Action completed successfully",
              duration: 2000,
            });
          } else {
            throw new Error("Action failed");
          }
        })
        .catch((err) => {
          showToast({
            type: "error",
            title: "Action failed",
            message: err.message || "Failed to process action",
            duration: 3000,
          });
        });
      onAction?.(event);
    },
    [onAction]
  );

  if (components.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50", className)}>
      {components.map((component) => {
        const position = component.position as { x: string; y: string } | undefined;
        const positionStyles: React.CSSProperties = {};

        if (position) {
          if (position.x === "left") positionStyles.left = "1rem";
          else if (position.x === "right") positionStyles.right = "1rem";
          else if (position.x === "center") {
            positionStyles.left = "50%";
            positionStyles.transform = "translateX(-50%)";
          }

          if (position.y === "top") positionStyles.top = "5rem";
          else if (position.y === "bottom") positionStyles.bottom = "1rem";
          else if (position.y === "center") {
            positionStyles.top = "50%";
            positionStyles.transform = `${positionStyles.transform || ""} translateY(-50%)`;
          }
        } else {
          positionStyles.right = "1rem";
          positionStyles.bottom = "1rem";
        }

        return (
          <div
            key={component.id}
            className="absolute pointer-events-auto max-w-sm"
            style={positionStyles}
          >
            <DynamicComponent component={component} onAction={handleAction} />
          </div>
        );
      })}
    </div>
  );
}

export default A2UIRenderer;
