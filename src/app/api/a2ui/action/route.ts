// A2UI V3 - Action API Endpoint
// Handles user actions from interactive components

import { NextRequest, NextResponse } from 'next/server';
import { a2uiStore } from '@/lib/a2ui/store';
import { A2UIActionEvent, A2UIActionResponse, A2UIAPIResponse } from '@/types/a2ui';

// Validate action request
function validateActionRequest(data: unknown): { valid: boolean; error?: string; action?: A2UIActionEvent } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = data as Record<string, unknown>;

  // Component ID is required
  if (!req.componentId || typeof req.componentId !== 'string') {
    return { valid: false, error: 'componentId is required and must be a string' };
  }

  // Type is required
  const validTypes = ['action', 'submit', 'dismiss', 'change'];
  const type = typeof req.type === 'string' && validTypes.includes(req.type) 
    ? req.type as A2UIActionEvent['type']
    : 'action';

  return {
    valid: true,
    action: {
      type,
      componentId: req.componentId,
      action: typeof req.action === 'string' ? req.action : undefined,
      data: typeof req.data === 'object' ? req.data as Record<string, unknown> : undefined,
      timestamp: Date.now(),
    }
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<A2UIActionResponse>> {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateActionRequest(body);
    if (!validation.valid || !validation.action) {
      return NextResponse.json({
        success: false,
        acknowledged: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid request',
        }
      }, { status: 400 });
    }

    // Check if component exists (optional - actions may reference removed components)
    const component = a2uiStore.get(validation.action.componentId);
    
    // Queue the action
    a2uiStore.queueAction(validation.action);

    return NextResponse.json({
      success: true,
      acknowledged: true,
      data: validation.action,
    });

  } catch (error) {
    console.error('A2UI action error:', error);
    return NextResponse.json({
      success: false,
      acknowledged: false,
      error: {
        code: 'ACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

// Get pending actions (for agent polling)
export async function GET(request: NextRequest): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '10', 10);
    const consume = searchParams.get('consume') === 'true';

    if (consume) {
      // Dequeue and return actions
      const actions: A2UIActionEvent[] = [];
      for (let i = 0; i < count; i++) {
        const action = a2uiStore.dequeueAction();
        if (!action) break;
        actions.push(action);
      }
      return NextResponse.json({
        success: true,
        data: { 
          actions, 
          count: actions.length,
          remaining: a2uiStore.getActionCount()
        },
      });
    }

    // Peek at actions without consuming
    const actions = a2uiStore.peekActions(count);
    return NextResponse.json({
      success: true,
      data: { 
        actions, 
        count: actions.length,
        total: a2uiStore.getActionCount()
      },
    });

  } catch (error) {
    console.error('A2UI get actions error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'GET_ACTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}
