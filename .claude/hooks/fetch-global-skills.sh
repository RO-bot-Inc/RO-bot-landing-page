#!/bin/bash
# Fetch global skills from dsonders/claude-skills on SessionStart — WEB ONLY.
# Terminal and the Mac app use the global ~/.claude/hooks/fetch-global-skills.sh (SSH).
#
# Auth: the token reaches git through a credential helper that reads an env var.
# It is NEVER put in the remote URL. An https://PAT@github.com/... URL leaks the
# token to `git remote -v`, to .git/config, and to every later session that opens
# the same clone (that is how the PAT was exposed on 2026-07-02, and this hook was
# still re-embedding it until 2026-09-15). The remote stays a plain https URL.
#
# Failure policy: a pull that fails WARNS and keeps the local copy. It never
# deletes a real clone — that would wipe local skills on an auth or network blip.

set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

SKILLS_REPO="https://github.com/dsonders/claude-skills.git"
SKILLS_DIR="$HOME/.claude/skills"
SECRETS_FILE="$HOME/.claude/secrets/skills-pat"

# Lockfile prevents two SessionStart hooks racing on the same clone.
# flock is Linux-only; without it, proceed unlocked rather than skip the fetch.
if command -v flock >/dev/null 2>&1; then
  exec 9>"$HOME/.claude/.skills-fetch.lock"
  if ! flock -w 10 9; then
    echo "Warning: Could not acquire skills fetch lock after 10s" >&2
    exit 0
  fi
fi

if [ -n "${CLAUDE_SKILLS_PAT:-}" ]; then
  GIT_SKILLS_PAT="$CLAUDE_SKILLS_PAT"
elif [ -f "$SECRETS_FILE" ]; then
  GIT_SKILLS_PAT="$(tr -d '[:space:]' < "$SECRETS_FILE")"
else
  echo "Warning: No skills PAT (CLAUDE_SKILLS_PAT or $SECRETS_FILE) — skills not fetched" >&2
  exit 0
fi
export GIT_SKILLS_PAT
export GIT_TERMINAL_PROMPT=0

# git asks the helper for credentials; the helper answers from the env var, so the
# token is never on the command line, in `ps`, or on disk. The empty first helper
# clears any inherited helper list so only this one answers.
CRED_HELPER='!f() { printf "username=x-access-token\npassword=%s\n" "$GIT_SKILLS_PAT"; }; f'
git_auth() { git -c credential.helper= -c "credential.helper=$CRED_HELPER" "$@"; }

mkdir -p "$HOME/.claude"

if [ -d "$SKILLS_DIR/.git" ]; then
  cd "$SKILLS_DIR"
  git remote set-url origin "$SKILLS_REPO" 2>/dev/null || true
  git_auth pull --rebase origin main >/dev/null 2>&1 \
    || echo "Warning: Skills pull failed — kept local copy" >&2
elif [ -d "$SKILLS_DIR" ]; then
  # A directory that is not a clone: move it aside rather than delete it.
  mv "$SKILLS_DIR" "$SKILLS_DIR.not-a-clone.$(date +%s)"
  git_auth clone --quiet "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Warning: Skills clone failed" >&2
else
  git_auth clone --quiet "$SKILLS_REPO" "$SKILLS_DIR" 2>&1 || echo "Warning: Skills clone failed" >&2
fi
