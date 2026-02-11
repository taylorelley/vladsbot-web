# A2UI Agent Activity Panel

Real-time visualization of agent activities in the vladsbot-web interface.

## Features

✅ **Floating activity panel** - Bottom-right corner, toggleable  
✅ **Multiple activity types** - Tool calls, thinking, progress, status  
✅ **Visual indicators** - Animated spinners, checkmarks, and progress bars  
✅ **Auto-dismissal** - Completed tasks fade after 10 seconds  
✅ **Polling updates** - Refreshes every 2 seconds  

## Testing the UI

### Demo API

```bash
# Add demo activities
curl -X POST http://localhost:3000/api/a2ui/demo

# Clear all activities
curl -X DELETE http://localhost:3000/api/a2ui/demo
```

### Manual Activity Creation

```bash
curl -X POST http://localhost:3000/api/a2ui/activities \
  -H "Content-Type: application/json" \
  -d '{
    "activity": {
      "id": "test-1",
      "type": "tool_call",
      "status": "active",
      "title": "Deploying to Coolify",
      "description": "Building Docker image...",
      "progress": 45
    }
  }'
```

## Integration with Agent

### Option 1: From Chat API

Modify `/api/chat/route.ts` to push activities before/after tool calls:

```typescript
// Before tool call
await fetch('/api/a2ui/activities', {
  method: 'POST',
  body: JSON.stringify({
    activity: {
      id: `tool-${Date.now()}`,
      type: 'tool_call',
      status: 'active',
      title: `Executing: ${toolName}`,
      description: JSON.stringify(args).slice(0, 100),
    }
  })
});

// After tool call
await fetch('/api/a2ui/activities', {
  method: 'POST',
  body: JSON.stringify({
    activity: {
      id: `tool-${Date.now()}`,
      type: 'tool_call',
      status: result.success ? 'completed' : 'failed',
      title: `${toolName} ${result.success ? '✓' : '✗'}`,
    }
  })
});
```

### Option 2: Server-Sent Events (SSE)

Stream updates from the agent during generation:

```typescript
// In /api/chat/route.ts
const stream = new TransformStream();
const writer = stream.writable.getWriter();

// Send activity updates alongside chat deltas
writer.write({
  type: 'activity',
  data: {
    id: 'thinking-1',
    type: 'thinking',
    status: 'active',
    title: 'Analyzing request...',
  }
});
```

### Option 3: Direct from Agent

If the agent has access to the Next.js API, it can push directly:

```typescript
// In agent context
async function notifyActivity(activity: Partial<A2UIActivity>) {
  await fetch(`${process.env.NEXTAUTH_URL}/api/a2ui/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activity }),
  });
}

// Usage
await notifyActivity({
  type: 'progress',
  status: 'active',
  title: 'Building application',
  progress: 67,
});
```

## Activity Types

### `tool_call`
```json
{
  "id": "unique-id",
  "type": "tool_call",
  "status": "active",
  "title": "Searching web",
  "description": "Query: Next.js best practices"
}
```

### `thinking`
```json
{
  "id": "unique-id",
  "type": "thinking",
  "status": "active",
  "title": "Planning approach",
  "description": "Breaking down task into steps..."
}
```

### `progress`
```json
{
  "id": "unique-id",
  "type": "progress",
  "status": "active",
  "title": "Deploying application",
  "description": "Step 8/15: Building Docker image",
  "progress": 53
}
```

### `status`
```json
{
  "id": "unique-id",
  "type": "status",
  "status": "completed",
  "title": "Deployment successful",
  "description": "https://vladsbot-web-dev.app.taylorelley.com"
}
```

## Status Values

- **`active`** - In progress (animated spinner)
- **`completed`** - Finished successfully (green checkmark)
- **`failed`** - Error occurred (red X)

## Next Steps

### Short-term
1. **Integrate with actual tool calls** - Modify chat API to push updates
2. **Add timestamp display** - Show when activities started
3. **Activity history** - Keep a log of recent activities

### Mid-term
4. **Upgrade to WebSocket** - Replace polling for instant updates
5. **Activity filtering** - Show/hide by type or status
6. **Persist to Redis** - Support multi-instance deployments

### Long-term
7. **Full A2UI v0.8 support** - Implement surfaceUpdate/beginRendering
8. **Custom components** - Rich interactive elements
9. **Activity details modal** - Click to expand with full logs
10. **Export/share** - Download activity timeline as JSON

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser (Next.js)                  │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │   AgentActivityPanel                      │ │
│  │   - Polls /api/a2ui/activities            │ │
│  │   - Updates every 2s                      │ │
│  │   - Renders activity cards                │ │
│  └───────────────────────────────────────────┘ │
│                      ▲                          │
│                      │ GET                      │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │   /api/a2ui/activities                    │ │
│  │   - In-memory activity store              │ │
│  │   - GET: returns current activities       │ │
│  │   - POST: add/update activity             │ │
│  └───────────────────────────────────────────┘ │
│                      ▲                          │
└──────────────────────┼──────────────────────────┘
                       │ POST
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼─────┐              ┌───────▼────────┐
    │ Chat API │              │ Agent (future) │
    │          │              │                │
    │ Pushes   │              │ Direct updates │
    │ updates  │              │ via HTTP       │
    └──────────┘              └────────────────┘
```

## Future: WebSocket Architecture

```
Browser ←──WebSocket──→ Next.js ←──WebSocket──→ Gateway Canvas Host
   │                        │                         │
   │                        │                         │
   ▼                        ▼                         ▼
Activity Panel      /api/a2ui/stream          A2UI v0.8 JSONL
```
