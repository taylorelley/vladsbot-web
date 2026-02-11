// A2UI V3 - Interactive Controls Type System
// Comprehensive types for all 10 interactive components

// ============================================================
// Core Types
// ============================================================

/** Unique identifier for components */
export type A2UIComponentId = string;

/** Available component types */
export type A2UIComponentType = 
  | 'Card'
  | 'ButtonGroup'
  | 'Form'
  | 'Table'
  | 'Progress'
  | 'List'
  | 'Chart'
  | 'Accordion'
  | 'Alert'
  | 'Code';

/** Visual variants for components */
export type A2UIVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' | 'danger';

/** Rendering locations */
export type A2UILocation = 'chat' | 'sidebar' | 'floating';

/** Position within location */
export type A2UIPosition = 'top' | 'bottom' | 'inline' | 'replace';

/** Status for activities and list items */
export type A2UIStatus = 'active' | 'completed' | 'failed' | 'pending';

// ============================================================
// Action Types
// ============================================================

/** Button action definition */
export interface A2UIAction {
  label: string;
  action: string;
  variant?: A2UIVariant;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
}

/** User action event from component */
export interface A2UIActionEvent {
  type: 'action' | 'submit' | 'dismiss' | 'change';
  componentId: A2UIComponentId;
  action?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// ============================================================
// Component Props
// ============================================================

/** Base props shared by all components */
export interface A2UIBaseProps {
  id: A2UIComponentId;
  title?: string;
  subtitle?: string;
  className?: string;
}

/** Card component props */
export interface A2UICardProps extends A2UIBaseProps {
  content?: string;
  icon?: string;
  variant?: A2UIVariant;
  actions?: A2UIAction[];
  footer?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/** Button group props */
export interface A2UIButtonGroupProps extends A2UIBaseProps {
  buttons: A2UIAction[];
  layout?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

/** Form field types */
export type A2UIFieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'number' 
  | 'date' 
  | 'password'
  | 'email'
  | 'url'
  | 'hidden';

/** Form field definition */
export interface A2UIFormField {
  name: string;
  label?: string;
  type: A2UIFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: string[] | { label: string; value: string }[];
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  validation?: {
    pattern?: string;
    message?: string;
  };
  showIf?: Record<string, unknown>;
}

/** Form component props */
export interface A2UIFormProps extends A2UIBaseProps {
  description?: string;
  fields: A2UIFormField[];
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  inline?: boolean;
  note?: string;
}

/** Table column definition */
export interface A2UITableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

/** Table component props */
export interface A2UITableProps extends A2UIBaseProps {
  headers?: string[];
  columns?: A2UITableColumn[];
  rows: (string | number | boolean | null)[][] | Record<string, unknown>[];
  sortable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  actions?: A2UIAction[];
  emptyMessage?: string;
  striped?: boolean;
  compact?: boolean;
}

/** Progress component props */
export interface A2UIProgressProps extends A2UIBaseProps {
  current: number;
  total: number;
  percentage?: number;
  status?: string;
  variant?: A2UIVariant;
  showPercentage?: boolean;
  animated?: boolean;
  steps?: { label: string; completed: boolean }[];
}

/** List item definition */
export interface A2UIListItem {
  icon?: string;
  text: string;
  status?: A2UIStatus;
  time?: string;
  description?: string;
  children?: A2UIListItem[];
  actions?: A2UIAction[];
}

/** List component props */
export interface A2UIListProps extends A2UIBaseProps {
  items: A2UIListItem[];
  variant?: 'simple' | 'checklist' | 'timeline' | 'tree';
  interactive?: boolean;
  collapsible?: boolean;
}

/** Chart dataset definition */
export interface A2UIChartDataset {
  label: string;
  data: number[];
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
}

/** Chart component props */
export interface A2UIChartProps extends A2UIBaseProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'radar';
  data: {
    labels: string[];
    datasets: A2UIChartDataset[];
  };
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  options?: Record<string, unknown>;
}

/** Accordion section definition */
export interface A2UIAccordionSection {
  id?: string;
  title: string;
  content?: string;
  defaultOpen?: boolean;
  icon?: string;
  component?: A2UIComponent;
}

/** Accordion component props */
export interface A2UIAccordionProps extends A2UIBaseProps {
  sections: A2UIAccordionSection[];
  allowMultiple?: boolean;
  variant?: A2UIVariant;
}

/** Alert component props */
export interface A2UIAlertProps extends A2UIBaseProps {
  message: string;
  variant: A2UIVariant;
  dismissible?: boolean;
  actions?: A2UIAction[];
  icon?: string;
  autoHide?: number;
}

/** Code component props */
export interface A2UICodeProps extends A2UIBaseProps {
  code: string;
  language?: 'typescript' | 'javascript' | 'python' | 'bash' | 'json' | 'yaml' | 'html' | 'css' | 'sql' | 'markdown' | 'plaintext';
  copyable?: boolean;
  runnable?: boolean;
  lineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: number;
  actions?: A2UIAction[];
}

// ============================================================
// Component Union Type
// ============================================================

/** Props union for all component types */
export type A2UIComponentProps = 
  | { component: 'Card'; props: A2UICardProps }
  | { component: 'ButtonGroup'; props: A2UIButtonGroupProps }
  | { component: 'Form'; props: A2UIFormProps }
  | { component: 'Table'; props: A2UITableProps }
  | { component: 'Progress'; props: A2UIProgressProps }
  | { component: 'List'; props: A2UIListProps }
  | { component: 'Chart'; props: A2UIChartProps }
  | { component: 'Accordion'; props: A2UIAccordionProps }
  | { component: 'Alert'; props: A2UIAlertProps }
  | { component: 'Code'; props: A2UICodeProps };

// ============================================================
// Rendering Types
// ============================================================

/** Complete component definition for rendering */
export interface A2UIComponent {
  id: A2UIComponentId;
  component: A2UIComponentType;
  props: A2UICardProps | A2UIButtonGroupProps | A2UIFormProps | A2UITableProps | 
         A2UIProgressProps | A2UIListProps | A2UIChartProps | A2UIAccordionProps | 
         A2UIAlertProps | A2UICodeProps;
  location?: A2UILocation;
  position?: A2UIPosition | { x: string; y: string };
  timestamp?: number;
  expiresAt?: number;
}

/** Render request from agent */
export interface A2UIRenderRequest {
  id: A2UIComponentId;
  component: A2UIComponentType;
  props: Record<string, unknown>;
  location?: A2UILocation;
  position?: A2UIPosition | { x: string; y: string };
  ttl?: number;
}

/** Update request for existing component */
export interface A2UIUpdateRequest {
  id: A2UIComponentId;
  props: Partial<Record<string, unknown>>;
}

// ============================================================
// Store Types
// ============================================================

/** Component state in store */
export interface A2UIComponentState extends A2UIComponent {
  createdAt: number;
  updatedAt: number;
  version: number;
}

/** Store state */
export interface A2UIStoreState {
  components: Map<A2UIComponentId, A2UIComponentState>;
  actionQueue: A2UIActionEvent[];
}

// ============================================================
// Activity Types (V1 compatibility + V3 extensions)
// ============================================================

/** Activity item for sidebar display */
export interface A2UIActivity {
  id: string;
  type: 'tool_call' | 'thinking' | 'progress' | 'status' | 'component';
  status: A2UIStatus;
  title: string;
  description?: string;
  progress?: number;
  timestamp: number;
  component?: A2UIComponent;
  parentId?: string;
  children?: A2UIActivity[];
}

/** Activity update message */
export interface A2UIActivityUpdate {
  activities: A2UIActivity[];
  timestamp: number;
}

// ============================================================
// SSE Message Types
// ============================================================

/** Server-sent event message types */
export type A2UISSEMessageType = 
  | 'component.render'
  | 'component.update'
  | 'component.remove'
  | 'action.received'
  | 'activity.update'
  | 'heartbeat';

/** SSE message wrapper */
export interface A2UISSEMessage {
  type: A2UISSEMessageType;
  data: A2UIComponent | A2UIUpdateRequest | A2UIActionEvent | A2UIActivityUpdate | { componentId: string } | null;
  timestamp: number;
}

// ============================================================
// API Response Types
// ============================================================

/** Standard API response */
export interface A2UIAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Render API response */
export interface A2UIRenderResponse extends A2UIAPIResponse<A2UIComponent> {
  rendered: boolean;
}

/** Action API response */
export interface A2UIActionResponse extends A2UIAPIResponse<A2UIActionEvent> {
  acknowledged: boolean;
}

// ============================================================
// Tab Types (for tabbed sidebar)
// ============================================================

/** Available sidebar tabs */
export type A2UISidebarTab = 'overview' | 'activity' | 'analytics';

/** Tab configuration */
export interface A2UITabConfig {
  id: A2UISidebarTab;
  label: string;
  icon: string;
  badge?: number | string;
}

// ============================================================
// Analytics Types
// ============================================================

/** Session analytics data */
export interface A2UIAnalytics {
  sessionId: string;
  startTime: number;
  tokenUsage: {
    current: number;
    total: number;
    history: { time: number; value: number }[];
  };
  toolUsage: {
    name: string;
    calls: number;
    successRate: number;
    avgTime: number;
  }[];
  costs: {
    messages: number;
    tools: number;
    thinking: number;
    total: number;
  };
  subAgents: A2UISubAgent[];
}

/** Sub-agent information */
export interface A2UISubAgent {
  id: string;
  label: string;
  status: A2UIStatus;
  parentId?: string;
  createdAt: number;
  completedAt?: number;
  task?: string;
  children?: A2UISubAgent[];
}

// ============================================================
// Context / Hooks Types
// ============================================================

/** A2UI Context value */
export interface A2UIContextValue {
  components: A2UIComponentState[];
  activities: A2UIActivity[];
  analytics: A2UIAnalytics | null;
  activeTab: A2UISidebarTab;
  setActiveTab: (tab: A2UISidebarTab) => void;
  renderComponent: (component: A2UIRenderRequest) => Promise<void>;
  updateComponent: (id: A2UIComponentId, props: Partial<Record<string, unknown>>) => Promise<void>;
  removeComponent: (id: A2UIComponentId) => Promise<void>;
  emitAction: (action: A2UIActionEvent) => void;
}

// ============================================================
// Validation Types
// ============================================================

/** Validation result */
export interface A2UIValidationResult {
  valid: boolean;
  errors: A2UIValidationError[];
}

/** Validation error */
export interface A2UIValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================
// Export helpers
// ============================================================

/** Type guard for component type */
export function isA2UIComponentType(type: string): type is A2UIComponentType {
  return ['Card', 'ButtonGroup', 'Form', 'Table', 'Progress', 'List', 'Chart', 'Accordion', 'Alert', 'Code'].includes(type);
}

/** Type guard for variant */
export function isA2UIVariant(variant: string): variant is A2UIVariant {
  return ['default', 'success', 'warning', 'error', 'info', 'primary', 'secondary', 'danger'].includes(variant);
}

/** Type guard for location */
export function isA2UILocation(location: string): location is A2UILocation {
  return ['chat', 'sidebar', 'floating'].includes(location);
}

/** Create component ID */
export function createComponentId(prefix?: string): A2UIComponentId {
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${random}` : random;
}
