#!/bin/bash
# Fetch global skills from central repository
# Runs on SessionStart to ensure skills are available

set -euo pipefail

# Output async mode for faster session start
echo '{"async": true, "asyncTimeout": 60000}'

# PAT for authenticated access (scoped to claude-skills repo only)
# Reads from: 1) CLAUDE_SKILLS_PAT env var, or 2) ~/.claude/secrets/skills-pat file
SECRETS_FILE="$HOME/.claude/secrets/skills-pat"
if [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  GITHUB_PAT="$CLAUDE_SKILLS_PAT"
elif [ -f "$SECRETS_FILE" ]; then
  GITHUB_PAT="$(tr -d '[:space:]' < "$SECRETS_FILE")"
else
  echo "Error: No PAT found. Set CLAUDE_SKILLS_PAT env var or create $SECRETS_FILE" >&2
  exit 1
fi
SKILLS_REPO="https://${GITHUB_PAT}@github.com/dsonders/claude-skills.git"
SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$HOME/.claude"

# Check if valid git repo exists
if [ -d "$SKILLS_DIR/.git" ]; then
  # Already cloned - pull latest
  cd "$SKILLS_DIR"
  if ! git pull --rebase origin main 2>&1; then
    # Pull failed, try fresh clone
    cd "$HOME/.claude"
    rm -rf "$SKILLS_DIR"
    git clone "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Skills clone failed"
  fi
elif [ -d "$SKILLS_DIR" ]; then
  # Directory exists but not a git repo - remove and clone fresh
  rm -rf "$SKILLS_DIR"
  git clone "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Skills clone failed"
else
  # Fresh clone
  git clone "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Skills clone failed"
fi
