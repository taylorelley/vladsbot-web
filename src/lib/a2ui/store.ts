// A2UI V3 - Component Store
// In-memory store with event emission for real-time updates

import { 
  A2UIComponent, 
  A2UIComponentId, 
  A2UIComponentState, 
  A2UIRenderRequest,
  A2UIActionEvent,
  A2UIActivity,
  A2UIAnalytics,
  A2UISubAgent,
  A2UISSEMessage,
  isA2UIComponentType,
  createComponentId
} from '@/types/a2ui';

// ============================================================
// Event Emitter
// ============================================================

type EventHandler = (message: A2UISSEMessage) => void;

class A2UIEventEmitter {
  private handlers: Set<EventHandler> = new Set();

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(message: A2UISSEMessage): void {
    this.handlers.forEach(handler => {
      try {
        handler(message);
      } catch (err) {
        console.error('A2UI event handler error:', err);
      }
    });
  }

  get subscriberCount(): number {
    return this.handlers.size;
  }
}

// ============================================================
// Component Store
// ============================================================

class A2UIStore {
  private components: Map<A2UIComponentId, A2UIComponentState> = new Map();
  private actionQueue: A2UIActionEvent[] = [];
  private activities: A2UIActivity[] = [];
  private analytics: A2UIAnalytics | null = null;
  private subAgents: A2UISubAgent[] = [];
  
  public events = new A2UIEventEmitter();

  // Max limits
  private readonly MAX_COMPONENTS = 100;
  private readonly MAX_ACTIONS = 50;
  private readonly MAX_ACTIVITIES = 100;
  private readonly COMPONENT_TTL = 30 * 60 * 1000; // 30 minutes

  // ============================================================
  // Component Methods
  // ============================================================

  render(request: A2UIRenderRequest): A2UIComponentState {
    // Validate component type
    if (!isA2UIComponentType(request.component)) {
      throw new Error(`Invalid component type: ${request.component}`);
    }

    // Generate ID if not provided
    const id = request.id || createComponentId(request.component.toLowerCase());

    // Check if updating existing component
    const existing = this.components.get(id);
    const now = Date.now();

    const state: A2UIComponentState = {
      id,
      component: request.component,
      props: request.props as unknown as A2UIComponentState['props'],
      location: request.location || 'chat',
      position: request.position || 'inline',
      timestamp: now,
      expiresAt: request.ttl ? now + request.ttl : now + this.COMPONENT_TTL,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
    };

    // Store component
    this.components.set(id, state);

    // Emit event
    this.events.emit({
      type: existing ? 'component.update' : 'component.render',
      data: state,
      timestamp: now,
    });

    // Cleanup old components if at limit
    this.cleanupComponents();

    return state;
  }

  update(id: A2UIComponentId, props: Partial<Record<string, unknown>>): A2UIComponentState | null {
    const existing = this.components.get(id);
    if (!existing) {
      return null;
    }

    const now = Date.now();
    const state: A2UIComponentState = {
      ...existing,
      props: { ...existing.props, ...props } as A2UIComponentState['props'],
      updatedAt: now,
      version: existing.version + 1,
    };

    this.components.set(id, state);

    this.events.emit({
      type: 'component.update',
      data: state,
      timestamp: now,
    });

    return state;
  }

  remove(id: A2UIComponentId): boolean {
    const existed = this.components.delete(id);
    
    if (existed) {
      this.events.emit({
        type: 'component.remove',
        data: { componentId: id },
        timestamp: Date.now(),
      });
    }

    return existed;
  }

  get(id: A2UIComponentId): A2UIComponentState | undefined {
    return this.components.get(id);
  }

