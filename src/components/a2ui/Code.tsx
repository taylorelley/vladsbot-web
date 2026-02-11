"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { A2UICodeProps } from "@/types/a2ui";
import { A2UIComponentWrapper, A2UIActions } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { Copy, Check, Play, FileCode } from "lucide-react";

// ============================================================
// Syntax Highlighting Colors (basic theme)
// ============================================================

const syntaxColors = {
  keyword: "#c678dd",
  string: "#98c379",
  number: "#d19a66",
  comment: "#5c6370",
  function: "#61afef",
  variable: "#e06c75",
  operator: "#56b6c2",
  punctuation: "#abb2bf",
};

// ============================================================
// Basic Syntax Highlighting
// ============================================================

function highlightCode(code: string, language: string): string {
  // Basic syntax highlighting patterns
  const patterns: Record<string, RegExp[]> = {
    keyword: [
      /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|void|null|undefined|true|false|def|print|in|and|or|not|elif|except|finally|lambda|pass|yield|with|as|assert|break|continue|del|exec|global|is|nonlocal|raise)\b/g,
    ],
    string: [
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    ],
    number: [
      /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi,
    ],
    comment: [
      /\/\/.*$/gm,
      /\/\*[\s\S]*?\*\//g,
      /#.*$/gm,
    ],
    function: [
      /\b([a-zA-Z_]\w*)\s*(?=\()/g,
    ],
  };

  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Apply highlighting
  Object.entries(patterns).forEach(([type, regexes]) => {
    regexes.forEach((regex) => {
      const color = syntaxColors[type as keyof typeof syntaxColors] || syntaxColors.punctuation;
      result = result.replace(regex, (match) => {
        // Don't highlight if already inside a span
        if (match.includes("<span")) return match;
        return `<span style="color: ${color}">${match}</span>`;
      });
    });
  });

  return result;
}

// ============================================================
// Code Component
// ============================================================

function Code({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UICodeProps;
  const {
    title,
    code,
    language = "plaintext",
    copyable = true,
    runnable = false,
    lineNumbers = true,
    highlightLines = [],
    maxHeight,
    actions,
  } = props;

  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState("");
  const codeRef = useRef<HTMLPreElement>(null);

  // Apply syntax highlighting
  useEffect(() => {
    if (language !== "plaintext") {
      setHighlightedCode(highlightCode(code, language));
    } else {
      setHighlightedCode(code);
    }
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  const handleAction = useCallback(
    (action: string) => {
      if (onAction) {
        onAction({
          type: "action",
          componentId: component.id,
          action,
          data: { code, language },
          timestamp: Date.now(),
        });
      }
    },
    [component.id, code, language, onAction]
  );

  const lines = code.split("\n");

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      {/* Language Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileCode className="w-3 h-3" />
          <span>{language}</span>
        </div>
        <div className="flex items-center gap-1">
          {runnable && (
            <button
              onClick={() => handleAction("run")}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Run code"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          {copyable && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={copied ? "Copied!" : "Copy code"}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code Block */}
      <div
        className={cn(
          "rounded-lg overflow-hidden border border-white/10 bg-black/40",
          maxHeight && "overflow-y-auto"
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <pre
          ref={codeRef}
          className="p-4 overflow-x-auto text-sm font-mono"
        >
          {lineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, index) => {
                  const lineNumber = index + 1;
                  const isHighlighted = highlightLines.includes(lineNumber);
                  
                  return (
                    <tr
                      key={index}
                      className={cn(isHighlighted && "bg-yellow-500/10")}
                    >
                      <td className="select-none pr-4 text-right text-muted-foreground/50 align-top w-8">
                        {lineNumber}
                      </td>
                      <td className="whitespace-pre">
                        {language !== "plaintext" ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightCode(line, language),
                            }}
                          />
                        ) : (
                          line
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <code
              dangerouslySetInnerHTML={{
                __html: language !== "plaintext" ? highlightedCode : code,
              }}
            />
          )}
        </pre>
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="mt-3">
          <A2UIActions actions={actions} onAction={handleAction} size="sm" />
        </div>
      )}
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Standalone Code Block
// ============================================================

export function StandaloneCode({
  code,
  language = "plaintext",
  copyable = true,
  lineNumbers = false,
  maxHeight,
  className,
}: {
  code: string;
  language?: string;
  copyable?: boolean;
  lineNumbers?: boolean;
  maxHeight?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  return (
    <div className={cn("relative group", className)}>
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      )}
      <pre
        className={cn(
          "p-4 rounded-lg overflow-x-auto text-sm font-mono bg-black/40 border border-white/10",
          maxHeight && "overflow-y-auto"
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code
          dangerouslySetInnerHTML={{
            __html: language !== "plaintext" ? highlightCode(code, language) : code,
          }}
        />
      </pre>
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Code", Code, "Code");

export { Code };
export default Code;
