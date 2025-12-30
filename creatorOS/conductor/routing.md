# Intent Routing

This document maps user intents to workflows and agent sequences.

## Intent Detection Patterns

### CAMPAIGN Intent
**Triggers:** Marketing campaigns, content strategy, launch plans, promotional activities
```
Patterns:
- "Create a campaign for..."
- "How should we market..."
- "Content strategy for..."
- "Launch plan for..."
- "Promote this..."
- "Marketing idea:"
- "Go-to-market for..."
- "Content calendar for..."
- "How do we announce..."
- "Promotional plan for..."
```

**Route to:** `idea-to-campaign` workflow

---

### CONTENT Intent
**Triggers:** Content creation requests, writing tasks, copywriting
```
Patterns:
- "Write a..."
- "Create a post about..."
- "Draft an email for..."
- "I need copy for..."
- "Write the thread for..."
- "Blog post about..."
- "Script for..."
- "Social post for..."
- "Newsletter about..."
```

**Route to:** `content` agent (often within campaign workflow)

---

### BAWSA_CONTENT Intent
**Triggers:** BAWSA-specific content creation for @BawsaXBT
```
Patterns:
- "bawsa post about..."
- "bawsa tweet about..."
- "bawsa thread on..."
- "write for bawsa..."
- "@bawsaxbt post..."
- "create bawsa content..."
- "bawsa hot take..."
- "bawsa content about..."
```

**Route to:** `bawsa-content-creation` workflow

**Adapter:** `bawsa` (loads brand context, voice, pillars, audience)

**Agent:** `content-bawsa` (BAWSA-specialized content agent)

**Output:** Typefully draft for @BawsaXBT

---

### ANALYTICS Intent
**Triggers:** Performance analysis, metrics review, campaign reporting
```
Patterns:
- "How did the campaign perform..."
- "Analyze the results..."
- "What's working..."
- "Performance report for..."
- "Which content performed best..."
- "A/B test results..."
- "Are we on track..."
- "Review the metrics..."
- "Campaign analytics for..."
```

**Route to:** `analytics` agent

---

### IDEA Intent
**Triggers:** New features, capabilities, enhancements
```
Patterns:
- "I want to add..."
- "What if we..."
- "Let's build..."
- "Can we implement..."
- "I have an idea for..."
- "We should have..."
- "Feature request:"
```

**Route to:** `idea-to-impl` workflow

---

### BUG Intent
**Triggers:** Something broken, errors, unexpected behavior
```
Patterns:
- "This is broken"
- "Error:"
- "Not working"
- "Bug:"
- "Issue:"
- "Crash"
- "Fails when..."
- "Expected X but got Y"
```

**Route to:** `bug-to-fix` workflow

---

### QUESTION Intent
**Triggers:** Information requests, how-to questions
```
Patterns:
- "How does..."
- "What is..."
- "Where is..."
- "Why does..."
- "Can you explain..."
- "Tell me about..."
```

**Route to:** Direct response (no workflow, use relevant agent)
- Code questions → `architect` or `build`
- Design questions → `style` or `trends`
- Strategy questions → `vision`

---

### TASK Intent
**Triggers:** Specific, scoped actions
```
Patterns:
- "Update the..."
- "Change..."
- "Add a..."
- "Remove..."
- "Rename..."
- "Refactor..."
```

**Route to:** Mini workflow: `scope → build → review`

---

### EXPLORATION Intent
**Triggers:** Research, discovery, options analysis
```
Patterns:
- "Show me..."
- "Find..."
- "What are the options for..."
- "Research..."
- "Compare..."
- "Analyze..."
```

**Route to:** Relevant strategic agents
- Market exploration → `compete`
- Design exploration → `trends`
- Technical exploration → `architect`
- Product exploration → `vision`

---

### AUDIT Intent
**Triggers:** Health checks, system analysis
```
Patterns:
- "Check the codebase"
- "Run audit"
- "Health report"
- "What's the state of..."
- "Tech debt"
- "Review everything"
```

**Route to:** `weekly-audit` workflow

---

## Workflow Definitions

