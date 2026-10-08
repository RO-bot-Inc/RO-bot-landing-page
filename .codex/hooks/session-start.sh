#!/bin/bash
# Codex runs the SAME hook as Claude Code: the one copy in .claude/hooks.
# Put no logic here. Change .claude/hooks/session-start.sh instead.
target="$(dirname "$0")/../../.claude/hooks/session-start.sh"
[ -x "$target" ] || exit 0
exec "$target" "$@"
