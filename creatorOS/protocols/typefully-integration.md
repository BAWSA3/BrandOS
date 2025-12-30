# Typefully Integration Protocol

This document defines how creatorOS integrates with Typefully for content publishing via MCP tools.

## Available MCP Tools

### typefully_create_draft

Creates a new draft in Typefully.

```typescript
interface CreateDraftParams {
  social_set_id: number;
  requestBody: {
    platforms: {
      x?: {
        enabled: boolean;
        posts: Array<{ text: string; media_ids?: string[] }>;
        settings?: { reply_to_url?: string };
      };
      linkedin?: { enabled: boolean; posts: Array<{ text: string }> };
      threads?: { enabled: boolean; posts: Array<{ text: string }> };
      bluesky?: { enabled: boolean; posts: Array<{ text: string }> };
      mastodon?: { enabled: boolean; posts: Array<{ text: string }> };
    };
    draft_title?: string;
    publish_at?: string | "now" | "next-free-slot" | null;
    share?: boolean;
    tags?: string[];
  };
}
```

### typefully_list_drafts

Retrieves existing drafts for a social set.

```typescript
interface ListDraftsParams {
  social_set_id: number;
  limit?: number;        // 1-50, default 10
  offset?: number;       // default 0
  status?: "draft" | "published" | "scheduled" | "error" | "publishing";
  order_by?: string;     // e.g., "-updated_at"
}
```

### typefully_get_draft

Gets a specific draft by ID.

```typescript
interface GetDraftParams {
  social_set_id: number;
  draft_id: number;
}
```

### typefully_edit_draft

Updates an existing draft.

```typescript
interface EditDraftParams {
  social_set_id: number;
  draft_id: number;
  requestBody: Partial<CreateDraftParams["requestBody"]>;
}
```

### typefully_delete_draft

Deletes a draft.

```typescript
interface DeleteDraftParams {
  social_set_id: number;
  draft_id: number;
}
```

---

## Social Set Reference

| Project | Social Set ID | Platform | Handle |
|---------|---------------|----------|--------|
| BAWSA | 127543 | X | @BawsaXBT |
| Relique | 258268 | X | @ReliqueGlobal |
| Skillcade | 260664 | X | @skllcade |

---

## Integration Pattern

### Standard Workflow

```
1. Content agent generates content
         ↓
2. Format for Typefully API
         ↓
3. Present preview to user
         ↓
4. Human checkpoint for approval
         ↓
5. On approval: Create Typefully draft
         ↓
6. Return confirmation with draft link
```

### Draft Creation Template

```yaml
typefully_create_draft:
  social_set_id: [from adapter config]
  requestBody:
    platforms:
      x:
        enabled: true
        posts:
          - text: "[Tweet 1]"
          - text: "[Tweet 2]"
    draft_title: "[PILLAR] Topic - YYYY-MM-DD"
    publish_at: null    # Always draft first
    share: false
```

---

## Content Formatting

### Tweet Constraints

| Constraint | Value |
|------------|-------|
| Max characters | 280 per tweet |
| Max thread length | 25 tweets |
| Max media per tweet | 4 images or 1 video |

### Line Break Formatting

Use `\n` for line breaks:

```yaml
# Single line break
text: "line one\nline two"

# Double line break (paragraph)
text: "paragraph one\n\nparagraph two"
```

### Bullet Point Formatting

BAWSA style uses `>` for bullets:

```yaml
text: "my stack:\n\n> tool one\n> tool two\n> tool three"
```

Renders as:
```
my stack:

> tool one
> tool two
> tool three
```

---

## Publish Options

| Option | Value | Behavior |
|--------|-------|----------|
| Draft | `null` | Saves as draft for review |
| Immediate | `"now"` | Publishes immediately |
| Next slot | `"next-free-slot"` | Schedules to next available slot |
| Specific time | `"2024-01-15T14:00:00Z"` | Schedules for exact time |

**Default:** Always use `null` (draft) to ensure human review.

---

## Response Handling

### Success Response

