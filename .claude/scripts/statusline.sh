#!/bin/bash
# Claude Code Statusline - Shows context window usage
# Reads JSON from stdin and displays formatted status

# Read JSON from stdin
json=$(cat)

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "ctx: N/A (jq required)"
    exit 0
fi

# Parse context window info from JSON
# The JSON structure includes context_window with token information
context_used=$(echo "$json" | jq -r '.context_window.current_usage.input_tokens // .cwd_tokens // 0' 2>/dev/null)
context_max=$(echo "$json" | jq -r '.context_window.context_window_size // 200000' 2>/dev/null)
model=$(echo "$json" | jq -r '.model // "unknown"' 2>/dev/null)

# Calculate percentage if we have valid numbers
if [[ "$context_used" =~ ^[0-9]+$ ]] && [[ "$context_max" =~ ^[0-9]+$ ]] && [ "$context_max" -gt 0 ]; then
    percentage=$((context_used * 100 / context_max))

    # Format token count for readability (K for thousands)
    if [ "$context_used" -ge 1000 ]; then
        used_formatted="$((context_used / 1000))K"
    else
        used_formatted="$context_used"
    fi

    if [ "$context_max" -ge 1000 ]; then
        max_formatted="$((context_max / 1000))K"
    else
        max_formatted="$context_max"
    fi

    # Color coding based on usage
    # Green < 50%, Yellow 50-80%, Red > 80%
    if [ "$percentage" -lt 50 ]; then
        color="\033[32m"  # Green
    elif [ "$percentage" -lt 80 ]; then
        color="\033[33m"  # Yellow
    else
        color="\033[31m"  # Red
    fi
    reset="\033[0m"

    # Build status line
    echo -e "${color}ctx: ${percentage}%${reset} (${used_formatted}/${max_formatted}) | ${model}"
else
    # Fallback if parsing fails - show model at minimum
    if [ "$model" != "null" ] && [ "$model" != "unknown" ]; then
        echo "ctx: -- | ${model}"
    else
        echo "ctx: --"
    fi
fi
