#!/bin/bash
# Codex runs the SAME hook as Claude Code: the one copy in .claude/hooks.
# A separate copy here kept embedding the PAT in the skills remote URL after
# the .claude copy was fixed (see fetch-global-skills.sh beside this file).
#
# Put no logic here. Change .claude/hooks/push-global-skills.sh instead.
target="$(dirname "$0")/../../.claude/hooks/push-global-skills.sh"
[ -x "$target" ] || exit 0
exec "$target" "$@"
