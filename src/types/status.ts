export interface SessionStatus {
  model: string;
  thinking: string;
  contextUsed: number;
  contextTotal: number;
  contextPercent: number;
  tokensIn: number;
  tokensOut: number;
  uptime: string;
  sessionKey: string;
  compactions: number;
}

export interface SubAgentStatus {
  sessionKey: string;
  label?: string;
  agentId?: string;
  kind: string;
  contextUsed: number;
  contextTotal: number;
  contextPercent: number;
  uptime: string;
  lastActivity: string;
  status: "active" | "idle" | "completed";
  task?: string;
}

export interface StatusResponse {
  mainSession: SessionStatus;
  subAgents: SubAgentStatus[];
  timestamp: string;
}
