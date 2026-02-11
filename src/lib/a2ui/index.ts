// A2UI V3 - Main Export
// Consolidates all A2UI functionality

export { a2uiStore, default as store } from './store';
export { 
  actionRegistry, 
  createDismissHandler, 
  createUpdateHandler,
  chainHandlers,
  conditionalHandler,
  CommonActions,
  type ActionHandler,
  type ActionHandlerConfig,
} from './actions';
export { 
  validateComponentProps, 
  validateFormData 
} from './validation';

// Re-export types
export * from '@/types/a2ui';
