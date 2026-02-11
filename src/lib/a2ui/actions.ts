// A2UI V3 - Action Handler Framework
// Processes user actions from interactive components

import { A2UIActionEvent, A2UIComponentType } from '@/types/a2ui';
import { a2uiStore } from './store';

// ============================================================
// Action Handler Types
// ============================================================

export type ActionHandler = (event: A2UIActionEvent) => Promise<void> | void;

export interface ActionHandlerConfig {
  handler: ActionHandler;
  once?: boolean; // Remove after first execution
  componentTypes?: A2UIComponentType[]; // Limit to specific component types
}

// ============================================================
// Action Handler Registry
// ============================================================

class ActionHandlerRegistry {
  private handlers: Map<string, ActionHandlerConfig[]> = new Map();
  private globalHandlers: ActionHandlerConfig[] = [];

  /**
   * Register a handler for a specific action
   */
  on(action: string, handler: ActionHandler, options?: Partial<ActionHandlerConfig>): () => void {
    const config: ActionHandlerConfig = {
      handler,
      once: options?.once,
      componentTypes: options?.componentTypes,
    };

    if (!this.handlers.has(action)) {
      this.handlers.set(action, []);
    }
    this.handlers.get(action)!.push(config);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(action);
      if (handlers) {
        const index = handlers.indexOf(config);
        if (index >= 0) handlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a one-time handler
   */
  once(action: string, handler: ActionHandler, options?: Partial<ActionHandlerConfig>): () => void {
    return this.on(action, handler, { ...options, once: true });
  }

  /**
   * Register a global handler for all actions
   */
  onAny(handler: ActionHandler, options?: Partial<ActionHandlerConfig>): () => void {
    const config: ActionHandlerConfig = {
      handler,
      once: options?.once,
      componentTypes: options?.componentTypes,
    };
    this.globalHandlers.push(config);

    return () => {
      const index = this.globalHandlers.indexOf(config);
      if (index >= 0) this.globalHandlers.splice(index, 1);
    };
  }

  /**
   * Dispatch an action to registered handlers
   */
  async dispatch(event: A2UIActionEvent): Promise<void> {
    const { action, componentId } = event;
    
    // Get component to check type
    const component = a2uiStore.get(componentId);
    const componentType = component?.component;

    // Collect handlers to execute
    const handlersToExecute: ActionHandlerConfig[] = [];
    const handlersToRemove: { list: ActionHandlerConfig[]; config: ActionHandlerConfig }[] = [];

    // Add specific action handlers
    if (action) {
      const specificHandlers = this.handlers.get(action) || [];
      for (const config of specificHandlers) {
        if (this.shouldExecute(config, componentType)) {
          handlersToExecute.push(config);
          if (config.once) {
            handlersToRemove.push({ list: specificHandlers, config });
          }
        }
      }
    }

    // Add global handlers
    for (const config of this.globalHandlers) {
      if (this.shouldExecute(config, componentType)) {
        handlersToExecute.push(config);
        if (config.once) {
          handlersToRemove.push({ list: this.globalHandlers, config });
        }
      }
    }

    // Execute all handlers
    const results = await Promise.allSettled(
      handlersToExecute.map(config => config.handler(event))
    );

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`A2UI action handler error:`, result.reason);
      }
    });

    // Remove one-time handlers
    for (const { list, config } of handlersToRemove) {
      const index = list.indexOf(config);
      if (index >= 0) list.splice(index, 1);
    }
  }

  private shouldExecute(config: ActionHandlerConfig, componentType?: A2UIComponentType): boolean {
    if (!config.componentTypes || config.componentTypes.length === 0) {
      return true;
    }
    return componentType ? config.componentTypes.includes(componentType) : false;
  }

  /**
   * Remove all handlers for an action
   */
  off(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  /**
   * Get handler count for debugging
   */
  getStats(): { actionHandlers: number; globalHandlers: number } {
    let actionHandlers = 0;
    this.handlers.forEach(handlers => {
      actionHandlers += handlers.length;
    });
    return {
      actionHandlers,
      globalHandlers: this.globalHandlers.length,
    };
  }
}

// ============================================================
// Built-in Action Handlers
// ============================================================

/**
 * Create a dismiss handler that removes the component
 */
export function createDismissHandler(): ActionHandler {
  return (event: A2UIActionEvent) => {
    a2uiStore.remove(event.componentId);
  };
}

/**
 * Create a component update handler
 */
export function createUpdateHandler(updates: Record<string, unknown>): ActionHandler {
  return (event: A2UIActionEvent) => {
    a2uiStore.update(event.componentId, updates);
  };
}

/**
 * Create a chain of handlers
 */
export function chainHandlers(...handlers: ActionHandler[]): ActionHandler {
  return async (event: A2UIActionEvent) => {
    for (const handler of handlers) {
      await handler(event);
    }
  };
}

/**
 * Create a conditional handler
 */
export function conditionalHandler(
  condition: (event: A2UIActionEvent) => boolean,
  handler: ActionHandler
): ActionHandler {
  return async (event: A2UIActionEvent) => {
    if (condition(event)) {
      await handler(event);
    }
  };
}

// ============================================================
// Common Action Types
// ============================================================

export const CommonActions = {
  DISMISS: 'dismiss',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  SUBMIT: 'submit',
  NEXT: 'next',
  PREVIOUS: 'previous',
  RETRY: 'retry',
  EXPAND: 'expand',
  COLLAPSE: 'collapse',
  COPY: 'copy',
  RUN: 'run',
  EDIT: 'edit',
  DELETE: 'delete',
  REFRESH: 'refresh',
} as const;

// ============================================================
// Singleton Export
// ============================================================

const globalRegistry = globalThis as unknown as { a2uiActionRegistry?: ActionHandlerRegistry };

export const actionRegistry: ActionHandlerRegistry = 
  globalRegistry.a2uiActionRegistry || new ActionHandlerRegistry();

if (!globalRegistry.a2uiActionRegistry) {
  globalRegistry.a2uiActionRegistry = actionRegistry;
}

// Register default dismiss handler
actionRegistry.on(CommonActions.DISMISS, createDismissHandler());
actionRegistry.on(CommonActions.CANCEL, createDismissHandler());

export default actionRegistry;
