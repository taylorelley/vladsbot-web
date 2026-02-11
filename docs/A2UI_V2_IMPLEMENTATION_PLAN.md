# A2UI V2: Implementation Plan

## 🎯 Priority Stack (What to Build First)

### Tier 1: Foundation (High Impact, Low Complexity)
**Goal:** Make the current panel 10x more useful

1. **Tabbed Sidebar** (4 hours)
   - Overview, Activity, Analytics tabs
   - Smooth tab switching
   - State persistence

2. **Enhanced Activity Cards** (6 hours)
   - Expand/collapse details
   - Tool input/output display
   - Copy button, retry button
   - Elapsed time tracking

3. **Activity Filtering** (3 hours)
   - Filter by status/type
   - Search by keyword
   - Time range selector

4. **Sub-Agent Tree View** (5 hours)
   - Hierarchical display
   - Collapsible branches
   - Live status updates

**Total: ~18 hours** | **Impact: 🔥🔥🔥**

### Tier 2: Intelligence (High Impact, Medium Complexity)
**Goal:** Add insights and metrics

5. **Analytics Tab** (8 hours)
   - Token usage chart (Chart.js)
   - Tool distribution pie chart
   - Response time graph
   - Cost tracker

6. **Session Health Score** (4 hours)
   - Calculate based on metrics
   - Visual indicator (color + number)
   - Breakdown of score factors

7. **Smart Insights** (6 hours)
   - Pattern detection
   - Recommendations
   - Warning system

**Total: ~18 hours** | **Impact: 🔥🔥**

### Tier 3: Interactivity (Medium Impact, High Complexity)
**Goal:** Enable user control

8. **Interactive Buttons** (8 hours)
   - Cancel long-running tools
   - Retry failed operations
   - Approve/reject workflows

9. **Quick Actions Panel** (6 hours)
   - Favorite tools
   - Message templates
   - One-click macros

10. **Activity Bookmarking** (4 hours)
    - Star important items
    - Bookmark history
    - Export bookmarks

**Total: ~18 hours** | **Impact: 🔥**

## 📅 Recommended Build Order

### **Sprint 1: The Essentials** (1-2 days)
**Make the panel indispensable**

✅ **Day 1 Morning:** Tabbed navigation  
✅ **Day 1 Afternoon:** Enhanced activity cards  
✅ **Day 2 Morning:** Activity filtering  
✅ **Day 2 Afternoon:** Sub-agent tree

**Deliverable:** A panel that's so useful users never want to close it.

### **Sprint 2: The Intelligence** (1-2 days)
**Make the panel insightful**

✅ **Day 3 Morning:** Analytics tab setup  
✅ **Day 3 Afternoon:** Charts implementation  
✅ **Day 4 Morning:** Health score  
✅ **Day 4 Afternoon:** Smart insights

**Deliverable:** Users can optimize their agent usage based on data.

### **Sprint 3: The Control** (1-2 days)
**Make the panel interactive**

✅ **Day 5 Morning:** Interactive buttons  
✅ **Day 5 Afternoon:** Quick actions  
✅ **Day 6:** Polish, testing, documentation

**Deliverable:** Full mission control experience.

## 🏗️ Architecture Changes

### New Components

```
src/components/
├── AgentActivityPanel.tsx (existing - refactor)
├── a2ui/
│   ├── Tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── ActivityTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   └── MemoryTab.tsx
│   ├── Activity/
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── SubAgentTree.tsx
│   │   └── ActivityFilter.tsx
│   ├── Charts/
│   │   ├── TokenUsageChart.tsx
│   │   ├── ToolDistributionChart.tsx
│   │   └── ResponseTimeChart.tsx
│   ├── Insights/
│   │   ├── HealthScore.tsx
│   │   ├── SmartInsights.tsx
│   │   └── CostTracker.tsx
│   └── Interactive/
│       ├── ActionButtons.tsx
│       ├── QuickActions.tsx
│       └── ApprovalWorkflow.tsx
```

### New API Routes

```
src/app/api/a2ui/
├── activities/route.ts (existing - enhance)
├── analytics/route.ts (new)
│   ├── GET /api/a2ui/analytics/tokens
│   ├── GET /api/a2ui/analytics/tools
│   └── GET /api/a2ui/analytics/performance
├── insights/route.ts (new)
│   └── GET /api/a2ui/insights
├── control/route.ts (new)
│   ├── POST /api/a2ui/control/cancel
│   ├── POST /api/a2ui/control/retry
│   └── POST /api/a2ui/control/approve
└── bookmarks/route.ts (new)
    ├── GET /api/a2ui/bookmarks
    └── POST /api/a2ui/bookmarks
```

### State Management

