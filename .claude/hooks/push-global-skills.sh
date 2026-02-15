#!/bin/bash
# Push skill changes back to dsonders/claude-skills on session end
# Only runs on web (terminal uses global ~/.claude/hooks/push-global-skills.sh)

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SKILLS_DIR="$HOME/.claude/skills"
[ -d "$SKILLS_DIR/.git" ] || exit 0

SECRETS_FILE="$HOME/.claude/secrets/skills-pat"
if [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  GITHUB_PAT="$CLAUDE_SKILLS_PAT"
elif [ -f "$SECRETS_FILE" ]; then
  GITHUB_PAT="$(tr -d '[:space:]' < "$SECRETS_FILE")"
else
  exit 0
fi

cd "$SKILLS_DIR"
git remote set-url origin "https://${GITHUB_PAT}@github.com/dsonders/claude-skills.git" 2>/dev/null || true
git config user.email "claude-code-web@dsonders.dev" 2>/dev/null || true
git config user.name "Claude Code Web" 2>/dev/null || true

git add -A
git diff --cached --quiet && exit 0
git commit -m "Auto-sync from web: $(date +%Y-%m-%d\ %H:%M)" >/dev/null 2>&1
git push origin main >/dev/null 2>&1 || echo "Warning: Skills push failed" >&2
