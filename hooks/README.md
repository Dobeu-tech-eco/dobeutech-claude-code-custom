# Hooks

Windows / PowerShell hooks. Each script reads the Claude Code hook payload as JSON on **stdin**
and does its own filtering on `.tool_name` / `.tool_input.command` / `.tool_input.file_path`.

| Script | Event | Matcher | Behavior |
| --- | --- | --- | --- |
| `pre-commit-secret-scan.ps1` | `PreToolUse` | `Bash` | Exits 0 silently unless the command is a `git commit`. On a commit, scans staged files for secret patterns and high-entropy key prefixes (`ghp_`, `sk-proj-`, `sk-ant-`, `ntn_`, `tvly-`). **Blocking** (`exit 1`) on a hit. |
| `post-edit-format.ps1` | `PostToolUse` | `Edit\|Write` | For `.ts/.tsx/.js/.jsx` only: runs `prettier --write`, then `npx tsc --noEmit` if a `tsconfig.json` exists at the nearest package root. **Never blocks** (always `exit 0`). |
| `post-edit-console-log.ps1` | `PostToolUse` | `Edit\|Write` | For `.ts/.tsx/.js/.jsx` only: warns on stderr with line numbers of any `console.log`. **Never blocks** (always `exit 0`). |

## Matcher syntax

A matcher is **a plain regex matched against the tool name** — `"Bash"`, `"Edit|Write"`. There is
no expression language and no access to `tool_input` from the matcher. Anything that looks like
`"tool == \"Bash\" && tool_input.command matches ..."` is invalid and will never fire. See
`legacy/README.md` for the previous bundle that made exactly that mistake.

## Requirements

- **PowerShell 7 (`pwsh`) must be on PATH.** These hooks invoke `pwsh -NoProfile -File ...`.
  Windows PowerShell 5.1 (`powershell.exe`) is *not* a substitute — the scripts are not tested
  against it. If `pwsh` is absent, every hook fails to launch.
- `prettier` / `npx tsc` are resolved per-project by `post-edit-format.ps1`; it degrades to a
  no-op when they are absent rather than failing.

---

## ⚠️ Path portability — the installer MUST rewrite these paths

`hooks/hooks.json` intentionally ships a **placeholder**, not a real path:

```json
"command": "pwsh -NoProfile -File ${CLAUDE_CONFIG_DIR}/hooks/pre-commit-secret-scan.ps1"
```

`${CLAUDE_CONFIG_DIR}` is **not expanded by Claude Code** and is **not expanded by
`mergeHooks()`**. It is a token that the installer is responsible for substituting at install
time. Two verified gaps in the current install path:

1. **`mergeHooks()` performs no path substitution.**
   `scripts/utils/merge-utils.js` → `mergeHooks()` splices the hook objects from `hooks.json`
   into `settings.json` **verbatim**, deduplicating only on the `matcher` string. Whatever string
   is in `command` is what lands in `settings.json`. If the installer does not rewrite
   `${CLAUDE_CONFIG_DIR}` to the resolved target directory (`~/.claude`, or the project `.claude/`
   for a local install), the hooks resolve to a literal nonexistent path and silently never run.

2. **The `hooks/` directory is never copied to the target.**
   `scripts/generators/claude-generator.js` copies only
   `['agents', 'skills', 'commands', 'rules', 'templates', 'docs']`. `hooks/` is not in that list,
   so `*.ps1` never reaches `~/.claude/hooks/` — only `hooks/hooks.json` is read (in place, from
   the package dir) and merged. Even with correct path substitution, the scripts would not exist
   at the destination.

**Both must be fixed in the installer** (tracked in `MISSING_FEATURES.md`). The installer needs to:

- add `hooks` to the copied directories (or copy `hooks/*.ps1` explicitly), and
- substitute `${CLAUDE_CONFIG_DIR}` with the resolved target dir in every hook `command` string
  *before* handing the object to `mergeHooks()`.

Absolute paths are deliberately **not** shipped here: baking in
`C:/Users/<someone>/.claude/hooks/...` is what made previous configs stale, and it violates the
repo's portability rule in `CONTRIBUTING.md` ("never commit absolute user-specific paths").

### Manual install (until the installer is fixed)

Copy the scripts and write the paths yourself:

```powershell
Copy-Item hooks\*.ps1 "$HOME\.claude\hooks\" -Force
```

Then in `~/.claude/settings.json`, use the real absolute path — for example:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -NoProfile -File C:/Users/YOUR_USER/.claude/hooks/pre-commit-secret-scan.ps1"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -NoProfile -File C:/Users/YOUR_USER/.claude/hooks/post-edit-format.ps1"
          },
          {
            "type": "command",
            "command": "pwsh -NoProfile -File C:/Users/YOUR_USER/.claude/hooks/post-edit-console-log.ps1"
          }
        ]
      }
    ]
  }
}
```

Use forward slashes in the JSON. Absolute paths are correct *in your local `settings.json`* — they
are only forbidden in the committed repo.

## legacy/

`legacy/hooks.linux.json.reference` is the old, non-functional bash+`jq` bundle, preserved for
provenance. Do not reuse it. See `legacy/README.md`.
