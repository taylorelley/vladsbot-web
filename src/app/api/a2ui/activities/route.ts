// A2UI V3 - Activities API Endpoint
// Manages agent activities for sidebar display

import { NextRequest, NextResponse } from 'next/server';
import { a2uiStore } from '@/lib/a2ui/store';
import { A2UIActivity, A2UIAPIResponse } from '@/types/a2ui';

// Validate activity request
function validateActivity(data: unknown): { valid: boolean; error?: string; activity?: A2UIActivity } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = data as Record<string, unknown>;

  // ID is required
  if (!req.id || typeof req.id !== 'string') {
    return { valid: false, error: 'id is required and must be a string' };
  }

  // Type validation
  const validTypes = ['tool_call', 'thinking', 'progress', 'status', 'component'];
  if (!req.type || !validTypes.includes(req.type as string)) {
    return { valid: false, error: `type must be one of: ${validTypes.join(', ')}` };
  }

  // Status validation
  const validStatuses = ['active', 'completed', 'failed', 'pending'];
  if (!req.status || !validStatuses.includes(req.status as string)) {
    return { valid: false, error: `status must be one of: ${validStatuses.join(', ')}` };
  }

  // Title is required
  if (!req.title || typeof req.title !== 'string') {
    return { valid: false, error: 'title is required and must be a string' };
  }

  return {
    valid: true,
    activity: {
      id: req.id,
      type: req.type as A2UIActivity['type'],
      status: req.status as A2UIActivity['status'],
      title: req.title,
      description: typeof req.description === 'string' ? req.description : undefined,
      progress: typeof req.progress === 'number' ? req.progress : undefined,
      timestamp: typeof req.timestamp === 'number' ? req.timestamp : Date.now(),
      parentId: typeof req.parentId === 'string' ? req.parentId : undefined,
    }
  };
}

// GET - Fetch activities
export async function GET(): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const activities = a2uiStore.getActivities();
    const subAgents = a2uiStore.getSubAgentTree();
    const stats = a2uiStore.getStats();

    return NextResponse.json({
      success: true,
      data: {
        activities,
        subAgents,
        stats,
      },
    });

  } catch (error) {
    console.error('A2UI get activities error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'GET_ACTIVITIES_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

// POST - Add or update activity
export async function POST(request: NextRequest): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const body = await request.json();
    
    // Handle batch activities
    if (Array.isArray(body.activities)) {
      const results: { success: boolean; id: string; error?: string }[] = [];
      
      for (const activityData of body.activities) {
        const validation = validateActivity(activityData);
        if (validation.valid && validation.activity) {
          a2uiStore.addActivity(validation.activity);
          results.push({ success: true, id: validation.activity.id });
        } else {
          results.push({ 
            success: false, 
            id: activityData?.id || 'unknown',
            error: validation.error 
          });
        }
      }

      return NextResponse.json({
        success: results.every(r => r.success),
        data: { results, count: results.filter(r => r.success).length },
      });
    }

    // Single activity
    const validation = validateActivity(body);
    if (!validation.valid || !validation.activity) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid activity',
        }
      }, { status: 400 });
    }

    a2uiStore.addActivity(validation.activity);

    return NextResponse.json({
      success: true,
      data: validation.activity,
    });

  } catch (error) {
    console.error('A2UI add activity error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'ADD_ACTIVITY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

// PATCH - Update existing activity
export async function PATCH(request: NextRequest): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const body = await request.json();
    
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Activity id is required',
        }
      }, { status: 400 });
    }

    const updates: Partial<A2UIActivity> = {};
    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.title === 'string') updates.title = body.title;
    if (typeof body.description === 'string') updates.description = body.description;
    if (typeof body.progress === 'number') updates.progress = body.progress;

    a2uiStore.updateActivity(body.id, updates);

    return NextResponse.json({
      success: true,
      data: { id: body.id, updated: true },
    });

  } catch (error) {
    console.error('A2UI update activity error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_ACTIVITY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

// DELETE - Clear activities
export async function DELETE(): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    a2uiStore.clearActivities();

    return NextResponse.json({
      success: true,
      data: { cleared: true },
    });

  } catch (error) {
    console.error('A2UI clear activities error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'CLEAR_ACTIVITIES_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}