```typescript
// Enhanced activity state
interface Activity {
  id: string;
  type: 'tool_call' | 'thinking' | 'progress' | 'status';
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description?: string;
  progress?: number;
  timestamp: number;
  
  // New fields
  parentId?: string; // For sub-agents
  children?: Activity[]; // Sub-activities
  input?: any; // Tool input
  output?: any; // Tool output
  duration?: number; // Elapsed time (ms)
  cost?: number; // Estimated cost
  retryable?: boolean;
  cancellable?: boolean;
  bookmarked?: boolean;
  tags?: string[];
}

// Analytics state
interface Analytics {
  tokenUsage: {
    timestamp: number;
    tokens: number;
  }[];
  toolStats: {
    [toolName: string]: {
      count: number;
      successRate: number;
      avgDuration: number;
    };
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
  };
  cost: {
    session: number;
    today: number;
    month: number;
  };
}

// Health score
interface HealthScore {
  score: number; // 0-100
  factors: {
    contextUsage: number; // Weight: 30
    errorRate: number; // Weight: 30
    responseTime: number; // Weight: 20
    costEfficiency: number; // Weight: 20
  };
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}
```

## 🎨 UI/UX Specs

### Tab Bar Design
```
┌─────────────────────────────────────┐
│ [📊 Overview] [⚡ Activity] [📈 Analytics] [⚙️] │
│ ════════════                         │ ← Active underline
```

### Enhanced Activity Card
```
┌─────────────────────────────────────┐
│ 🔄 web_search           ⏱️ 1.2s     │
│ Status: ✅ Completed                │
│                                     │
│ [▼ Details]        [📋] [🔁] [⭐]   │
├─────────────────────────────────────┤ ← Expandable
│ INPUT:                              │
│ { query: "Next.js", count: 5 }     │
│                                     │
│ OUTPUT:                             │
│ 5 results found ▶                   │
└─────────────────────────────────────┘
```

### Health Score Widget
```
┌─────────────────────────────────────┐
│        SESSION HEALTH               │
│                                     │
│           🟢 87                     │
│          ████████▒▒                │
│                                     │
│  Context:    ✅ 45%                 │
│  Errors:     ✅ 0%                  │
│  Speed:      ⚠️  Avg                │
│  Cost:       ✅ $0.15               │
└─────────────────────────────────────┘
```

### Chart Styling
- **Library:** Chart.js or Recharts
- **Theme:** Dark mode optimized
- **Colors:** GridSharks palette
- **Interaction:** Tooltips on hover
- **Responsive:** Scale to panel width

## 🔌 Integration Points

### Chat API Integration
```typescript
// Enhance existing pushActivity helper
async function pushActivity(activity: EnhancedActivity) {
  // Track tokens used
  if (activity.type === 'tool_call') {
    await updateAnalytics({
      tool: activity.toolName,
      duration: activity.duration,
      tokens: activity.tokensUsed,
    });
  }
  
  // Calculate health score
  const health = calculateHealthScore();
  
  // Generate insights
  const insights = await generateInsights(activity);
  
  // Push to panel
  await fetch('/api/a2ui/activities', {
    method: 'POST',
    body: JSON.stringify({ activity, health, insights }),
  });
}
```

### Real-Time Updates
```typescript
// Upgrade from polling to WebSocket
const ws = new WebSocket(`wss://${host}/api/a2ui/stream`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'activity':
      updateActivities(update.data);
      break;
    case 'analytics':
      updateCharts(update.data);
      break;
    case 'health':
      updateHealthScore(update.data);
      break;
    case 'insight':
      showInsight(update.data);
      break;
  }
};
```

## 🧪 Testing Strategy

### Unit Tests
- Individual components
- Chart rendering
- Health score calculation
- Insight generation

### Integration Tests
- Tab switching
- Activity filtering
- WebSocket connection
- API endpoints

### E2E Tests
- Full user flow
- Multi-tab workflow
- Sub-agent tracking
- Export functionality

### Performance Tests
- 100 concurrent activities
- Chart render time
- WebSocket throughput
- Memory usage

## 📦 Dependencies

### New Packages
```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "date-fns": "^3.0.0",
  "lodash": "^4.17.21",
  "react-hot-toast": "^2.4.1"
}
```

### Optional
- `framer-motion` - Advanced animations
- `react-window` - Virtual scrolling for 1000+ activities
- `zustand` - Better state management

## 🚀 Launch Checklist

### Before Development
- [x] Concept approved by Taylor
- [ ] Design mockups reviewed
- [ ] Architecture approved
- [ ] Dependencies installed

### During Development
- [ ] Feature flags enabled
- [ ] Progress tracking in Notion
- [ ] Daily commits to feature branch
- [ ] Unit tests for each component

### Before Release
- [ ] Full testing suite passing
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Accessibility audit
- [ ] User acceptance testing

### Release
- [ ] Merge to dev
- [ ] Deploy to dev environment
- [ ] Smoke test
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor for issues

## 💬 Open Questions

1. **WebSocket vs Polling?**
   - Polling is simpler, works now
   - WebSocket is faster, more complex
   - Recommendation: Start with polling, upgrade to WebSocket in Phase 2

2. **State Management?**
   - React Context (current)
   - Zustand (lightweight)
   - Redux (overkill?)
   - Recommendation: Zustand for analytics, Context for UI

3. **Chart Library?**
   - Chart.js (flexible, well-documented)
   - Recharts (React-native, simpler)
   - Victory (beautiful, heavier)
   - Recommendation: Chart.js for features, Recharts for simplicity

4. **Mobile Strategy?**
   - Responsive (tabs → accordion)
   - Separate mobile UI
   - PWA enhancements
   - Recommendation: Responsive first, then optimize

---

**Ready to start?** Pick a sprint and let's build! 🚀
