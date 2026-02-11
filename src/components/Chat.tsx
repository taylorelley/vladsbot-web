"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot } from "lucide-react";
import { A2UIComponentState } from "@/types/a2ui";
import { DynamicComponent } from "./a2ui/A2UIRegistry";
import { showToast } from "./a2ui/Toast";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<A2UIComponentState[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageIdRef = useRef<string | null>(null); // Track current assistant message

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Listen for A2UI components via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/a2ui/events");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "component.render" || message.type === "component.update") {
          const component = message.data as A2UIComponentState;
          // Only show chat location components
          if (component.location === "chat") {
            setComponents((prev) => {
              const existing = prev.findIndex((c) => c.id === component.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = component;
                return updated;
              }
              return [...prev, component];
            });
          }
        } else if (message.type === "component.remove") {
          const { componentId } = message.data;
          setComponents((prev) => prev.filter((c) => c.id !== componentId));
        }
      } catch (err) {
        console.error("A2UI SSE parse error:", err);
      }
    };

    // Initial fetch of components
    fetch("/api/a2ui/render?location=chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.components) {
          setComponents(data.data.components);
        }
      })
      .catch(console.error);

    return () => {
      eventSource.close();
    };
  }, []);

  // Create unified timeline of messages and components  
  const timeline = useMemo(() => {
    const items: Array<
      | { type: "message"; data: Message; timestamp: number; components: A2UIComponentState[] }
    > = [];

    if (messages.length === 0) {
      return items;
    }

    // Deduplicate components first - keep only unique IDs
    const uniqueComponents = Array.from(
      new Map(components.map(c => [c.id, c])).values()
    );

    // Build component assignments - each component assigned to exactly ONE message
    const componentAssignments = new Map<string, number>(); // component.id -> message timestamp
    
    // Find the last assistant message
    let lastAssistantIndex = -1;
    let lastAssistantTime = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastAssistantIndex = i;
        lastAssistantTime = messages[i].timestamp.getTime();
        break;
      }
    }
    
    // Assign each component to exactly one message
    uniqueComponents.forEach((comp) => {
      const compTime = comp.timestamp || Date.now();
      let assignedMsgTime: number;
      
      // If there's a recent assistant message and this component was created during or after it,
      // assign to that assistant message (part of the current response)
      if (lastAssistantIndex >= 0 && compTime >= lastAssistantTime) {
        assignedMsgTime = lastAssistantTime;
      } else {
        // Find the most recent message at or before this component's creation
        let foundIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].timestamp.getTime() <= compTime) {
            foundIndex = i;
            break;
          }
        }
        
        if (foundIndex >= 0) {
          assignedMsgTime = messages[foundIndex].timestamp.getTime();
        } else {
          // Component created before any message - skip it
          return;
        }
      }
      
      // Store the assignment
      componentAssignments.set(comp.id, assignedMsgTime);
    });

    // Group components by their assigned message
    const componentsByMessage = new Map<number, A2UIComponentState[]>();
    uniqueComponents.forEach((comp) => {
      const assignedTime = componentAssignments.get(comp.id);
      if (assignedTime !== undefined) {
        if (!componentsByMessage.has(assignedTime)) {
          componentsByMessage.set(assignedTime, []);
        }
        componentsByMessage.get(assignedTime)!.push(comp);
      }
    });

    // Build timeline: message + its components
    messages.forEach((msg) => {
      const msgTime = msg.timestamp.getTime();
      const comps = componentsByMessage.get(msgTime) || [];
      
      items.push({
        type: "message",
        data: msg,
        timestamp: msgTime,
        components: comps,
      });
    });

    return items;
  }, [messages, components]);

  useEffect(() => {
    scrollToBottom();
  }, [timeline, scrollToBottom]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + parsed.delta,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: error instanceof Error ? `Error: ${error.message}` : "An error occurred",
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
        }
        return updated;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="glass-card p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to VladsBot</h2>
              <p className="text-muted-foreground text-sm">
                Start a conversation! You can use slash commands like{" "}
                <code className="text-primary">/status</code>,{" "}
                <code className="text-primary">/tts</code>, or just chat naturally.
              </p>
            </div>
          </div>
        ) : (
          timeline.map((item) => (
            <div key={item.data.id}>
              {/* Message */}
              <ChatMessage message={item.data} />
              
              {/* Components associated with this message */}
              {item.components.length > 0 && (
                <div className="space-y-4 mt-4">
                  {/* Deduplicate by component ID just in case */}
                  {Array.from(new Map(item.components.map(c => [c.id, c])).values()).map((component) => (
                    <DynamicComponent
                      key={component.id}
                      component={component}
                      onAction={(event) => {
                        // Handle component actions with toast feedback
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
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/5">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
