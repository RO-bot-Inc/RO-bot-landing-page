#!/bin/bash
# Push skill changes back to central repository on web session end
# This ensures edits made in Claude Code web are synced back to GitHub

# Only run on web/remote sessions (terminal has its own push hook)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SKILLS_DIR="$HOME/.claude/skills"

# Exit if skills directory doesn't exist
[ -d "$SKILLS_DIR/.git" ] || exit 0

cd "$SKILLS_DIR"

# Configure git user for commits
git config user.email "claude-code-web@dsonders.dev" 2>/dev/null || true
git config user.name "Claude Code Web" 2>/dev/null || true

# Stage all changes
git add -A

# Exit if no changes
git diff --cached --quiet && exit 0

# Commit and push
git commit -m "Auto-sync from web: $(date +%Y-%m-%d\ %H:%M)"
git push origin main 2>/dev/null || true
