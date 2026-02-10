import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "./ChatMessage";
import { Message } from "@/types/chat";

describe("ChatMessage", () => {
  it("renders user message correctly", () => {
    const message: Message = {
      id: "1",
      role: "user",
      content: "Hello, VladsBot!",
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} />);
    
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Hello, VladsBot!")).toBeInTheDocument();
  });

  it("renders assistant message correctly", () => {
    const message: Message = {
      id: "2",
      role: "assistant",
      content: "Hello! How can I help you?",
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} />);
    
    expect(screen.getByText("VladsBot")).toBeInTheDocument();
    expect(screen.getByText("Hello! How can I help you?")).toBeInTheDocument();
  });

  it("shows typing indicator when streaming", () => {
    const message: Message = {
      id: "3",
      role: "assistant",
      content: "Typing...",
      timestamp: new Date(),
      isStreaming: true,
    };

    const { container } = render(<ChatMessage message={message} />);
    
    // Check for typing dots
    const typingDots = container.querySelectorAll(".typing-dot");
    expect(typingDots.length).toBe(3);
  });
});
