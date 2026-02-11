import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Helper to push activity updates
async function pushActivity(activity: {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  progress?: number;
}) {
  try {
    await fetch(`${BASE_URL}/api/a2ui/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity }),
    });
  } catch (err) {
    console.error("Failed to push activity:", err);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Build input for OpenResponses API
    const input = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        type: "message",
        role: msg.role,
        content: msg.content,
      })),
      {
        type: "message",
        role: "user",
        content: message,
      },
    ];

    const response = await fetch(`${GATEWAY_URL}/v1/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
      },
      body: JSON.stringify({
        model: "openclaw:main",
        input,
        stream: true,
        user: session.user.id || session.user.email || "web-user",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: `Gateway error: ${error}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward SSE stream with activity tracking
    const encoder = new TextEncoder();
    const requestId = `chat-${Date.now()}`;
    let activeToolCalls = new Map<string, string>();

    // Push initial "thinking" activity
    await pushActivity({
      id: requestId,
      type: "thinking",
      status: "active",
      title: "Processing your message...",
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // Mark thinking as complete
                  await pushActivity({
                    id: requestId,
                    type: "thinking",
                    status: "completed",
                    title: "Response complete",
                  });
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);

                  // Track tool calls
                  if (parsed.type === "response.function_call_arguments.delta") {
                    const toolId = parsed.call_id || "tool-1";
                    const toolName = parsed.name || "tool";
                    
                    if (!activeToolCalls.has(toolId)) {
                      activeToolCalls.set(toolId, toolName);
                      await pushActivity({
                        id: `tool-${toolId}`,
                        type: "tool_call",
                        status: "active",
                        title: `Executing: ${toolName}`,
                        description: "Processing...",
                      });
                    }
                  } else if (parsed.type === "response.function_call_arguments.done") {
                    const toolId = parsed.call_id || "tool-1";
                    const toolName = activeToolCalls.get(toolId) || "tool";
                    
                    await pushActivity({
                      id: `tool-${toolId}`,
                      type: "tool_call",
                      status: "completed",
                      title: `${toolName} ✓`,
                    });
                    activeToolCalls.delete(toolId);
                  }

                  // Extract text delta from OpenResponses format
                  if (parsed.type === "response.output_text.delta" && parsed.delta) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ delta: parsed.delta })}\n\n`)
                    );
                  } else if (parsed.type === "response.completed") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          await pushActivity({
            id: requestId,
            type: "status",
            status: "failed",
            title: "Error processing message",
            description: String(error),
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