```typescript
interface DraftResponse {
  id: number;
  social_set_id: number;
  status: "draft";
  preview: string;
  private_url: string;
  // ... other fields
}
```

### On Success

1. Extract draft ID
2. Construct Typefully URL: `https://typefully.com/?d={id}&a={social_set_id}`
3. Confirm to user with link

### On Error

1. Log error details
2. Present content as copy-paste fallback
3. Suggest troubleshooting steps

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 400 Bad Request | Invalid payload | Check formatting |
| 401 Unauthorized | API key issue | Verify MCP config |
| 429 Rate Limited | Too many requests | Wait and retry |
| 500 Server Error | Typefully issue | Retry later |

### Character Limit Exceeded

```yaml
on_char_limit:
  action: split
  rules:
    - Find natural sentence break
    - Ensure each tweet stands alone
    - Convert to thread format
```

### Fallback Protocol

If API fails:
```
1. Apologize for the issue
2. Present formatted content as text
3. Provide instructions for manual posting:
   "Copy this content and paste into typefully.com"
```

---

## Draft States

| State | Description | Available Actions |
|-------|-------------|-------------------|
| `draft` | Saved, not scheduled | Edit, Schedule, Delete |
| `scheduled` | Set to publish at time | Edit, Unschedule, Delete |
| `publishing` | Currently being posted | Wait |
| `published` | Successfully posted | View on platform |
| `error` | Failed to post | Review, Retry |

---

## Best Practices

### 1. Always Draft First

Never publish directly from workflow. Create as draft, let user review.

```yaml
# Correct
publish_at: null

# Avoid
publish_at: "now"
```

### 2. Human in the Loop

Require approval before any Typefully API interaction.

### 3. Descriptive Titles

Use consistent naming for easy organization:
```
"[PILLAR] Brief Topic - YYYY-MM-DD"
```

### 4. Preview Before Push

Always show exact content that will be created before API call.

### 5. Fallback Ready

Always have copy-paste alternative if API fails.

---

## Example Integration

### Single Tweet

```yaml
mcp__typefully__typefully_create_draft:
  social_set_id: 127543
  requestBody:
    platforms:
      x:
        enabled: true
        posts:
          - text: "vibe coding changed everything\n\nbuilt a dashboard in 3 hours\n\nused to take 3 days\n\nthe future is here"
    draft_title: "[TECH] Vibe Coding - 2024-01-15"
    publish_at: null
    share: false
```

### Thread

```yaml
mcp__typefully__typefully_create_draft:
  social_set_id: 127543
  requestBody:
    platforms:
      x:
        enabled: true
        posts:
          - text: "hard truth CT doesn't want to hear:\n\nyour brand isn't a laser-eyed pfp\n\nthread 🧵"
          - text: "it's not GM spams or alpha calls\n\nit's not even your takes"
          - text: "it's why anyone should care about YOUR version of those things\n\ndifferentiation > imitation"
          - text: "ask yourself:\n\n> what do I bring that others don't?\n> why should someone follow me vs the 1000 other accounts?\n> what's my actual edge?"
          - text: "the accounts that win long-term?\n\nthey have a clear answer to these questions\n\neveryone else is noise"
    draft_title: "[CRYPTO] Brand Truth Thread - 2024-01-15"
    publish_at: null
    share: false
```

---

## Checkpoint Integration

### Pre-Typefully Checkpoint

```markdown
## Content Ready for @BawsaXBT

### Preview
[Formatted content preview]

### Actions
- **Approve**: Create Typefully draft
- **Modify**: Adjust content first
- **Reject**: Start over

### Details
- Pillar: [Tech/Crypto/Personal]
- Format: [Tweet/Thread]
- Length: [X tweets, Y total chars]
```

### Post-Typefully Confirmation

```markdown
## Draft Created Successfully

- **Draft ID**: 12345
- **Title**: [TECH] Vibe Coding - 2024-01-15
- **Status**: Draft (ready for review)

**Next Steps:**
1. Review at: https://typefully.com/?d=12345&a=127543
2. Edit if needed
3. Schedule or publish when ready
```
