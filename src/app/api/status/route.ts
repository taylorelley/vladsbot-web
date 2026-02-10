import { NextResponse } from "next/server";
import { SessionStatus, SubAgentStatus, StatusResponse } from "@/types/status";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:3842";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

interface OpenClawStatusResponse {
  status: string;
  output?: string;
  sessions?: Array<{
    key: string;
    sessionKey?: string;
    label?: string;
    agentId?: string;
    kind: string;
    updatedAt?: number;
    totalTokens?: number;
    contextTokens?: number;
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
  
  // Extract output text
  let outputText = "";
  let sessionsData = undefined;
  
  if (result.result?.content?.[0]?.text) {
    outputText = result.result.content[0].text;
    
    // For sessions_list, parse the JSON response
    if (tool === "sessions_list") {
      try {
        const parsed = JSON.parse(outputText);
        sessionsData = parsed.sessions;
      } catch (e) {
        console.error("Failed to parse sessions_list response:", e);
      }
    }
  } else if (typeof result.result === "string") {
    outputText = result.result;
  } else {
    outputText = JSON.stringify(result.result);
  }
  
  return {
    status: "success",
    output: outputText,
    sessions: sessionsData,
  };
}

export async function GET() {
  try {
    // Fetch main session status
    const statusResponse = await callOpenClawTool("session_status");
    // Note: Sub-agents are classified as kind:"other", not "isolated"
    // We'll filter client-side by session key pattern instead
    const sessionsResponse = await callOpenClawTool("sessions_list", {
      limit: 50,
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
        // Filter for sub-agent sessions by key pattern (kind is "other", not "isolated")
        const sessionKey = session.key || session.sessionKey;
        if (sessionKey && sessionKey.includes(":subagent:")) {
          // Calculate uptime from updatedAt
          const now = new Date();
          const updatedAt = session.updatedAt ? new Date(session.updatedAt) : now;
          const uptimeMs = now.getTime() - updatedAt.getTime();
          const uptimeSeconds = Math.floor(uptimeMs / 1000);
          const uptimeMinutes = Math.floor(uptimeSeconds / 60);
          
          // Format uptime
          let uptimeStr = uptimeMinutes > 0 ? `${uptimeMinutes}m` : `${uptimeSeconds}s`;

          subAgents.push({
            sessionKey: sessionKey,
            label: session.label || "Unnamed Sub-Agent",
            agentId: session.agentId,
            kind: session.kind,
            contextUsed: session.totalTokens || 0,
            contextTotal: session.contextTokens || 200000,
            contextPercent: session.contextTokens ? Math.round(((session.totalTokens || 0) / session.contextTokens) * 100) : 0,
            uptime: uptimeStr,
            lastActivity: session.updatedAt ? new Date(session.updatedAt).toISOString() : now.toISOString(),
            status: uptimeSeconds < 300 ? "active" : "idle", // Active if updated in last 5 min
            task: session.label || "Running",
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
