#!/bin/bash
# Claude Code Statusline
# Line 1: ctx: <pct>% (<used>/<total>) | <git-branch> | <model>
# Line 2: permission mode indicator

# Read JSON from stdin
json=$(cat)

# Require jq
if ! command -v jq &> /dev/null; then
    printf "ctx: N/A (jq required)\n"
    exit 0
fi

# --- ANSI colors (using printf-safe octal escapes) ---
GREEN='\033[32m'
GRAY='\033[90m'
CYAN='\033[36m'
RED='\033[91m'
RESET='\033[0m'

# --- Parse JSON fields ---
used_pct=$(echo "$json" | jq -r '.context_window.used_percentage // empty' 2>/dev/null)
total_input=$(echo "$json" | jq -r '.context_window.total_input_tokens // empty' 2>/dev/null)
ctx_size=$(echo "$json" | jq -r '.context_window.context_window_size // empty' 2>/dev/null)
model_name=$(echo "$json" | jq -r '.model.display_name // .model.id // "unknown"' 2>/dev/null)

# --- Git branch (walk up from CWD to find .git/HEAD; avoids spawning git for speed) ---
git_branch="no-branch"
dir="$PWD"
while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    if [ -f "$dir/.git/HEAD" ]; then
        ref=$(cat "$dir/.git/HEAD")
        if [[ "$ref" == ref:* ]]; then
            git_branch="${ref#ref: refs/heads/}"
        else
            git_branch="${ref:0:7}"
        fi
        break
    fi
    dir=$(dirname "$dir")
done

# --- Format token counts as K ---
fmt_k() {
    local n="$1"
    if [[ "$n" =~ ^[0-9]+$ ]] && [ "$n" -ge 1000 ]; then
        echo "$((n / 1000))K"
    else
        echo "${n:-?}"
    fi
}
used_fmt=$(fmt_k "$total_input")
total_fmt=$(fmt_k "$ctx_size")

# --- Build Line 1 ---
if [[ "$used_pct" =~ ^[0-9] ]]; then
    pct_int=$(printf '%.0f' "$used_pct")
    printf "${GRAY}ctx: ${GREEN}${pct_int}%%${GRAY} (${used_fmt}/${total_fmt}) | ${CYAN}${git_branch}${GRAY} | ${model_name}${RESET}\n"
else
    # No context data yet (before first API call)
    printf "${GRAY}ctx: --% (--/$(fmt_k "$ctx_size")) | ${CYAN}${git_branch}${GRAY} | ${model_name}${RESET}\n"
fi

# --- Line 2: permission mode ---
# Claude Code does not expose permission mode in the JSON, so we describe the
# current mode by checking for bypass-permissions flags in the process list.
# The displayed text mirrors what Claude Code itself shows in the UI.
if pgrep -f -- "--dangerously-skip-permissions" > /dev/null 2>&1; then
    perm_label="bypass permissions on (shift+tab to cycle)"
else
    perm_label="default permissions (shift+tab to cycle)"
fi
printf "${RED}▶▶ ${perm_label}${RESET}\n"
