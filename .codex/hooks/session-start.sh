#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Set up PAT for fetch-global-skills hook
SECRETS_FILE="$HOME/.claude/secrets/skills-pat"
if [ ! -f "$SECRETS_FILE" ] && [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  mkdir -p "$(dirname "$SECRETS_FILE")"
  echo "$CLAUDE_SKILLS_PAT" > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
fi

# Install project dependencies
cd "$CLAUDE_PROJECT_DIR"
npm install
