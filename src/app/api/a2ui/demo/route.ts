// A2UI V3 - Demo API
// Creates demo components for testing

import { NextRequest, NextResponse } from 'next/server';
import { a2uiStore } from '@/lib/a2ui/store';
import { createComponentId } from '@/types/a2ui';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { scenario } = await request.json();

    switch (scenario) {
      case 'deployment':
        return createDeploymentDemo();
      case 'form':
        return createFormDemo();
      case 'analytics':
        return createAnalyticsDemo();
      case 'all':
        return createAllComponentsDemo();
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown scenario. Try: deployment, form, analytics, all'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Demo error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function createDeploymentDemo() {
  // Create deployment approval card
  a2uiStore.render({
    id: createComponentId('deploy'),
    component: 'Card',
    location: 'chat',
    props: {
      title: '🚀 Production Deployment',
      subtitle: 'vladsbot-web • main branch',
      content: '**Changes:**\n• 12 files changed\n• +728 additions, -39 deletions\n• Last commit: be87dd6',
      variant: 'warning',
      actions: [
        { label: '✅ Deploy Now', action: 'deploy', variant: 'success' },
        { label: '📝 Review', action: 'review', variant: 'secondary' },
        { label: '❌ Cancel', action: 'cancel', variant: 'danger' },
      ],
    },
  });

  // Create progress in sidebar
  a2uiStore.render({
    id: createComponentId('build-progress'),
    component: 'Progress',
    location: 'sidebar',
    props: {
      title: 'Build Progress',
      current: 3,
      total: 10,
      percentage: 30,
      status: 'Installing dependencies...',
      animated: true,
      steps: [
        { label: 'Checkout', completed: true },
        { label: 'Install', completed: true },
        { label: 'Build', completed: true },
        { label: 'Test', completed: false },
        { label: 'Deploy', completed: false },
      ],
    },
  });

  return NextResponse.json({ success: true, scenario: 'deployment' });
}

function createFormDemo() {
  a2uiStore.render({
    id: createComponentId('config-form'),
    component: 'Form',
    location: 'chat',
    props: {
      title: '⚙️ Deployment Configuration',
      description: 'Configure your deployment settings',
      fields: [
        {
          name: 'environment',
          label: 'Environment',
          type: 'select',
          options: ['development', 'staging', 'production'],
          required: true,
        },
        {
          name: 'branch',
          label: 'Branch',
          type: 'text',
          placeholder: 'main',
          required: true,
        },
        {
          name: 'notifications',
          label: 'Notifications',
          type: 'checkbox',
          options: ['Slack', 'Email', 'Discord'],
        },
        {
          name: 'notes',
          label: 'Deployment Notes',
          type: 'textarea',
          placeholder: 'Any notes about this deployment...',
          rows: 3,
        },
      ],
      submitLabel: '🚀 Deploy',
      cancelLabel: 'Cancel',
      note: '🔒 Settings are saved automatically',
    },
  });

  return NextResponse.json({ success: true, scenario: 'form' });
}

function createAnalyticsDemo() {
  // Chart in sidebar
  a2uiStore.render({
    id: createComponentId('token-chart'),
    component: 'Chart',
    location: 'sidebar',
    props: {
      title: '📊 Token Usage',
      type: 'line',
      data: {
        labels: ['10:00', '10:30', '11:00', '11:30', '12:00'],
        datasets: [
          {
            label: 'Tokens',
            data: [1200, 1900, 2800, 2500, 3200],
            color: '#3b82f6',
          },
        ],
      },
      height: 150,
      showLegend: false,
    },
  });

  // Table in chat
  a2uiStore.render({
    id: createComponentId('tool-usage'),
    component: 'Table',
    location: 'chat',
    props: {
      title: '🛠️ Tool Usage Statistics',
      headers: ['Tool', 'Calls', 'Success Rate', 'Avg Time'],
      rows: [
        ['web_search', '15', '93%', '1.2s'],
        ['exec', '12', '100%', '2.8s'],
        ['memory_search', '8', '100%', '0.5s'],
        ['read', '45', '100%', '0.1s'],
        ['write', '23', '100%', '0.2s'],
      ],
      sortable: true,
      searchable: true,
      striped: true,
    },
  });

  return NextResponse.json({ success: true, scenario: 'analytics' });
}

