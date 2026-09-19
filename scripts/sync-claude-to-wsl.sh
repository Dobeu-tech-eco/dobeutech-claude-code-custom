#!/usr/bin/env bash
# Sync Claude Code config from Windows to WSL so both environments match.
# Run this script from WSL. Windows drives are under /mnt/c/.

set -e

# Resolve the Windows user profile without hardcoding a username.
# Precedence: WINDOWS_CLAUDE_DIR env > explicit path arg > WINDOWS_USER env > auto-detect.
#
# Auto-detection order:
#   1. cmd.exe echo %USERNAME%  - authoritative, works even when the WSL and Windows
#      usernames differ (e.g. WSL "jeremy" vs Windows "JeremyWilliams").
#   2. $USER / $(whoami)        - fallback when cmd.exe is unreachable (interop disabled).
#   3. Sole directory under /mnt/c/Users that contains a .claude dir.
detect_windows_user() {
  local u=""

  # 1. Ask Windows directly. 2>/dev/null swallows the "UNC path not supported" chatter.
  if command -v cmd.exe &>/dev/null; then
    u="$(cd /mnt/c 2>/dev/null && cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r\n')"
  fi

  # 2. Fall back to the WSL username (correct only when the two names match).
  if [[ -z "$u" ]]; then
    u="${USER:-$(whoami 2>/dev/null)}"
  fi

  # 3. If that profile has no .claude, look for exactly one candidate under /mnt/c/Users.
  if [[ -n "$u" && ! -d "/mnt/c/Users/$u/.claude" ]]; then
    local matches=()
    for d in /mnt/c/Users/*/.claude; do
      [[ -d "$d" ]] || continue
      local owner
      owner="$(basename "$(dirname "$d")")"
      case "$owner" in
        Public|Default|"Default User"|"All Users") continue ;;
      esac
      matches+=("$owner")
    done
    if [[ ${#matches[@]} -eq 1 ]]; then
      u="${matches[0]}"
    fi
  fi

  printf '%s' "$u"
}

WSL_CLAUDE="${HOME}/.claude"

usage() {
  cat <<'EOF'
Usage: sync-claude-to-wsl.sh [approach] [windows_claude_path]

  approach:  approach1 | approach2 (default: approach1)
  windows_claude_path: Windows .claude dir as seen from WSL.
                       Default: auto-detected from your Windows username
                       (/mnt/c/Users/<detected>/.claude)

  approach1  Copy only customized files (.claude.json, settings.json, settings.local.json).
              Use after: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom
  approach2  Full copy of Windows ~/.claude into WSL ~/.claude (exact clone).

Environment:
  WINDOWS_CLAUDE_DIR  Full path to the Windows .claude dir. Highest precedence.
                      e.g. /mnt/c/Users/YOUR_USER/.claude
  WINDOWS_USER        Just the Windows username; the path is derived from it.
                      Use this when auto-detection picks the wrong profile.

Examples:
  ./sync-claude-to-wsl.sh
  ./sync-claude-to-wsl.sh approach1
  ./sync-claude-to-wsl.sh approach2 /mnt/c/Users/YourUser/.claude
  WINDOWS_USER=JeremyWilliams ./sync-claude-to-wsl.sh approach1
  WINDOWS_CLAUDE_DIR=/mnt/c/Users/jane/.claude ./sync-claude-to-wsl.sh approach1
EOF
}

if [[ "${1:-}" == "help" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

# --- Parse args: [approach] [path], where either may be omitted ---
APPROACH="approach1"
PATH_ARG=""

if [[ "${1:-}" == "approach1" || "${1:-}" == "approach2" ]]; then
  APPROACH="$1"
  PATH_ARG="${2:-}"
elif [[ -n "${1:-}" ]]; then
  # First arg is not an approach, so treat it as the path.
  PATH_ARG="$1"
fi

# --- Resolve the Windows .claude dir, highest precedence first ---
if [[ -n "$PATH_ARG" ]]; then
  WINDOWS_CLAUDE="$PATH_ARG"
elif [[ -n "${WINDOWS_CLAUDE_DIR:-}" ]]; then
  WINDOWS_CLAUDE="$WINDOWS_CLAUDE_DIR"
else
  WINDOWS_USER="${WINDOWS_USER:-$(detect_windows_user)}"
  if [[ -z "$WINDOWS_USER" ]]; then
    echo "Error: could not auto-detect your Windows username." >&2
    echo "Set WINDOWS_USER=YourWindowsUser, or pass the path explicitly:" >&2
    echo "  ./sync-claude-to-wsl.sh $APPROACH /mnt/c/Users/YourUser/.claude" >&2
    exit 1
  fi
  WINDOWS_CLAUDE="/mnt/c/Users/${WINDOWS_USER}/.claude"
  echo "Detected Windows user: ${WINDOWS_USER}"
fi

if [[ ! -d "$WINDOWS_CLAUDE" ]]; then
  echo "Error: Windows .claude directory not found: $WINDOWS_CLAUDE" >&2
  echo "Set WINDOWS_CLAUDE_DIR or WINDOWS_USER, or pass the path:" >&2
  echo "  ./sync-claude-to-wsl.sh $APPROACH /mnt/c/Users/YourUser/.claude" >&2
  exit 1
fi

echo "Windows config: $WINDOWS_CLAUDE"

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
