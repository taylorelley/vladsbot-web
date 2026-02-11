import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate a multi-step deployment process
  const activities = [
    {
      id: 'deploy-1',
      type: 'progress',
      status: 'active',
      title: 'Building Next.js app',
      description: 'Compiling TypeScript and bundling assets...',
      progress: 35,
    },
    {
      id: 'deploy-2',
      type: 'progress',
      status: 'active',
      title: 'Creating Docker image',
      description: 'Step 8/15: Installing dependencies...',
      progress: 53,
    },
    {
      id: 'git-merge',
      type: 'tool_call',
      status: 'completed',
      title: 'Merged dev → main',
      description: 'Fast-forward merge, no conflicts',
    },
  ];

  // Push each activity
  for (const activity of activities) {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/a2ui/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity }),
    });
  }

  return NextResponse.json({ success: true, count: activities.length });
}

export async function DELETE() {
  // Clear all activities
  await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/a2ui/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clear: true }),
  });

  return NextResponse.json({ success: true });
}
