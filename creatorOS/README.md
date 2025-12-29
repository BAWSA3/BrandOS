# CreatorOS

An orchestrated AI agent system that transforms ideas into implementations through automated workflows.

## Overview

CreatorOS is a reusable framework of specialized AI agents that communicate with each other to help you build software faster. Each agent has a specific responsibility, and the **Conductor** orchestrates them based on your intent.

```
YOUR IDEA → Conductor → Agent Pipeline → STRUCTURED OUTPUT
```

## Quick Start

1. Set your project adapter (e.g., `adapters/brandos/`)
2. Describe your intent (idea, bug, question)
3. The Conductor routes through the appropriate workflow
4. Review outputs at checkpoints
5. Ship when ready

## Agent Tiers

| Tier | Purpose | Agents |
|------|---------|--------|
| **Strategic** | Big picture, planning | vision, campaign, content, analytics, audit, compete, architect, trends |
| **Flow State** | Fast coding support | build, fix, style |
| **Milestone** | Quality gates | scope, integrate, document |
| **Session** | Context management | warmup, cooldown, review |

## Workflows

### Idea → Implementation
`vision → compete → scope → architect → build → review`

### Idea → Campaign
`vision → compete → trends → campaign → scope → document`

### Content Creation
`campaign? → trends? → content → review?`

### Campaign Analytics
`analytics → campaign? → content? → document?`

### Bug → Fix
`fix → review`

### Weekly Audit
`audit → vision → scope → [TODO list]`

## Project Structure

```
creatorOS/
├── conductor/           # Orchestration layer
│   ├── conductor.md     # Main orchestrator prompt
│   ├── routing.md       # Intent → workflow mapping
│   └── workflows/       # Workflow definitions
│
├── agents/              # Agent prompts by tier
│   ├── strategic/
│   ├── flow-state/
│   ├── milestone/
│   └── session/
│
├── protocols/           # Communication standards
│   ├── message-format.md
│   └── checkpoints.md
│
└── adapters/            # Project-specific context
    └── brandos/
```

## Human Checkpoints

**Phase 1 (Current):** Approve before any code changes
**Phase 2 (Later):** Approve at end of workflow only
**Phase 3 (Future):** Full autonomy for trusted workflows

## License

Private - For personal use
