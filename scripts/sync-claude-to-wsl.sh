#!/usr/bin/env bash
# Sync Claude Code config from Windows to WSL so both environments match.
# Run this script from WSL. Windows drives are under /mnt/c/.

set -e

# Windows .claude path: override with WINDOWS_CLAUDE_DIR or first argument
WINDOWS_CLAUDE="${WINDOWS_CLAUDE_DIR:-${1:-/mnt/c/Users/jswil/.claude}}"
WSL_CLAUDE="${HOME}/.claude"

usage() {
  cat <<'EOF'
Usage: sync-claude-to-wsl.sh [approach] [windows_claude_path]

  approach:  approach1 | approach2 (default: approach1)
  windows_claude_path: Windows .claude dir from WSL (default: /mnt/c/Users/jswil/.claude)

  approach1  Copy only customized files (.claude.json, settings.json, settings.local.json).
              Use after: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom
  approach2  Full copy of Windows ~/.claude into WSL ~/.claude (exact clone).

Environment:
  WINDOWS_CLAUDE_DIR  Same as windows_claude_path (e.g. /mnt/c/Users/YOUR_USER/.claude)

Examples:
  ./sync-claude-to-wsl.sh
  ./sync-claude-to-wsl.sh approach1
  ./sync-claude-to-wsl.sh approach2 /mnt/c/Users/jswil/.claude
  WINDOWS_CLAUDE_DIR=/mnt/c/Users/jane/.claude ./sync-claude-to-wsl.sh approach1
EOF
}

if [[ "${1:-}" == "help" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

APPROACH="${1:-approach1}"
if [[ "$APPROACH" == "approach1" || "$APPROACH" == "approach2" ]]; then
  shift || true
  if [[ -n "${1:-}" ]]; then
    WINDOWS_CLAUDE="$1"
  fi
else
  # First arg is path
  if [[ -n "$APPROACH" && "$APPROACH" != "approach1" && "$APPROACH" != "approach2" ]]; then
    WINDOWS_CLAUDE="$APPROACH"
  fi
  APPROACH="approach1"
fi

if [[ ! -d "$WINDOWS_CLAUDE" ]]; then
  echo "Error: Windows .claude directory not found: $WINDOWS_CLAUDE" >&2
  echo "Set WINDOWS_CLAUDE_DIR or pass the path (e.g. /mnt/c/Users/YourUser/.claude)" >&2
  exit 1
fi

mkdir -p "$WSL_CLAUDE"

if [[ "$APPROACH" == "approach1" ]]; then
  echo "Syncing customized files only (approach1) from $WINDOWS_CLAUDE to $WSL_CLAUDE"
  for f in .claude.json settings.json settings.local.json; do
    if [[ -f "$WINDOWS_CLAUDE/$f" ]]; then
      cp "$WINDOWS_CLAUDE/$f" "$WSL_CLAUDE/$f"
      echo "  copied $f"
    fi
  done
  echo "Done. Ensure you have run: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom"
elif [[ "$APPROACH" == "approach2" ]]; then
  echo "Full sync (approach2) from $WINDOWS_CLAUDE to $WSL_CLAUDE"
  if command -v rsync &>/dev/null; then
    rsync -av --delete "$WINDOWS_CLAUDE/" "$WSL_CLAUDE/"
  else
    rm -rf "$WSL_CLAUDE"
    cp -r "$WINDOWS_CLAUDE" "$WSL_CLAUDE"
  fi
  echo "Fixing line endings (CRLF -> LF) for .md and .json..."
  find "$WSL_CLAUDE" -type f \( -name '*.md' -o -name '*.json' \) -exec sed -i 's/\r$//' {} \;
  echo "Done."
fi
