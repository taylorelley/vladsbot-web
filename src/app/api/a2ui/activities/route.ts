import { NextResponse } from 'next/server';
import { A2UIActivity } from '@/types/a2ui';

// Simple in-memory store (replace with Redis/DB for production)
let currentActivities: A2UIActivity[] = [];

export async function GET() {
  // For now, return mock data to test the UI
  // In production, this would fetch from Gateway canvas host
  return NextResponse.json({ activities: currentActivities });
}

export async function POST(request: Request) {
  // Agent can POST updates via /api/chat or directly
  const body = await request.json();
  
  if (body.activity) {
    const activity: A2UIActivity = {
      ...body.activity,
      timestamp: Date.now(),
    };

    // Update or add activity
    const existingIndex = currentActivities.findIndex(a => a.id === activity.id);
    if (existingIndex >= 0) {
      currentActivities[existingIndex] = activity;
    } else {
      currentActivities.push(activity);
    }

    // Auto-remove completed/failed activities after 10 seconds
    if (activity.status !== 'active') {
      setTimeout(() => {
        currentActivities = currentActivities.filter(a => a.id !== activity.id);
      }, 10000);
    }
  } else if (body.clear) {
    currentActivities = [];
  }

  return NextResponse.json({ success: true });
}
