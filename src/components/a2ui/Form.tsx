"use client";

import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { A2UIFormProps, A2UIFormField, A2UIValidationError } from "@/types/a2ui";
import { A2UIComponentWrapper } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { validateFormData } from "@/lib/a2ui/validation";
import { AlertCircle, CheckCircle } from "lucide-react";

// ============================================================
// Form Component
// ============================================================

function Form({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIFormProps;
  const {
    description,
    fields,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    showCancel = true,
    inline = false,
    note,
  } = props;

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    // Initialize with default values
    const initial: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.value !== undefined) {
        initial[field.name] = field.value;
      } else if (field.type === "checkbox") {
        initial[field.name] = [];
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState<A2UIValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => prev.filter((e) => e.field !== name));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate
      const validation = validateFormData(fields, formData);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }

      setIsSubmitting(true);
      setErrors([]);

      if (onAction) {
        onAction({
          type: "submit",
          componentId: component.id,
          action: "submit",
          data: formData,
          timestamp: Date.now(),
        });
      }

      setIsSubmitting(false);
    },
    [component.id, fields, formData, onAction]
  );

  const handleCancel = useCallback(() => {
    if (onAction) {
      onAction({
        type: "action",
        componentId: component.id,
        action: "cancel",
        timestamp: Date.now(),
      });
    }
  }, [component.id, onAction]);

  // Check which fields should be visible
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.showIf) return true;
      return Object.entries(field.showIf).every(
        ([key, value]) => formData[key] === value
      );
    });
  }, [fields, formData]);

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={cn(inline ? "flex flex-wrap gap-4" : "space-y-4")}>
          {visibleFields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={(value) => handleChange(field.name, value)}
              error={errors.find((e) => e.field === field.name)}
              inline={inline}
            />
          ))}
        </div>

        {/* Error Summary */}
        {errors.length > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-sm">
            <div className="flex items-center gap-2 text-red-500 font-medium mb-1">
              <AlertCircle className="w-4 h-4" />
              Please fix the following errors:
            </div>
            <ul className="list-disc list-inside text-muted-foreground">
              {errors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Note */}
        {note && (
          <p className="text-xs text-muted-foreground">{note}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "glass-button px-4 py-2 rounded-lg font-medium",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="glass-button-secondary px-4 py-2 rounded-lg font-medium"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </form>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Form Field Component
// ============================================================

interface FormFieldProps {
  field: A2UIFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: A2UIValidationError;
  inline?: boolean;
}

function FormField({ field, value, onChange, error, inline }: FormFieldProps) {
  const {
    name,
    label,
    type,
    placeholder,
    required,
    disabled,
    options,
    min,
    max,
    step,
    rows,
  } = field;

  const inputClasses = cn(
    "w-full px-3 py-2 rounded-lg bg-black/20 border transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error ? "border-red-500" : "border-white/10 focus:border-primary"
  );

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            name={name}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows || 3}
            className={inputClasses}
          />
        );

      case "select":
        return (
          <select
            name={name}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">{placeholder || "Select..."}</option>
            {options?.map((opt) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {options?.map((opt) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const checked = Array.isArray(value) && value.includes(optValue);
              return (
                <label
                  key={optValue}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => {
                      const currentValue = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        onChange([...currentValue, optValue]);
                      } else {
                        onChange(currentValue.filter((v) => v !== optValue));
                      }
                    }}
                    className="w-4 h-4 rounded bg-black/20 border-white/10"
                  />
                  <span className="text-sm">{optLabel}</span>
                </label>
              );
            })}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {options?.map((opt) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              return (
                <label
                  key={optValue}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={name}
                    value={optValue}
                    checked={value === optValue}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-4 h-4 bg-black/20 border-white/10"
                  />
                  <span className="text-sm">{optLabel}</span>
                </label>
              );
            })}
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            name={name}
            value={(value as number) ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={inputClasses}
          />
        );

      case "date":
        return (
          <input
            type="date"
            name={name}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case "hidden":
        return (
          <input type="hidden" name={name} value={(value as string) || ""} />
        );

      case "password":
      case "email":
      case "url":
      case "text":
      default:
        return (
          <input
            type={type}
            name={name}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
          />
        );
    }
  };

  if (type === "hidden") {
    return renderInput();
  }

  return (
    <div className={cn("space-y-1.5", inline && "flex-1 min-w-[200px]")}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Form", Form, "Form");

export { Form };
export default Form;
