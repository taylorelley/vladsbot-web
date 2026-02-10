import { NextResponse } from "next/server";
import { SessionStatus, SubAgentStatus, StatusResponse } from "@/types/status";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:3842";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

interface OpenClawStatusResponse {
  status: string;
  output?: string;
  sessions?: Array<{
    sessionKey: string;
    label?: string;
    agentId?: string;
    kind: string;
    lastMessage?: {
      timestamp: string;
    };
  }>;
}

function parseSessionStatus(output: string): Partial<SessionStatus> {
  const lines = output.split("\n");
  const data: Partial<SessionStatus> = {};

  for (const line of lines) {
    // Model line: "🧠 Model: anthropic/claude-sonnet-4-5"
    if (line.includes("Model:")) {
      const match = line.match(/Model:\s*(.+?)(?:\s*·|$)/);
      if (match) data.model = match[1].trim();
    }

    // Context line: "📚 Context: 22k/200k (11%)"
    if (line.includes("Context:")) {
      const match = line.match(/Context:\s*(\d+)k\/(\d+)k\s*\((\d+)%\)/);
      if (match) {
        data.contextUsed = parseInt(match[1]) * 1000;
        data.contextTotal = parseInt(match[2]) * 1000;
        data.contextPercent = parseInt(match[3]);
      }
    }

    // Tokens line: "🧮 Tokens: 10 in / 611 out"
    if (line.includes("Tokens:")) {
      const match = line.match(/Tokens:\s*(\d+)\s*in\s*\/\s*(\d+)\s*out/);
      if (match) {
        data.tokensIn = parseInt(match[1]);
        data.tokensOut = parseInt(match[2]);
      }
    }

    // Session line (for uptime): "🧵 Session: ... • updated 1m ago"
    if (line.includes("Session:") && line.includes("updated")) {
      const match = line.match(/updated\s+(.+?)\s+ago/);
      if (match) data.uptime = match[1];
    }

    // Thinking line: "⚙️ Runtime: direct · Think: off"
    if (line.includes("Think:")) {
      const match = line.match(/Think:\s*(\w+)/);
      if (match) data.thinking = match[1];
    }

    // Compactions: "🧹 Compactions: 0"
    if (line.includes("Compactions:")) {
      const match = line.match(/Compactions:\s*(\d+)/);
      if (match) data.compactions = parseInt(match[1]);
    }
  }

  return data;
}

async function callOpenClawTool(
  tool: string,
  params: Record<string, unknown> = {}
): Promise<OpenClawStatusResponse> {
  const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      tool,
      args: params,
      sessionKey: "main",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenClaw API error: ${response.statusText} - ${error}`);
  }

  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error?.message || "Tool invocation failed");
  }
  
  return {
    status: "success",
    output: typeof result.result === "string" ? result.result : JSON.stringify(result.result),
    sessions: result.result?.sessions,
  };
}

export async function GET() {
  try {
    // Fetch main session status
    const statusResponse = await callOpenClawTool("session_status");
    const sessionsResponse = await callOpenClawTool("sessions_list", {
      kinds: ["isolated"],
      limit: 20,
      messageLimit: 1,
    });

    // Parse main session status
    const statusOutput = statusResponse.output || "";
    const parsedStatus = parseSessionStatus(statusOutput);

    const mainSession: SessionStatus = {
      model: parsedStatus.model || "unknown",
      thinking: parsedStatus.thinking || "off",
      contextUsed: parsedStatus.contextUsed || 0,
      contextTotal: parsedStatus.contextTotal || 200000,
      contextPercent: parsedStatus.contextPercent || 0,
      tokensIn: parsedStatus.tokensIn || 0,
      tokensOut: parsedStatus.tokensOut || 0,
      uptime: parsedStatus.uptime || "0s",
      sessionKey: "main",
      compactions: parsedStatus.compactions || 0,
    };

    // Parse sub-agents
    const subAgents: SubAgentStatus[] = [];
    if (sessionsResponse.sessions) {
      for (const session of sessionsResponse.sessions) {
        if (session.kind === "isolated") {
          // Calculate context from session (simplified - would need actual session status call)
          const now = new Date();
          const lastActivity = session.lastMessage?.timestamp
            ? new Date(session.lastMessage.timestamp)
            : now;
          const uptimeMs = now.getTime() - lastActivity.getTime();
          const uptimeMinutes = Math.floor(uptimeMs / 60000);

          subAgents.push({
            sessionKey: session.sessionKey,
            label: session.label,
            agentId: session.agentId,
            kind: session.kind,
            contextUsed: 0, // Would need individual session_status call
            contextTotal: 200000,
            contextPercent: 0,
            uptime: `${uptimeMinutes}m`,
            lastActivity: session.lastMessage?.timestamp || now.toISOString(),
            status: uptimeMinutes < 5 ? "active" : "idle",
            task: session.label,
          });
        }
      }
    }

    const statusData: StatusResponse = {
      mainSession,
      subAgents,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(statusData);
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch status" },
      { status: 500 }
    );
  }
}
