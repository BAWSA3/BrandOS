# Checkpoint Protocol

This document defines when and how to pause for human approval.

## Checkpoint Philosophy

CreatorOS uses a **phased trust model**:

```
PHASE 1 (Current):  Approve BEFORE any code changes
PHASE 2 (Later):    Approve at END of workflow only
PHASE 3 (Future):   Full autonomy for trusted workflows
```

---

## Phase 1: Pre-Code Approval

### When to Checkpoint

| Trigger | Checkpoint Required |
|---------|---------------------|
| Agent produces code artifacts | YES |
| Agent suggests file changes | YES |
| Agent makes architectural decision | YES |
| Agent produces analysis only | NO |
| Agent asks clarifying question | NO |

### Checkpoint Format

```markdown
## Checkpoint: [Stage Name]

### What's About to Happen
[Clear description of proposed changes]

### Files to be Created/Modified
- `path/to/file.ts` - [brief description]
- `path/to/other.tsx` - [brief description]

### Key Decisions Made
1. [Decision 1] - [Rationale]
2. [Decision 2] - [Rationale]

### Confidence Level
[HIGH | MEDIUM | LOW] - [Explanation]

### Options
- **Approve**: Proceed with these changes
- **Modify**: I want to change something first
- **Reject**: Don't do this, let's try a different approach
```

---

## Checkpoint Locations by Workflow

### idea-to-impl Workflow
```
vision ─────────────────────────────────── (no checkpoint, analysis only)
    │
compete ────────────────────────────────── (no checkpoint, research only)
    │
trends ─────────────────────────────────── (no checkpoint, inspiration only)
    │
scope ──────────────────────────────────── (no checkpoint, planning only)
    │
architect ──────► CHECKPOINT: Technical Design
    │             "Approve this architecture?"
    │
build ──────────► CHECKPOINT: Code Changes
    │             "Approve these file changes?"
    │
review ─────────────────────────────────── (no checkpoint, validation only)
    │
[DONE]
```

### bug-to-fix Workflow
```
fix ────────────► CHECKPOINT: Bug Fix
    │             "Approve this fix?"
    │
review ─────────────────────────────────── (no checkpoint, validation only)
    │
[DONE]
```

### weekly-audit Workflow
```
audit ──────────────────────────────────── (no checkpoint, analysis only)
    │
vision ─────────────────────────────────── (no checkpoint, prioritization only)
    │
scope ──────────► CHECKPOINT: Task List
    │             "Approve this week's priorities?"
    │
[DONE]
```

---

## Handling Checkpoint Responses

### On Approve
```
User: "Approve"
→ Proceed to next agent
→ Mark artifacts as "approved"
→ If final agent, apply changes
```

### On Modify
```
User: "Modify" + feedback
→ Return to relevant agent with feedback
→ Agent revises output
→ Return to checkpoint
```

### On Reject
```
User: "Reject" + reason
→ Log rejection with reason
→ Ask: "Would you like to try a different approach?"
→ If yes, return to earlier stage
→ If no, end workflow
```

---

## Checkpoint Bypass Rules

Certain situations allow bypassing checkpoints:

### Allowed Bypasses
- User explicitly says "just do it" or "auto-approve"
- Change is to a non-production file (tests, docs)
- Change is a single-line fix with high confidence
- User has enabled Phase 2 for this workflow

### Never Bypass
- Changes to core business logic
- Database schema changes
- API changes that affect external consumers
- Security-related code
- Configuration files (.env, etc.)

---

## Checkpoint Timeout

If no response within 24 hours:
1. Send reminder notification
2. After 48 hours, mark workflow as "paused"
3. User can resume with `/resume [workflow_id]`

---

## Audit Trail

Every checkpoint interaction is logged:

```json
{
  "checkpointId": "cp_001",
  "workflowId": "wf_abc123",
  "timestamp": "2024-01-15T11:00:00Z",
  "stage": "architect",
  "response": "approve",
  "responseTime": "00:02:34",
  "notes": null
}
```

This creates an audit trail of all decisions for later review.

---

## Phase 2 Transition

To move a workflow to Phase 2 (end-only approval):

1. Workflow must have been run successfully 5+ times
2. User explicitly opts in: `/trust [workflow_name]`
3. No rejections in last 10 runs

To revert to Phase 1:
- Any rejection automatically reverts
- User can manually: `/untrust [workflow_name]`