### idea-to-campaign
```yaml
name: Idea to Campaign
trigger: campaign intent
agents:
  - vision      # Validate alignment with roadmap
  - compete     # Analyze competitor marketing (optional)
  - trends      # Current content/design trends (optional)
  - campaign    # Create actionable campaign plan
  - scope       # Break into tasks
  - document    # Create team brief (optional)
checkpoints:
  - after: vision
    message: "Campaign aligns with priorities. Proceed?"
  - after: campaign
    message: "Review campaign plan?"
  - after: scope
    message: "Ready to start execution?"
```

### content-creation
```yaml
name: Content Creation
trigger: content intent
agents:
  - campaign    # Ensure alignment (if active campaign)
  - trends      # Check for relevant formats (optional)
  - content     # Create the actual content
  - review      # Quality check (for high-stakes content)
checkpoints:
  - after: content
    message: "Content ready. Review before publishing?"
```

### bawsa-content-creation
```yaml
name: BAWSA Content Creation
trigger: bawsa_content intent
adapter: bawsa
agents:
  - content-bawsa    # BAWSA-specialized content agent
integration:
  - typefully        # Push to Typefully as draft
checkpoints:
  - after: content-bawsa
    message: "Content ready for @BawsaXBT. Approve?"
output:
  - typefully_draft  # Draft created for review
```

### campaign-analytics
```yaml
name: Campaign Analytics
trigger: analytics intent
agents:
  - analytics   # Analyze metrics and produce insights
  - campaign    # Update strategy based on learnings (optional)
  - content     # Create optimized content (optional)
  - document    # Record learnings (for post-campaign)
checkpoints:
  - after: analytics
    message: "Analysis complete. Review findings?"
  - after: campaign
    message: "Strategy updates proposed. Approve?"
```

### idea-to-impl
```yaml
name: Idea to Implementation
trigger: idea intent
agents:
  - vision      # Prioritize against roadmap
  - trends      # Design inspiration (if UI-related)
  - compete     # Competitive analysis (if differentiating)
  - scope       # Break into phases
  - architect   # Technical design
  - build       # Code generation
  - review      # Quality gate
checkpoints:
  - after: architect
    message: "Approve technical approach?"
  - after: build
    message: "Approve code changes?"
```

### bug-to-fix
```yaml
name: Bug to Fix
trigger: bug intent
agents:
  - fix         # Diagnose and repair
  - review      # Validate fix
checkpoints:
  - after: fix
    message: "Approve fix?"
```

### weekly-audit
```yaml
name: Weekly Audit
trigger: audit intent or schedule
agents:
  - audit       # Scan codebase
  - vision      # Prioritize findings
  - scope       # Create actionable tasks
checkpoints:
  - after: scope
    message: "Review task list?"
auto_trigger:
  schedule: "every Monday at 9am"
  enabled: true
```

---

## Agent Selection Heuristics

When multiple agents could handle a request, use these heuristics:

| Signal | Agent |
|--------|-------|
| Mentions "bawsa" or "@bawsaxbt" | content-bawsa |
| Mentions "priority" or "should we" | vision |
| Mentions "campaign" or "marketing" or "promote" | campaign |
| Mentions "content strategy" or "launch plan" | campaign |
| Mentions "write" or "draft" or "copy" | content |
| Mentions "post" or "thread" or "email" or "blog" | content |
| Mentions "metrics" or "analytics" or "performance" | analytics |
| Mentions "how did" or "results" or "report" | analytics |
| Mentions "competitors" or "others do" | compete |
| Mentions "trending" or "design inspiration" | trends |
| Mentions "architecture" or "how to structure" | architect |
| Mentions "implement" or "code this" | build |
| Mentions "broken" or "not working" | fix |
| Mentions "looks wrong" or "styling" | style |
| Mentions "break down" or "phases" | scope |
| Mentions "fits with" or "consistent" | integrate |
| Mentions "document" or "update docs" | document |
| Mentions "what did I" or "last session" | warmup |
| Mentions "done for today" or "wrap up" | cooldown |
| Mentions "ready to ship" or "before pushing" | review |

---

## Confidence Thresholds

If intent classification confidence is below threshold, ask for clarification:

```
High confidence (>0.8): Proceed with workflow
Medium confidence (0.5-0.8): State assumption, ask to confirm
Low confidence (<0.5): Ask clarifying question before proceeding
```

Example:
```
User: "The button thing"

Conductor: "I'm not sure what you mean by 'the button thing'.
Could you clarify:
- Is something broken with a button? (bug)
- Do you want to add a new button? (idea)
- Do you want to change an existing button? (task)"
```
