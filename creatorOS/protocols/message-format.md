# Agent Message Protocol

This document defines how agents communicate with each other through the Conductor.

## Message Structure

Every message between agents follows this TypeScript interface:

```typescript
interface AgentMessage {
  // Unique identifier for this message
  id: string;

  // Timestamp of message creation
  timestamp: string;

  // Which agent sent this message
  from: AgentType;

  // Which agent should receive this (or 'conductor' for routing)
  to: AgentType | 'conductor';

  // The classification of what this message is about
  intent: IntentType;

  // Project and domain context
  context: {
    project: string;        // e.g., "brandos", "other-project"
    domain: string;         // e.g., "feature", "bug", "design", "infrastructure"
    priority: 1 | 2 | 3;    // 1 = high, 2 = medium, 3 = low
    workflowId?: string;    // ID linking related messages in a workflow
  };

  // The actual content being passed
  payload: {
    input: any;             // What this agent received to work on
    output: any;            // What this agent produced
    artifacts?: Artifact[]; // Files, code, or other generated items
    confidence: number;     // 0-1 how confident the agent is in output
    needsReview: boolean;   // Should a human verify this?
    reasoning?: string;     // Explanation of decisions made
  };

  // Instructions for the next agent (if any)
  handoff?: {
    nextAgent: AgentType;
    instructions: string;
    context?: any;          // Additional context for next agent
  };

  // Any issues encountered
  issues?: Issue[];
}

type AgentType =
  | 'conductor'
  | 'vision' | 'campaign' | 'content' | 'analytics' | 'audit' | 'compete' | 'architect' | 'trends'
  | 'build' | 'fix' | 'style'
  | 'scope' | 'integrate' | 'document'
  | 'warmup' | 'cooldown' | 'review';

type IntentType =
  | 'idea' | 'campaign' | 'content' | 'analytics' | 'bug' | 'question' | 'task' | 'exploration' | 'audit';

interface Artifact {
  type: 'code' | 'documentation' | 'design' | 'analysis' | 'task-list';
  path?: string;            // File path if applicable
  content: string;          // The actual content
  language?: string;        // Programming language if code
  status: 'proposed' | 'approved' | 'applied';
}

interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolution?: string;
}
```

---

## Message Examples

### Vision Agent Output

```json
{
  "id": "msg_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "from": "vision",
  "to": "conductor",
  "intent": "idea",
  "context": {
    "project": "brandos",
    "domain": "feature",
    "priority": 1,
    "workflowId": "wf_abc123"
  },
  "payload": {
    "input": "Add team collaboration features",
    "output": {
      "recommendation": "PROCEED",
      "priority": "HIGH",
      "alignment": "Aligns with Scale phase of product roadmap",
      "dependencies": ["User authentication must be complete"],
      "userImpact": "Enables 60% of target users (teams) to adopt"
    },
    "confidence": 0.9,
    "needsReview": false,
    "reasoning": "Team features are explicitly called out in Q1 roadmap and user research shows high demand"
  },
  "handoff": {
    "nextAgent": "compete",
    "instructions": "Analyze how competitors (Figma, Notion, Canva) handle team collaboration for brand assets"
  }
}
```

### Build Agent Output

```json
{
  "id": "msg_005",
  "timestamp": "2024-01-15T11:00:00Z",
  "from": "build",
  "to": "conductor",
  "intent": "idea",
  "context": {
    "project": "brandos",
    "domain": "feature",
    "priority": 1,
    "workflowId": "wf_abc123"
  },
  "payload": {
    "input": {
      "feature": "Team invite system",
      "architecture": "REST API with email invitations"
    },
    "output": {
      "summary": "Created team invitation system with 4 files",
      "filesChanged": 4
    },
    "artifacts": [
      {
        "type": "code",
        "path": "src/app/api/teams/invite/route.ts",
        "content": "// API route code here...",
        "language": "typescript",
        "status": "proposed"
      },
      {
        "type": "code",
        "path": "src/components/TeamInvite.tsx",
        "content": "// Component code here...",
        "language": "typescript",
        "status": "proposed"
      }
    ],
    "confidence": 0.85,
    "needsReview": true,
    "reasoning": "Followed existing API patterns from /api/brands. Component follows BentoCard pattern."
  },
  "handoff": {
    "nextAgent": "review",
    "instructions": "Validate code quality, type safety, and pattern consistency"
  }
}
```

---

## Handoff Patterns

### Sequential Handoff
Agent A completes, passes to Agent B:
```
vision → scope → architect → build → review
```

### Parallel Handoff
Multiple agents can run simultaneously:
```
         ┌→ compete ─┐
vision ──┤           ├→ scope
         └→ trends ──┘
```

### Conditional Handoff
Next agent depends on output:
```
fix → (confidence > 0.8) ? review : ask_user
```

### Loop Handoff
Return to previous agent for refinement:
```
build → review → (issues?) → build → review
```

---

## Confidence Guidelines

| Confidence | Meaning | Action |
|------------|---------|--------|
| 0.9 - 1.0 | Very confident | Proceed automatically |
| 0.7 - 0.9 | Confident | Proceed, note assumptions |
| 0.5 - 0.7 | Uncertain | Request clarification or review |
| 0.0 - 0.5 | Low confidence | Stop and ask user |

---

## Error Messages

When an agent encounters an error:

```json
{
  "from": "build",
  "to": "conductor",
  "payload": {
    "output": null,
    "confidence": 0,
    "needsReview": true
  },
  "issues": [
    {
      "severity": "error",
      "message": "Cannot find referenced component: BrandScoreCard",
      "resolution": "Please clarify which component to use or create a new one"
    }
  ]
}
```

---

## Checkpoint Messages

When a checkpoint is required:

```json
{
  "from": "conductor",
  "to": "user",
  "intent": "checkpoint",
  "payload": {
    "type": "approval_required",
    "stage": "pre_code_change",
    "summary": "Ready to create 4 files for team invitation feature",
    "artifacts": [...],
    "options": ["approve", "modify", "reject"]
  }
}
```
