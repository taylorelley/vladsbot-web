// A2UI V3 - SSE Events Endpoint
// Real-time server-sent events for component updates

import { NextRequest } from 'next/server';
import { a2uiStore } from '@/lib/a2ui/store';
import { A2UISSEMessage } from '@/types/a2ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage: A2UISSEMessage = {
        type: 'heartbeat',
        data: null,
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
      );

      // Send current state
      const components = a2uiStore.getAll();
      if (components.length > 0) {
        components.forEach(component => {
          const msg: A2UISSEMessage = {
            type: 'component.render',
            data: component,
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        });
      }

      const activities = a2uiStore.getActivities();
      if (activities.length > 0) {
        const msg: A2UISSEMessage = {
          type: 'activity.update',
          data: { activities, timestamp: Date.now() },
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      }

      // Subscribe to store events
      const unsubscribe = a2uiStore.events.subscribe((message) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        } catch (err) {
          // Stream might be closed
          console.error('SSE write error:', err);
        }
      });

      // Heartbeat interval
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat: A2UISSEMessage = {
            type: 'heartbeat',
            data: null,
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (err) {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 second heartbeat

      // Handle request abort
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