function createAllComponentsDemo() {
  // Card
  a2uiStore.render({
    id: 'demo-card',
    component: 'Card',
    location: 'chat',
    props: {
      title: '📋 Card Component',
      subtitle: 'With markdown content',
      content: 'This is a **card** with:\n- Markdown support\n- Action buttons\n- Multiple variants',
      variant: 'info',
      actions: [
        { label: 'Primary', action: 'primary', variant: 'primary' },
        { label: 'Secondary', action: 'secondary', variant: 'secondary' },
      ],
    },
  });

  // ButtonGroup
  a2uiStore.render({
    id: 'demo-buttons',
    component: 'ButtonGroup',
    location: 'chat',
    props: {
      title: '🔘 Button Group',
      buttons: [
        { label: '✅ Approve', action: 'approve', variant: 'success' },
        { label: '⚠️ Warn', action: 'warn', variant: 'warning' },
        { label: '❌ Reject', action: 'reject', variant: 'danger' },
      ],
      layout: 'horizontal',
    },
  });

  // Alert
  a2uiStore.render({
    id: 'demo-alert',
    component: 'Alert',
    location: 'chat',
    props: {
      title: '⚠️ Context Warning',
      message: 'You are at 75% context usage. Consider summarizing.',
      variant: 'warning',
      dismissible: true,
      actions: [
        { label: 'Summarize', action: 'summarize', variant: 'primary' },
      ],
    },
  });

  // List
  a2uiStore.render({
    id: 'demo-list',
    component: 'List',
    location: 'chat',
    props: {
      title: '📝 Task List',
      items: [
        { text: 'Set up project', status: 'completed', icon: '✅' },
        { text: 'Build components', status: 'completed', icon: '✅' },
        { text: 'Write tests', status: 'active', icon: '🔄' },
        { text: 'Deploy', status: 'pending', icon: '⏳' },
      ],
      variant: 'checklist',
    },
  });

  // Accordion
  a2uiStore.render({
    id: 'demo-accordion',
    component: 'Accordion',
    location: 'chat',
    props: {
      title: '📚 FAQ',
      sections: [
        {
          title: 'How do I deploy?',
          content: 'Click the deploy button and follow the prompts.',
          defaultOpen: true,
          icon: '🚀',
        },
        {
          title: 'What are the requirements?',
          content: 'Node.js 18+, npm or pnpm, and a Coolify server.',
          icon: '📋',
        },
      ],
      allowMultiple: true,
    },
  });

  // Code
  a2uiStore.render({
    id: 'demo-code',
    component: 'Code',
    location: 'chat',
    props: {
      title: '💻 Example Code',
      language: 'typescript',
      code: `async function deploy(env: string) {\n  const result = await build();\n  if (result.success) {\n    await push(env);\n    console.log("Deployed!");\n  }\n}`,
      copyable: true,
      lineNumbers: true,
    },
  });

  // Progress in sidebar
  a2uiStore.render({
    id: 'demo-progress',
    component: 'Progress',
    location: 'sidebar',
    props: {
      title: '⏳ Loading...',
      current: 65,
      total: 100,
      percentage: 65,
      status: 'Processing data...',
      animated: true,
    },
  });

  // Chart in sidebar
  a2uiStore.render({
    id: 'demo-chart',
    component: 'Chart',
    location: 'sidebar',
    props: {
      title: '📈 Activity',
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
          { label: 'Messages', data: [12, 19, 8, 15, 22], color: '#3b82f6' },
        ],
      },
      height: 120,
      showLegend: false,
    },
  });

  return NextResponse.json({ success: true, scenario: 'all', componentsCreated: 8 });
}

export async function DELETE(): Promise<NextResponse> {
  // Clear all demo components
  a2uiStore.clear();
  return NextResponse.json({ success: true, message: 'Demo cleared' });
}
