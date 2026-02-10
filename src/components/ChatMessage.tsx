"use client";

import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl border transition-all",
        isUser ? "message-user ml-8" : "message-assistant mr-8"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser ? "bg-primary/30" : "bg-slate-700/50"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {isUser ? "You" : "VladsBot"}
        </div>
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-flex gap-1 ml-1">
              <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
