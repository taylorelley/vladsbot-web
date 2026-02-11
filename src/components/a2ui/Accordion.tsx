"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { A2UIAccordionProps, A2UIAccordionSection, A2UIVariant } from "@/types/a2ui";
import { A2UIComponentWrapper } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { DynamicComponent } from "./A2UIRegistry";
import { ChevronDown } from "lucide-react";

// ============================================================
// Accordion Component
// ============================================================

function Accordion({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIAccordionProps;
  const { sections, allowMultiple = false, variant = "default" } = props;

  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    sections.forEach((section, index) => {
      if (section.defaultOpen) {
        initial.add(index);
      }
    });
    return initial;
  });

  const toggleSection = useCallback(
    (index: number) => {
      setOpenSections((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(index);
        }
        return next;
      });

      if (onAction) {
        onAction({
          type: "action",
          componentId: component.id,
          action: openSections.has(index) ? "collapse" : "expand",
          data: { sectionIndex: index },
          timestamp: Date.now(),
        });
      }
    },
    [allowMultiple, component.id, onAction, openSections]
  );

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      <div className="space-y-2">
        {sections.map((section, index) => (
          <AccordionSection
            key={section.id || index}
            section={section}
            isOpen={openSections.has(index)}
            onToggle={() => toggleSection(index)}
            variant={variant}
            onAction={onAction}
            componentId={component.id}
          />
        ))}
      </div>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Accordion Section
// ============================================================

interface AccordionSectionProps {
  section: A2UIAccordionSection;
  isOpen: boolean;
  onToggle: () => void;
  variant: A2UIVariant;
  onAction?: A2UIRendererProps["onAction"];
  componentId: string;
}

function AccordionSection({
  section,
  isOpen,
  onToggle,
  variant,
  onAction,
  componentId,
}: AccordionSectionProps) {
  const variantStyles: Record<A2UIVariant, string> = {
    default: "border-white/10 hover:bg-white/5",
    success: "border-green-500/30 hover:bg-green-500/5",
    warning: "border-yellow-500/30 hover:bg-yellow-500/5",
    error: "border-red-500/30 hover:bg-red-500/5",
    info: "border-blue-500/30 hover:bg-blue-500/5",
    primary: "border-primary/30 hover:bg-primary/5",
    secondary: "border-white/20 hover:bg-white/5",
    danger: "border-red-600/30 hover:bg-red-600/5",
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", variantStyles[variant])}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
          variantStyles[variant]
        )}
      >
        <div className="flex items-center gap-2">
          {section.icon && <span>{section.icon}</span>}
          <span className="font-medium text-sm">{section.title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-3 border-t border-white/10">
          {section.content && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {section.content}
            </p>
          )}
          {section.component && (
            <DynamicComponent
              component={{
                ...section.component,
                id: `${componentId}-${section.id || "section"}`,
                timestamp: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: 1,
              }}
              onAction={onAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Standalone Accordion
// ============================================================

export function StandaloneAccordion({
  sections,
  allowMultiple = false,
  variant = "default",
  className,
}: A2UIAccordionProps & { className?: string }) {
  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    sections.forEach((section, index) => {
      if (section.defaultOpen) {
        initial.add(index);
      }
    });
    return initial;
  });

  const toggleSection = useCallback(
    (index: number) => {
      setOpenSections((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(index);
        }
        return next;
      });
    },
    [allowMultiple]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {sections.map((section, index) => (
        <AccordionSection
          key={section.id || index}
          section={section}
          isOpen={openSections.has(index)}
          onToggle={() => toggleSection(index)}
          variant={variant}
          componentId="standalone"
        />
      ))}
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Accordion", Accordion, "Accordion");

export { Accordion };
export default Accordion;
