#!/bin/bash
# Codex runs the SAME hook as Claude Code: the one copy in .claude/hooks.
#
# This file used to be a separate copy of the skills fetch. When the .claude
# copy was fixed on 2026-09-15 to stop embedding the PAT in the skills remote
# URL, this one was missed and kept writing the token into
# ~/.claude/skills/.git/config on every Codex session (found 2026-09-30). It
# also deleted the local clone whenever a pull failed.
#
# Put no logic here. Change .claude/hooks/fetch-global-skills.sh instead.
target="$(dirname "$0")/../../.claude/hooks/fetch-global-skills.sh"
[ -x "$target" ] || exit 0
exec "$target" "$@"
