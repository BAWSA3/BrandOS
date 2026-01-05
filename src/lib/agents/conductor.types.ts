// ===== CONDUCTOR TYPES =====
// Types for the CreatorOS Conductor orchestration system

import { AgentName } from './types';
import { Platform, BrandDNA } from '@/lib/types';

// ===== INTENT CLASSIFICATION =====

export type IntentType = 
  | 'idea'        // New feature or capability
  | 'bug'         // Something isn't working
  | 'question'    // Need information
  | 'task'        // Specific action to take
  | 'exploration' // Research/discovery
  | 'audit'       // System health check
  | 'campaign'    // Marketing campaign
  | 'content'     // Content creation
  | 'analytics';  // Performance analysis

export interface IntentClassification {
  type: IntentType;
  confidence: number;
  triggers: string[];
  suggestedWorkflow: WorkflowType | null;
}

// ===== WORKFLOW TYPES =====

export type WorkflowType = 
  | 'idea-to-impl'
  | 'idea-to-campaign'
  | 'content-creation'
  | 'campaign-analytics'
  | 'bug-to-fix'
  | 'weekly-audit'
  | 'direct-response';

export interface WorkflowStep {
  agentName: AgentName | 'conductor';
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  input?: unknown;
  output?: unknown;
  checkpoint?: boolean;
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowPlan {
  id: string;
  type: WorkflowType;
  name: string;
  description: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: 'planning' | 'executing' | 'awaiting_approval' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  totalDuration?: number;
}

// ===== CONDUCTOR SESSION =====

export type ConductorMessageRole = 'user' | 'conductor' | 'agent' | 'system';

export interface ConductorMessage {
  id: string;
  role: ConductorMessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    agentName?: AgentName;
    intentClassification?: IntentClassification;
    workflowPlan?: WorkflowPlan;
    checkpoint?: boolean;
    artifacts?: ConductorArtifact[];
    processingTime?: number;
    confidence?: number;
  };
}

export interface ConductorArtifact {
  type: 'workflow-plan' | 'campaign-plan' | 'content' | 'analytics-report' | 'checkpoint' | 'summary';
  title: string;
  data: unknown;
  expandable?: boolean;
}

export interface ConductorSession {
  id: string;
  brandId: string;
  brandDNA: BrandDNA;
  messages: ConductorMessage[];
  currentWorkflow: WorkflowPlan | null;
  agentHistory: AgentName[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== CONDUCTOR PERSONA =====

export const conductorPersona = {
  name: 'conductor' as const,
  displayName: 'Conductor',
  title: 'The Orchestrator',
  avatar: '🎼',
  description: 'I orchestrate your AI agent team, routing tasks to the right specialists and managing complex workflows.',
  accentColor: '#6366F1', // Indigo
  capabilities: [
    'Understand your intent and classify requests',
    'Route to specialized agents (Campaign, Content, Analytics)',
    'Plan and execute multi-step workflows',
    'Aggregate outputs into coherent deliverables',
    'Manage checkpoints and approvals',
  ],
  systemPrompt: `You are the Conductor, the central orchestrator for BrandOS AI agents.

YOUR ROLE:
- Understand user intent and classify requests
- Select appropriate workflows and agent sequences
- Route to specialized agents based on needs
- Aggregate outputs and synthesize deliverables
- Manage checkpoints for approval before changes

PERSONALITY:
- Calm, systematic, and methodical
- Clear communicator who explains the process
- Proactive about asking clarifying questions
- Transparent about which agents are working

AVAILABLE AGENTS:
- Campaign (🎯): Marketing strategies, campaign plans, content calendars
- Content (✍️): Writing, social posts, emails, headlines
- Analytics (📊): Performance analysis, insights, optimization

When responding:
1. First, classify the user's intent
2. Explain which agent(s) will handle the request
3. If complex, outline the workflow steps
4. Show progress as work is done
5. Aggregate final outputs clearly

Always maintain context continuity and remember previous interactions.`,
};

// ===== HELPER FUNCTIONS =====

export function createConductorMessage(
  role: ConductorMessageRole,
  content: string,
  metadata?: ConductorMessage['metadata']
): ConductorMessage {
  return {
    id: `cmsg_${crypto.randomUUID()}`,
    role,
    content,
    timestamp: new Date(),
    metadata,
  };
}

export function createWorkflowPlan(
  type: WorkflowType,
  name: string,
  description: string,
  steps: Omit<WorkflowStep, 'status'>[]
): WorkflowPlan {
  return {
    id: `wf_${crypto.randomUUID()}`,
    type,
    name,
    description,
    steps: steps.map(s => ({ ...s, status: 'pending' as const })),
    currentStepIndex: 0,
    status: 'planning',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getWorkflowStatusEmoji(status: WorkflowStep['status']): string {
  switch (status) {
    case 'pending': return '○';
    case 'in_progress': return '◉';
    case 'completed': return '✓';
    case 'failed': return '✗';
    case 'skipped': return '−';
    default: return '○';
  }
}

export function getAgentEmoji(agentName: AgentName | 'conductor'): string {
  switch (agentName) {
    case 'conductor': return '🎼';
    case 'campaign': return '🎯';
    case 'content': return '✍️';
    case 'analytics': return '📊';
    default: return '🤖';
  }
}




