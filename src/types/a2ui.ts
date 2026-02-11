// A2UI v0.8 message types
export interface A2UIActivity {
  id: string;
  type: 'tool_call' | 'thinking' | 'progress' | 'status';
  status: 'active' | 'completed' | 'failed';
  title: string;
  description?: string;
  progress?: number; // 0-100
  timestamp: number;
}

export interface A2UIMessage {
  surfaceUpdate?: {
    surfaceId: string;
    components: Array<{
      id: string;
      component: any;
    }>;
  };
  beginRendering?: {
    surfaceId: string;
    root: string;
  };
  dataModelUpdate?: any;
  deleteSurface?: {
    surfaceId: string;
  };
}

export interface AgentActivityUpdate {
  activities: A2UIActivity[];
}
