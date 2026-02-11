# A2UI Interactive Controls - Implementation Guide

## Overview

This document describes the full implementation of interactive A2UI controls in VladsBot-web, including:
- Agent skill for rendering components
- API endpoints for component lifecycle
- React components for all UI elements
- Event handling for user interactions
- Integration with chat interface

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AGENT (Claude)                         │
│  • Reads /skills/a2ui-web/SKILL.md                       │
│  • Decides when to render UI components                  │
│  • Sends component JSON via API                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ POST /api/a2ui/render
                 │ {component, location, props}
                 ▼
┌──────────────────────────────────────────────────────────┐
│              VladsBot-web Backend                         │
│  • /api/a2ui/render - Create/update components           │
│  • /api/a2ui/events - SSE stream for actions             │
│  • Component store (in-memory / Redis)                   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ WebSocket / SSE
                 │ Component updates & user actions
                 ▼
┌──────────────────────────────────────────────────────────┐
│             React Frontend                                │
│  • A2UIRenderer - Renders components                     │
│  • Component library (Card, Form, Chart, etc.)           │
│  • Event emitters for user actions                       │
│  • Location-based rendering (chat/sidebar/floating)      │
└──────────────────────────────────────────────────────────┘
```

## Component Lifecycle

### 1. Agent Decides to Render

Agent analyzes conversation and determines a component would help:

```typescript
// Agent's internal decision process:
// "User asked to deploy - I should show an approval card"

// Agent calls API endpoint:
POST /api/a2ui/render
{
  "location": "chat",
  "component": "Card",
  "id": "deploy-approval-xyz",
  "props": {
    "title": "Approve Deployment?",
    "actions": [
      {"label": "Deploy", "action": "confirm"},
      {"label": "Cancel", "action": "cancel"}
    ]
  }
}
```

### 2. Backend Stores & Broadcasts

```typescript
// Store component
componentStore.set("deploy-approval-xyz", {
  location: "chat",
  component: "Card",
  props: {...},
  timestamp: Date.now()
});

// Broadcast to connected clients
ws.broadcast({
  type: "component.render",
  data: {...}
});
```

### 3. Frontend Renders

```typescript
// A2UIRenderer receives update
function A2UIRenderer({ location }) {
  const [components, setComponents] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket("/api/a2ui/events");
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      if (type === "component.render") {
        setComponents(prev => [...prev, data]);
      }
    };
  }, []);
  
  return components
    .filter(c => c.location === location)
    .map(c => <DynamicComponent {...c} />);
}
```

### 4. User Interacts

```typescript
// User clicks "Deploy" button
function CardComponent({ id, props }) {
  const handleAction = (action) => {
    // Send action back to backend
    fetch("/api/a2ui/action", {
      method: "POST",
      body: JSON.stringify({
        componentId: id,
        action: action
      })
    });
  };
  
  return (
    <Card>
      {props.actions.map(a => (
        <Button onClick={() => handleAction(a.action)}>
          {a.label}
        </Button>
      ))}
    </Card>
  );
}
```

### 5. Agent Receives Action

```typescript
// Backend forwards action to agent's chat context
{
  "type": "user_action",
  "componentId": "deploy-approval-xyz",
  "action": "confirm",
  "timestamp": 1234567890
}

// Agent processes action:
// "User confirmed deployment - proceeding with deploy"
```

## File Structure

```
vladsbot-web/
├── src/
│   ├── components/
│   │   ├── a2ui/
│   │   │   ├── A2UIRenderer.tsx         # Main renderer
│   │   │   ├── DynamicComponent.tsx     # Component factory
│   │   │   ├── Card.tsx                 # Card component
│   │   │   ├── Form.tsx                 # Form component
│   │   │   ├── ButtonGroup.tsx          # Button group
│   │   │   ├── Table.tsx                # Table component
│   │   │   ├── Progress.tsx             # Progress bar
│   │   │   ├── List.tsx                 # List component
│   │   │   ├── Chart.tsx                # Chart component
│   │   │   ├── Accordion.tsx            # Accordion component
│   │   │   ├── Alert.tsx                # Alert component
│   │   │   ├── Code.tsx                 # Code block
│   │   │   └── index.ts                 # Exports
│   │   ├── Chat.tsx                     # Enhanced with A2UI
│   │   └── AgentActivityPanel.tsx       # Enhanced with A2UI
│   ├── app/api/a2ui/
│   │   ├── render/route.ts              # POST create/update, DELETE remove
│   │   ├── events/route.ts              # GET SSE stream
│   │   └── action/route.ts              # POST user actions
│   ├── types/
│   │   └── a2ui.ts                      # Enhanced types
│   └── lib/
│       └── a2ui-store.ts                # Component state management
├── skills/
│   └── a2ui-web/
│       ├── SKILL.md                     # Agent documentation
│       └── EXAMPLES.md                  # Real-world examples
└── docs/
    └── A2UI_INTERACTIVE_CONTROLS.md     # This file
