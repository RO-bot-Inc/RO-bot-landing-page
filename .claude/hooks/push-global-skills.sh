#!/bin/bash
# Push skill changes back to dsonders/claude-skills on Stop — WEB ONLY.
# Terminal and the Mac app use the global ~/.claude/hooks/push-global-skills.sh (SSH).
#
# Auth: credential helper fed from an env var; the token is NEVER put in the
# remote URL (see fetch-global-skills.sh for why). A push failure only warns.

set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

SKILLS_REPO="https://github.com/dsonders/claude-skills.git"
SKILLS_DIR="$HOME/.claude/skills"
SECRETS_FILE="$HOME/.claude/secrets/skills-pat"

[ -d "$SKILLS_DIR/.git" ] || exit 0

if [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  GIT_SKILLS_PAT="$CLAUDE_SKILLS_PAT"
elif [ -f "$SECRETS_FILE" ]; then
  GIT_SKILLS_PAT="$(tr -d '[:space:]' < "$SECRETS_FILE")"
else
  exit 0
fi
export GIT_SKILLS_PAT
export GIT_TERMINAL_PROMPT=0

CRED_HELPER='!f() { printf "username=x-access-token\npassword=%s\n" "$GIT_SKILLS_PAT"; }; f'
git_auth() { git -c credential.helper= -c "credential.helper=$CRED_HELPER" "$@"; }

cd "$SKILLS_DIR"
# Never commit from a clone that is mid-rebase or mid-merge: add -A would stage
# conflict markers. Leave it for the next fetch to abort and warn.
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
  echo "Warning: Skills clone has an unfinished rebase/merge — not pushing" >&2
  exit 0
fi
git remote set-url origin "$SKILLS_REPO" 2>/dev/null || true
git config user.email "claude-code-web@dsonders.dev" 2>/dev/null || true
git config user.name "Claude Code Web" 2>/dev/null || true

git add -A
git diff --cached --quiet && exit 0
git commit -m "Auto-sync from web: $(date +%Y-%m-%d\ %H:%M)" >/dev/null 2>&1
git_auth push origin main >/dev/null 2>&1 || echo "Warning: Skills push failed" >&2
