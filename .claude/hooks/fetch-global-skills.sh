#!/bin/bash
# Fetch global skills from dsonders/claude-skills on SessionStart
# Works in both terminal (redundant but harmless) and web (essential)

set -euo pipefail

SECRETS_FILE="$HOME/.claude/secrets/skills-pat"
if [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  GITHUB_PAT="$CLAUDE_SKILLS_PAT"
elif [ -f "$SECRETS_FILE" ]; then
  GITHUB_PAT="$(tr -d '[:space:]' < "$SECRETS_FILE")"
else
  echo "Warning: No PAT found. Set CLAUDE_SKILLS_PAT or create $SECRETS_FILE" >&2
  exit 0
fi

SKILLS_REPO="https://${GITHUB_PAT}@github.com/dsonders/claude-skills.git"
SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$HOME/.claude"

if [ -d "$SKILLS_DIR/.git" ]; then
  cd "$SKILLS_DIR"
  git remote set-url origin "$SKILLS_REPO" 2>/dev/null || true
  if ! git pull --rebase origin main >/dev/null 2>&1; then
    cd "$HOME/.claude"
    rm -rf "$SKILLS_DIR"
    git clone --quiet "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Warning: Skills clone failed" >&2
  fi
elif [ -d "$SKILLS_DIR" ]; then
  rm -rf "$SKILLS_DIR"
  git clone --quiet "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Warning: Skills clone failed" >&2
else
  git clone --quiet "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Warning: Skills clone failed" >&2
fi
