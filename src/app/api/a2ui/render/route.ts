// A2UI V3 - Render API Endpoint
// POST: Create or update a component
// DELETE: Remove a component

import { NextRequest, NextResponse } from 'next/server';
import { a2uiStore } from '@/lib/a2ui/store';
import { 
  A2UIRenderRequest, 
  A2UIRenderResponse,
  A2UIAPIResponse,
  isA2UIComponentType,
  isA2UILocation,
  createComponentId 
} from '@/types/a2ui';

// Validate render request
function validateRenderRequest(data: unknown): { valid: boolean; error?: string; request?: A2UIRenderRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const req = data as Record<string, unknown>;

  // Component type is required
  if (!req.component || typeof req.component !== 'string') {
    return { valid: false, error: 'component is required and must be a string' };
  }

  if (!isA2UIComponentType(req.component)) {
    return { 
      valid: false, 
      error: `Invalid component type: ${req.component}. Must be one of: Card, ButtonGroup, Form, Table, Progress, List, Chart, Accordion, Alert, Code` 
    };
  }

  // Props are required
  if (!req.props || typeof req.props !== 'object') {
    return { valid: false, error: 'props is required and must be an object' };
  }

  // Location validation (optional)
  if (req.location && typeof req.location === 'string' && !isA2UILocation(req.location)) {
    return { 
      valid: false, 
      error: `Invalid location: ${req.location}. Must be one of: chat, sidebar, floating` 
    };
  }

  // ID generation if not provided
  const id = typeof req.id === 'string' && req.id.length > 0 
    ? req.id 
    : createComponentId(req.component.toLowerCase());

  return {
    valid: true,
    request: {
      id,
      component: req.component,
      props: req.props as Record<string, unknown>,
      location: (req.location as A2UIRenderRequest['location']) || 'chat',
      position: req.position as A2UIRenderRequest['position'],
      ttl: typeof req.ttl === 'number' ? req.ttl : undefined,
    }
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<A2UIRenderResponse>> {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = validateRenderRequest(body);
    if (!validation.valid || !validation.request) {
      return NextResponse.json({
        success: false,
        rendered: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid request',
        }
      }, { status: 400 });
    }

    // Render component
    const component = a2uiStore.render(validation.request);

    return NextResponse.json({
      success: true,
      rendered: true,
      data: component,
    });

  } catch (error) {
    console.error('A2UI render error:', error);
    return NextResponse.json({
      success: false,
      rendered: false,
      error: {
        code: 'RENDER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Component id is required',
        }
      }, { status: 400 });
    }

    const removed = a2uiStore.remove(id);

    if (!removed) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Component with id '${id}' not found`,
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { id, removed: true },
    });

  } catch (error) {
    console.error('A2UI delete error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}

// Get component(s)
export async function GET(request: NextRequest): Promise<NextResponse<A2UIAPIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const location = searchParams.get('location');

    if (id) {
      // Get single component
      const component = a2uiStore.get(id);
      if (!component) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Component with id '${id}' not found`,
          }
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: component,
      });
    }

    if (location && isA2UILocation(location)) {
      // Get components by location
      const components = a2uiStore.getByLocation(location);
      return NextResponse.json({
        success: true,
        data: { components, count: components.length },
      });
    }

    // Get all components
    const components = a2uiStore.getAll();
    return NextResponse.json({
      success: true,
      data: { components, count: components.length },
    });

  } catch (error) {
    console.error('A2UI get error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'GET_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}
