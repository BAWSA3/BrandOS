# BAWSA Typefully Configuration

## Account Configuration

```yaml
social_set_id: 127543
account_name: "BAWSA"
username: "@BawsaXBT"
```

## Connected Platforms

| Platform | Status | Handle |
|----------|--------|--------|
| X (Twitter) | Connected | @BawsaXBT |
| LinkedIn | Not connected | - |
| Threads | Not connected | - |
| Bluesky | Not connected | - |
| Mastodon | Not connected | - |

## Default Draft Settings

```yaml
# Default settings for all BAWSA drafts
defaults:
  share: false              # Don't generate public share URLs
  publish_at: null          # Save as draft (user reviews/schedules)

  platforms:
    x:
      enabled: true
    linkedin:
      enabled: false
    threads:
      enabled: false
    bluesky:
      enabled: false
    mastodon:
      enabled: false
```

## Draft Naming Convention

```
Format: "[PILLAR] [Brief Topic] - [Date]"

Examples:
- "[CRYPTO] CT Culture Take - 2024-01-15"
- "[TECH] Vibe Coding Thread - 2024-01-15"
- "[PERSONAL] 3 Year Reflection - 2024-01-15"
- "[CROSS] AI + Web3 Building - 2024-01-15"
```

## Platform Constraints

### X (Twitter)

| Constraint | Value |
|------------|-------|
| Max characters per tweet | 280 |
| Max tweets per thread | 25 |
| Max media per tweet | 4 images or 1 video |
| Supported media | jpg, png, gif, mp4 |

### Thread Formatting

```yaml
# Single post
posts:
  - text: "your tweet content here"

# Thread (multiple posts)
posts:
  - text: "tweet 1 - the hook"
  - text: "tweet 2 - context"
  - text: "tweet 3 - insight"
  - text: "tweet 4 - cta"
```

### Line Breaks

Line breaks are preserved using `\n`:

```yaml
text: "line one\n\nline two\n\nline three"
```

Renders as:
```
line one

line two

line three
```

## API Integration Patterns

### Create Draft

```yaml
tool: typefully_create_draft
parameters:
  social_set_id: 127543
  requestBody:
    platforms:
      x:
        enabled: true
        posts:
          - text: "[Content here]"
    draft_title: "[PILLAR] Topic - Date"
    publish_at: null        # Always draft first
    share: false
```

### Response Handling

```yaml
on_success:
  - Extract draft ID from response
  - Provide Typefully URL for review
  - Confirm draft created

on_error:
  - Log error details
  - Provide content as copy-paste fallback
  - Suggest retry
```

## Workflow Integration

### Standard Flow

```
1. Content Agent generates content
         ↓
2. Human checkpoint for approval
         ↓
3. Create Typefully draft (publish_at: null)
         ↓
4. User reviews in Typefully
         ↓
5. User schedules/publishes manually
```

### Approval Required

NEVER publish directly. Always:
- Create as draft first
- User reviews in Typefully
- User makes final publish decision

## Character Count Guidelines

Since tweets have 280 char limit, format content to fit:

| Content Type | Target Length |
|--------------|---------------|
| Hook tweet | 100-200 chars |
| Body tweet | 150-250 chars |
| CTA tweet | 100-200 chars |

### Splitting Long Content

If content exceeds 280 chars:
1. Split at natural sentence break
2. Ensure each tweet stands alone
3. Use thread format

## Tags (Future)

When tags are configured in Typefully:

```yaml
available_tags:
  - crypto
  - tech
  - personal
  - thread
  - hot-take
  - shipping
```

Usage:
```yaml
tags: ["tech", "thread"]
```

## Error Handling

| Error | Action |
|-------|--------|
| Character limit exceeded | Split into thread |
| API rate limit | Wait and retry |
| Auth error | Alert user to check API key |
| Network error | Retry with backoff |

### Fallback Protocol

If Typefully API fails:
```
1. Present formatted content to user
2. Provide copy-paste version
3. Include manual posting instructions
```

## Quick Reference

```yaml
# Minimal draft creation
typefully_create_draft:
  social_set_id: 127543
  requestBody:
    platforms:
      x:
        enabled: true
        posts:
          - text: "your content"
```

```yaml
# Thread creation
typefully_create_draft:
  social_set_id: 127543
  requestBody:
    draft_title: "[TECH] My Thread - 2024-01-15"
    platforms:
      x:
        enabled: true
        posts:
          - text: "hook tweet\n\nthread 🧵"
          - text: "second tweet"
          - text: "third tweet"
          - text: "closing tweet with cta 👇"
```
