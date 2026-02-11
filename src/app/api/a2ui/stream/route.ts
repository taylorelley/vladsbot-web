import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Get Gateway URL from env
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const canvasPort = process.env.OPENCLAW_CANVAS_PORT || '18793';
  
  // Extract host from gateway URL
  const gatewayHost = new URL(gatewayUrl).hostname;
  const wsUrl = `ws://${gatewayHost}:${canvasPort}/__openclaw__/a2ui/stream`;

  try {
    // In a real implementation, we'd proxy the WebSocket connection here
    // For now, return instructions for direct connection
    return new Response(
      JSON.stringify({
        error: 'WebSocket proxy not yet implemented',
        hint: 'Connect directly to Gateway canvas host',
        wsUrl,
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('A2UI stream error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