  getByLocation(location: A2UIComponent['location']): A2UIComponentState[] {
    return Array.from(this.components.values())
      .filter(c => c.location === location)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  getAll(): A2UIComponentState[] {
    return Array.from(this.components.values())
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  private cleanupComponents(): void {
    const now = Date.now();
    
    // Remove expired components
    for (const [id, component] of this.components) {
      if (component.expiresAt && component.expiresAt < now) {
        this.remove(id);
      }
    }

    // Remove oldest if over limit
    if (this.components.size > this.MAX_COMPONENTS) {
      const sorted = Array.from(this.components.entries())
        .sort(([, a], [, b]) => (a.timestamp || 0) - (b.timestamp || 0));
      
      const toRemove = sorted.slice(0, sorted.length - this.MAX_COMPONENTS);
      toRemove.forEach(([id]) => this.remove(id));
    }
  }

  // ============================================================
  // Action Methods
  // ============================================================

  queueAction(action: A2UIActionEvent): void {
    this.actionQueue.push(action);
    
    this.events.emit({
      type: 'action.received',
      data: action,
      timestamp: Date.now(),
    });

    // Limit queue size
    if (this.actionQueue.length > this.MAX_ACTIONS) {
      this.actionQueue = this.actionQueue.slice(-this.MAX_ACTIONS);
    }
  }

  dequeueAction(): A2UIActionEvent | undefined {
    return this.actionQueue.shift();
  }

  peekActions(count = 10): A2UIActionEvent[] {
    return this.actionQueue.slice(0, count);
  }

  getActionCount(): number {
    return this.actionQueue.length;
  }

  // ============================================================
  // Activity Methods
  // ============================================================

  addActivity(activity: A2UIActivity): void {
    // Check for existing activity with same ID
    const existingIndex = this.activities.findIndex(a => a.id === activity.id);
    
    if (existingIndex >= 0) {
      this.activities[existingIndex] = activity;
    } else {
      this.activities.push(activity);
    }

    // Sort by timestamp (most recent first) and limit
    this.activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (this.activities.length > this.MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, this.MAX_ACTIVITIES);
    }

    this.events.emit({
      type: 'activity.update',
      data: { activities: this.activities, timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  updateActivity(id: string, updates: Partial<A2UIActivity>): void {
    const index = this.activities.findIndex(a => a.id === id);
    if (index >= 0) {
      this.activities[index] = { ...this.activities[index], ...updates };
      
      this.events.emit({
        type: 'activity.update',
        data: { activities: this.activities, timestamp: Date.now() },
        timestamp: Date.now(),
      });
    }
  }

  getActivities(): A2UIActivity[] {
    return [...this.activities];
  }

  clearActivities(): void {
    this.activities = [];
    
    this.events.emit({
      type: 'activity.update',
      data: { activities: [], timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  // ============================================================
  // Sub-Agent Methods
  // ============================================================

  addSubAgent(agent: A2UISubAgent): void {
    const existing = this.subAgents.findIndex(a => a.id === agent.id);
    if (existing >= 0) {
      this.subAgents[existing] = agent;
    } else {
      this.subAgents.push(agent);
    }
  }

  updateSubAgent(id: string, updates: Partial<A2UISubAgent>): void {
    const index = this.subAgents.findIndex(a => a.id === id);
    if (index >= 0) {
      this.subAgents[index] = { ...this.subAgents[index], ...updates };
    }
  }

  getSubAgents(): A2UISubAgent[] {
    return [...this.subAgents];
  }

  getSubAgentTree(): A2UISubAgent[] {
    // Build tree structure from flat list
    const agentMap = new Map<string, A2UISubAgent>();
    const roots: A2UISubAgent[] = [];

    // First pass: create map
    this.subAgents.forEach(agent => {
      agentMap.set(agent.id, { ...agent, children: [] });
    });

    // Second pass: build tree
    this.subAgents.forEach(agent => {
      const node = agentMap.get(agent.id)!;
      if (agent.parentId && agentMap.has(agent.parentId)) {
        const parent = agentMap.get(agent.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // ============================================================
  // Analytics Methods
  // ============================================================

  setAnalytics(analytics: A2UIAnalytics): void {
    this.analytics = analytics;
  }

  getAnalytics(): A2UIAnalytics | null {
    return this.analytics;
  }

  updateAnalytics(updates: Partial<A2UIAnalytics>): void {
    if (this.analytics) {
      this.analytics = { ...this.analytics, ...updates };
    }
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  clear(): void {
    this.components.clear();
    this.actionQueue = [];
    this.activities = [];
    this.analytics = null;
    this.subAgents = [];
  }

  getStats(): {
    componentCount: number;
    actionQueueSize: number;
    activityCount: number;
    subscriberCount: number;
  } {
    return {
      componentCount: this.components.size,
      actionQueueSize: this.actionQueue.length,
      activityCount: this.activities.length,
      subscriberCount: this.events.subscriberCount,
    };
  }
}

// ============================================================
// Singleton Export
// ============================================================

// Global store instance
const globalStore = globalThis as unknown as { a2uiStore?: A2UIStore };

export const a2uiStore: A2UIStore = globalStore.a2uiStore || new A2UIStore();

if (!globalStore.a2uiStore) {
  globalStore.a2uiStore = a2uiStore;
}

export default a2uiStore;