```

## Implementation Phases

### Phase 1: Core Infrastructure (4 hours)
- [ ] Enhanced types
- [ ] API endpoints (/render, /events, /action)
- [ ] Component store
- [ ] A2UIRenderer component
- [ ] DynamicComponent factory

### Phase 2: Basic Components (6 hours)
- [ ] Card
- [ ] ButtonGroup
- [ ] Alert
- [ ] Progress
- [ ] List

### Phase 3: Advanced Components (8 hours)
- [ ] Form (with validation)
- [ ] Table (with sorting/search)
- [ ] Chart (Chart.js integration)
- [ ] Accordion
- [ ] Code

### Phase 4: Integration (4 hours)
- [ ] Chat integration
- [ ] Sidebar integration
- [ ] Floating panels
- [ ] Event handling

### Phase 5: Agent Skill (2 hours)
- [ ] SKILL.md documentation
- [ ] Examples library
- [ ] Helper functions
- [ ] Testing with real agent

## Example Usage Flow

### Scenario: User asks "Deploy to production"

**Step 1:** Agent reads skill, decides to use Card component

```
Agent thinking: "User wants to deploy. This is important, so I should
show an approval card with details before proceeding."
```

**Step 2:** Agent renders approval card in chat

```typescript
await fetch("/api/a2ui/render", {
  method: "POST",
  body: JSON.stringify({
    location: "chat",
    component: "Card",
    id: "prod-deploy-123",
    props: {
      title: "🚀 Production Deployment",
      content: "Branch: main (be87dd6)\nChanges: +728 -39 lines",
      variant: "warning",
      actions: [
        {label: "✅ Deploy", action: "confirm"},
        {label: "❌ Cancel", action: "cancel"}
      ]
    }
  })
});
```

**Step 3:** User sees card in chat, clicks "Deploy"

```
[Card renders in chat]
┌─────────────────────────────────────┐
│ 🚀 Production Deployment            │
│ Branch: main (be87dd6)              │
│ Changes: +728 -39 lines             │
│                                     │
│ [✅ Deploy]  [❌ Cancel]             │
└─────────────────────────────────────┘

[User clicks "Deploy"]
```

**Step 4:** Action sent to agent

```json
{
  "type": "user_action",
  "componentId": "prod-deploy-123",
  "action": "confirm"
}
```

**Step 5:** Agent processes action

```
Agent: "User confirmed. Starting deployment..."

[Agent calls deployment tool]
[Agent updates card to show progress]
```

**Step 6:** Agent updates card with progress

```typescript
await fetch("/api/a2ui/render", {
  method: "POST",
  body: JSON.stringify({
    id: "prod-deploy-123",
    component: "Progress",
    props: {
      title: "Deploying...",
      current: 3,
      total: 5,
      percentage: 60,
      status: "Building Docker image..."
    }
  })
});
```

**Step 7:** Deployment completes, agent updates card

```typescript
await fetch("/api/a2ui/render", {
  method: "POST",
  body: JSON.stringify({
    id: "prod-deploy-123",
    component: "Alert",
    props: {
      title: "✅ Deployment Successful",
      message: "Production is now live!",
      variant: "success",
      actions: [
        {label: "View Site", action: "open_site"}
      ]
    }
  })
});
```

## Benefits

### For Users
- **Visual clarity** - Complex info is structured and scannable
- **Faster decisions** - Buttons instead of typing responses
- **Better context** - Forms with validation, dropdowns with options
- **Real-time updates** - Progress bars show live status

### For Agent
- **Better UX** - Guide users through complex workflows
- **Collect structured data** - Forms return typed data
- **Reduce ambiguity** - Multiple choice instead of free text
- **Show relationships** - Tables, trees, charts

### For Developers
- **Reusable components** - Build once, use everywhere
- **Type-safe** - TypeScript interfaces for all components
- **Extensible** - Easy to add new component types
- **Well-documented** - Clear examples and patterns

## Security Considerations

1. **Component validation** - Validate all component props server-side
2. **Action authorization** - Verify user can perform requested action
3. **Rate limiting** - Prevent spam rendering
4. **Sanitization** - Sanitize all user inputs in forms
5. **CSRF protection** - Use tokens for state-changing actions

## Performance Optimizations

1. **Component caching** - Cache rendered components
2. **Lazy loading** - Load Chart.js only when needed
3. **Virtual scrolling** - For large tables/lists
4. **Debouncing** - Batch rapid updates
5. **Memory limits** - Max 100 components per session

## Testing Strategy

1. **Unit tests** - Each component isolated
2. **Integration tests** - API endpoints + store
3. **E2E tests** - Full user flows
4. **Agent tests** - Verify skill integration
5. **Performance tests** - Load testing

## Migration Path

### V1 → V2 (Current → Full Implementation)

**Phase 1:** Add infrastructure (no breaking changes)
- API endpoints
- Component library
- A2UIRenderer

**Phase 2:** Enhance existing features
- Upgrade activity cards to use new Card component
- Add interactive buttons to activities

**Phase 3:** New features
- Forms for configuration
- Charts for analytics
- Approval workflows

**Phase 4:** Agent integration
- Deploy skill
- Test with real conversations
- Iterate based on usage

## Next Steps

1. Review this design with Taylor
2. Get approval on scope
3. Start Phase 1 implementation
4. Build iteratively
5. Test with real agent conversations
6. Ship to dev → prod

---

**Ready to build?** This will be the most advanced agent interface in existence. 🚀
