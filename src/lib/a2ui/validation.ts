// A2UI V3 - Validation Layer
// Comprehensive validation for all component types

import {
  A2UIComponentType,
  A2UICardProps,
  A2UIButtonGroupProps,
  A2UIFormProps,
  A2UITableProps,
  A2UIProgressProps,
  A2UIListProps,
  A2UIChartProps,
  A2UIAccordionProps,
  A2UIAlertProps,
  A2UICodeProps,
  A2UIValidationResult,
  A2UIValidationError,
  A2UIAction,
  A2UIFormField,
  isA2UIVariant,
} from '@/types/a2ui';

// ============================================================
// Validation Helpers
// ============================================================

function createError(field: string, message: string, code: string): A2UIValidationError {
  return { field, message, code };
}

function validateString(value: unknown, field: string, required = false): A2UIValidationError | null {
  if (required && (value === undefined || value === null || value === '')) {
    return createError(field, `${field} is required`, 'REQUIRED');
  }
  if (value !== undefined && value !== null && typeof value !== 'string') {
    return createError(field, `${field} must be a string`, 'INVALID_TYPE');
  }
  return null;
}

function validateNumber(value: unknown, field: string, required = false, min?: number, max?: number): A2UIValidationError | null {
  if (required && (value === undefined || value === null)) {
    return createError(field, `${field} is required`, 'REQUIRED');
  }
  if (value !== undefined && value !== null) {
    if (typeof value !== 'number' || isNaN(value)) {
      return createError(field, `${field} must be a number`, 'INVALID_TYPE');
    }
    if (min !== undefined && value < min) {
      return createError(field, `${field} must be at least ${min}`, 'MIN_VALUE');
    }
    if (max !== undefined && value > max) {
      return createError(field, `${field} must be at most ${max}`, 'MAX_VALUE');
    }
  }
  return null;
}

function validateBoolean(value: unknown, field: string): A2UIValidationError | null {
  if (value !== undefined && value !== null && typeof value !== 'boolean') {
    return createError(field, `${field} must be a boolean`, 'INVALID_TYPE');
  }
  return null;
}

function validateArray(value: unknown, field: string, required = false): A2UIValidationError | null {
  if (required && (!value || !Array.isArray(value) || value.length === 0)) {
    return createError(field, `${field} is required and must be a non-empty array`, 'REQUIRED');
  }
  if (value !== undefined && value !== null && !Array.isArray(value)) {
    return createError(field, `${field} must be an array`, 'INVALID_TYPE');
  }
  return null;
}

function validateVariant(value: unknown, field: string): A2UIValidationError | null {
  if (value !== undefined && value !== null) {
    if (typeof value !== 'string' || !isA2UIVariant(value)) {
      return createError(field, `${field} must be a valid variant (default, success, warning, error, info, primary, secondary, danger)`, 'INVALID_VARIANT');
    }
  }
  return null;
}

function validateActions(actions: unknown, field: string): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  
  if (actions === undefined || actions === null) return errors;
  
  if (!Array.isArray(actions)) {
    errors.push(createError(field, `${field} must be an array`, 'INVALID_TYPE'));
    return errors;
  }

  actions.forEach((action: unknown, index: number) => {
    const a = action as A2UIAction;
    const prefix = `${field}[${index}]`;
    
    const labelErr = validateString(a?.label, `${prefix}.label`, true);
    if (labelErr) errors.push(labelErr);
    
    const actionErr = validateString(a?.action, `${prefix}.action`, true);
    if (actionErr) errors.push(actionErr);
    
    const variantErr = validateVariant(a?.variant, `${prefix}.variant`);
    if (variantErr) errors.push(variantErr);
  });

  return errors;
}

// ============================================================
// Component Validators
// ============================================================

function validateCardProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UICardProps>;

  const titleErr = validateString(p?.title, 'title');
  if (titleErr) errors.push(titleErr);

  const subtitleErr = validateString(p?.subtitle, 'subtitle');
  if (subtitleErr) errors.push(subtitleErr);

  const contentErr = validateString(p?.content, 'content');
  if (contentErr) errors.push(contentErr);

  const variantErr = validateVariant(p?.variant, 'variant');
  if (variantErr) errors.push(variantErr);

  errors.push(...validateActions(p?.actions, 'actions'));

  return errors;
}

function validateButtonGroupProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIButtonGroupProps>;

  const buttonsErr = validateArray(p?.buttons, 'buttons', true);
  if (buttonsErr) {
    errors.push(buttonsErr);
  } else {
    errors.push(...validateActions(p?.buttons, 'buttons'));
  }

  if (p?.layout && !['horizontal', 'vertical'].includes(p.layout)) {
    errors.push(createError('layout', 'layout must be "horizontal" or "vertical"', 'INVALID_LAYOUT'));
  }

  return errors;
}

function validateFormField(field: unknown, index: number): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const f = field as Partial<A2UIFormField>;
  const prefix = `fields[${index}]`;

  const nameErr = validateString(f?.name, `${prefix}.name`, true);
  if (nameErr) errors.push(nameErr);

  const validTypes = ['text', 'textarea', 'select', 'checkbox', 'radio', 'number', 'date', 'password', 'email', 'url', 'hidden'];
  if (!f?.type || !validTypes.includes(f.type)) {
    errors.push(createError(`${prefix}.type`, `type must be one of: ${validTypes.join(', ')}`, 'INVALID_FIELD_TYPE'));
  }

  // Options required for select, checkbox, radio
  if (['select', 'checkbox', 'radio'].includes(f?.type || '') && !f?.options) {
    errors.push(createError(`${prefix}.options`, 'options is required for select, checkbox, and radio fields', 'REQUIRED'));
  }

  return errors;
}

function validateFormProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIFormProps>;

  const fieldsErr = validateArray(p?.fields, 'fields', true);
  if (fieldsErr) {
    errors.push(fieldsErr);
  } else if (p?.fields) {
    p.fields.forEach((field, index) => {
      errors.push(...validateFormField(field, index));
    });
  }

  return errors;
}

function validateTableProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UITableProps>;

  const rowsErr = validateArray(p?.rows, 'rows', true);
  if (rowsErr) errors.push(rowsErr);

  // Either headers or columns must be provided
  if (!p?.headers && !p?.columns) {
    errors.push(createError('headers', 'Either headers or columns is required', 'REQUIRED'));
  }

  return errors;
}

function validateProgressProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIProgressProps>;

  const currentErr = validateNumber(p?.current, 'current', true, 0);
  if (currentErr) errors.push(currentErr);

  const totalErr = validateNumber(p?.total, 'total', true, 1);
  if (totalErr) errors.push(totalErr);

  const percentErr = validateNumber(p?.percentage, 'percentage', false, 0, 100);
  if (percentErr) errors.push(percentErr);

  const variantErr = validateVariant(p?.variant, 'variant');
  if (variantErr) errors.push(variantErr);

  return errors;
}

function validateListProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIListProps>;

  const itemsErr = validateArray(p?.items, 'items', true);
  if (itemsErr) errors.push(itemsErr);

  if (p?.variant && !['simple', 'checklist', 'timeline', 'tree'].includes(p.variant)) {
    errors.push(createError('variant', 'variant must be "simple", "checklist", "timeline", or "tree"', 'INVALID_VARIANT'));
  }

  return errors;
}

function validateChartProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIChartProps>;

  const validTypes = ['line', 'bar', 'pie', 'doughnut', 'area', 'radar'];
  if (!p?.type || !validTypes.includes(p.type)) {
    errors.push(createError('type', `type must be one of: ${validTypes.join(', ')}`, 'INVALID_CHART_TYPE'));
  }

  if (!p?.data || typeof p.data !== 'object') {
    errors.push(createError('data', 'data is required', 'REQUIRED'));
  } else {
    if (!p.data.labels || !Array.isArray(p.data.labels)) {
      errors.push(createError('data.labels', 'data.labels is required and must be an array', 'REQUIRED'));
    }
    if (!p.data.datasets || !Array.isArray(p.data.datasets)) {
      errors.push(createError('data.datasets', 'data.datasets is required and must be an array', 'REQUIRED'));
    }
  }

  return errors;
}

function validateAccordionProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIAccordionProps>;

  const sectionsErr = validateArray(p?.sections, 'sections', true);
  if (sectionsErr) {
    errors.push(sectionsErr);
  } else if (p?.sections) {
    p.sections.forEach((section, index) => {
      const titleErr = validateString(section?.title, `sections[${index}].title`, true);
      if (titleErr) errors.push(titleErr);
    });
  }

  return errors;
}

function validateAlertProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UIAlertProps>;

  const messageErr = validateString(p?.message, 'message', true);
  if (messageErr) errors.push(messageErr);

  const variantErr = validateVariant(p?.variant, 'variant');
  if (variantErr) errors.push(variantErr);
  if (!p?.variant) {
    errors.push(createError('variant', 'variant is required', 'REQUIRED'));
  }

  return errors;
}

function validateCodeProps(props: unknown): A2UIValidationError[] {
  const errors: A2UIValidationError[] = [];
  const p = props as Partial<A2UICodeProps>;

  const codeErr = validateString(p?.code, 'code', true);
  if (codeErr) errors.push(codeErr);

  const validLangs = ['typescript', 'javascript', 'python', 'bash', 'json', 'yaml', 'html', 'css', 'sql', 'markdown', 'plaintext'];
  if (p?.language && !validLangs.includes(p.language)) {
    errors.push(createError('language', `language must be one of: ${validLangs.join(', ')}`, 'INVALID_LANGUAGE'));
  }

  return errors;
}

// ============================================================
// Main Validation Function
// ============================================================

export function validateComponentProps(
  component: A2UIComponentType,
  props: unknown
): A2UIValidationResult {
  const validators: Record<A2UIComponentType, (props: unknown) => A2UIValidationError[]> = {
    Card: validateCardProps,
    ButtonGroup: validateButtonGroupProps,
    Form: validateFormProps,
    Table: validateTableProps,
    Progress: validateProgressProps,
    List: validateListProps,
    Chart: validateChartProps,
    Accordion: validateAccordionProps,
    Alert: validateAlertProps,
    Code: validateCodeProps,
  };

  const validator = validators[component];
  if (!validator) {
    return {
      valid: false,
      errors: [createError('component', `Unknown component type: ${component}`, 'UNKNOWN_COMPONENT')],
    };
  }

  const errors = validator(props);
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// Form Data Validation
// ============================================================

export function validateFormData(
  fields: A2UIFormField[],
  data: Record<string, unknown>
): A2UIValidationResult {
  const errors: A2UIValidationError[] = [];

  for (const field of fields) {
    const value = data[field.name];

    // Required check
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(createError(field.name, `${field.label || field.name} is required`, 'REQUIRED'));
      continue;
    }

    // Skip validation if optional and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(createError(field.name, `${field.label || field.name} must be a number`, 'INVALID_TYPE'));
        } else {
          const num = Number(value);
          if (field.min !== undefined && num < field.min) {
            errors.push(createError(field.name, `${field.label || field.name} must be at least ${field.min}`, 'MIN_VALUE'));
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(createError(field.name, `${field.label || field.name} must be at most ${field.max}`, 'MAX_VALUE'));
          }
        }
        break;

      case 'email':
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(createError(field.name, `${field.label || field.name} must be a valid email`, 'INVALID_EMAIL'));
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            errors.push(createError(field.name, `${field.label || field.name} must be a valid URL`, 'INVALID_URL'));
          }
        }
        break;

      case 'select':
      case 'radio':
        if (field.options) {
          const validValues = field.options.map(opt => 
            typeof opt === 'string' ? opt : opt.value
          );
          if (!validValues.includes(value as string)) {
            errors.push(createError(field.name, `${field.label || field.name} must be one of the available options`, 'INVALID_OPTION'));
          }
        }
        break;
    }

    // Custom pattern validation
    if (field.validation?.pattern && typeof value === 'string') {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push(createError(
          field.name, 
          field.validation.message || `${field.label || field.name} is invalid`, 
          'PATTERN_MISMATCH'
        ));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
