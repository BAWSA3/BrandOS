#!/bin/bash
# Pre-commit hook to detect potential secrets in staged files
# Prevents accidental commits of API keys, tokens, and credentials

echo "🔍 Scanning for potential secrets..."

# Get list of staged files (excluding deleted files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No files to scan"
  exit 0
fi

# Patterns that might indicate secrets (regex)
PATTERNS=(
  # API Keys with common prefixes
  'sk-[a-zA-Z0-9]{20,}'                    # OpenAI/Anthropic style
  'sk_live_[a-zA-Z0-9]{20,}'               # Stripe live key
  'sk_test_[a-zA-Z0-9]{20,}'               # Stripe test key
  'pk_live_[a-zA-Z0-9]{20,}'               # Stripe public live
  'pk_test_[a-zA-Z0-9]{20,}'               # Stripe public test
  'AIza[a-zA-Z0-9_-]{35}'                  # Google API key
  'ghp_[a-zA-Z0-9]{36}'                    # GitHub personal access token
  'gho_[a-zA-Z0-9]{36}'                    # GitHub OAuth token
  'github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}'  # GitHub fine-grained PAT
  'xoxb-[a-zA-Z0-9-]+'                     # Slack bot token
  'xoxp-[a-zA-Z0-9-]+'                     # Slack user token

  # AWS
  'AKIA[0-9A-Z]{16}'                       # AWS Access Key ID
  '[a-zA-Z0-9/+=]{40}'                     # AWS Secret (too broad, commented out)

  # Generic patterns
  'Bearer [a-zA-Z0-9_-]{20,}'              # Bearer tokens
  'api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'  # api_key = "..."
  'secret["\s]*[:=]["\s]*[a-zA-Z0-9_-]{20,}'       # secret = "..."
  'password["\s]*[:=]["\s]*[^$][a-zA-Z0-9_-]{8,}'  # password = "..." (not env var)

  # Private keys (simplified patterns for grep compatibility)
  'BEGIN.*PRIVATE KEY'
  'BEGIN PGP PRIVATE KEY'
)

# Files to exclude from scanning
EXCLUDE_PATTERNS=(
  '\.env\.example$'
  'package-lock\.json$'
  'yarn\.lock$'
  'pnpm-lock\.yaml$'
  '\.md$'
  '\.txt$'
  'check-secrets\.sh$'
)

FOUND_SECRETS=0

for file in $STAGED_FILES; do
  # Skip excluded files
  SKIP=0
  for exclude in "${EXCLUDE_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$exclude"; then
      SKIP=1
      break
    fi
  done

  if [ $SKIP -eq 1 ]; then
    continue
  fi

  # Check if file exists
  if [ ! -f "$file" ]; then
    continue
  fi

  # Scan file for each pattern
  for pattern in "${PATTERNS[@]}"; do
    # Use git show to get staged content (not working directory)
    MATCHES=$(git show ":$file" 2>/dev/null | grep -nE "$pattern" || true)

    if [ -n "$MATCHES" ]; then
      echo ""
      echo "⚠️  Potential secret found in: $file"
      echo "   Pattern: $pattern"
      echo "   Matches:"
      echo "$MATCHES" | head -5 | sed 's/^/      /'
      FOUND_SECRETS=1
    fi
  done
done

echo ""

if [ $FOUND_SECRETS -eq 1 ]; then
  echo "❌ Potential secrets detected! Please review the files above."
  echo ""
  echo "If these are false positives, you can:"
  echo "  1. Add the pattern to the exclude list in scripts/check-secrets.sh"
  echo "  2. Use 'git commit --no-verify' to skip this check (not recommended)"
  echo ""
  exit 1
else
  echo "✅ No secrets detected"
  exit 0
fi
