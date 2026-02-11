"use client";

import React from "react";
import { A2UIComponentType, A2UIComponentState, A2UIActionEvent } from "@/types/a2ui";

// ============================================================
// Component Registry Types
// ============================================================

export interface A2UIComponentRenderer {
  component: React.ComponentType<A2UIRendererProps>;
  displayName: string;
}

export interface A2UIRendererProps {
  component: A2UIComponentState;
  onAction?: (event: A2UIActionEvent) => void;
}

// ============================================================
// Registry Implementation
// ============================================================

class ComponentRegistry {
  private components: Map<A2UIComponentType, A2UIComponentRenderer> = new Map();

  register(type: A2UIComponentType, renderer: A2UIComponentRenderer): void {
    this.components.set(type, renderer);
  }

  get(type: A2UIComponentType): A2UIComponentRenderer | undefined {
    return this.components.get(type);
  }

  has(type: A2UIComponentType): boolean {
    return this.components.has(type);
  }

  getAll(): Map<A2UIComponentType, A2UIComponentRenderer> {
    return new Map(this.components);
  }

  getTypes(): A2UIComponentType[] {
    return Array.from(this.components.keys());
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const componentRegistry = new ComponentRegistry();

// ============================================================
// Registry Hook
// ============================================================

export function useComponentRegistry() {
  return componentRegistry;
}

// ============================================================
// Dynamic Component Renderer
// ============================================================

interface DynamicComponentProps {
  component: A2UIComponentState;
  onAction?: (event: A2UIActionEvent) => void;
  fallback?: React.ReactNode;
}

export function DynamicComponent({
  component,
  onAction,
  fallback = null,
}: DynamicComponentProps) {
  const renderer = componentRegistry.get(component.component);

  if (!renderer) {
    console.warn(`No renderer registered for component type: ${component.component}`);
    return <>{fallback}</>;
  }

  const Component = renderer.component;
  return <Component component={component} onAction={onAction} />;
}

// ============================================================
// Component Registration Helper
// ============================================================

export function registerComponent(
  type: A2UIComponentType,
  component: React.ComponentType<A2UIRendererProps>,
  displayName?: string
): void {
  componentRegistry.register(type, {
    component,
    displayName: displayName || type,
  });
}

export default componentRegistry;
