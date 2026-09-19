# Legacy hooks (preserved, NON-FUNCTIONAL)

`hooks.linux.json.reference` is the verbatim, pre-v2 hooks bundle that used to live at
`hooks/hooks.json`. It is kept **for reference and provenance only**.

It is **not valid Claude Code configuration** and must never be copied back into
`hooks/hooks.json` or into any `settings.json`. It is broken in two independent ways.

## Failure mode 1 — invalid matcher syntax

Every entry uses an expression-language matcher:

```json
"matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run dev|pnpm( run)? dev)\""
```

Claude Code matchers are **a plain regex tested against the tool name** — `"Bash"`,
`"Edit|Write"`, `"Read"`. There is no expression language, no `tool ==`, no `matches`, and no
access to `tool_input` from the matcher. Because the literal string
`tool == "Bash" && ...` never regex-matches any tool name, **none of these hooks ever fired, on
any OS.** They were dead config, not merely Linux-only config.

Filtering on command content or file path is done *inside* the hook script, by parsing the hook
payload JSON that Claude Code writes to the script's stdin (`.tool_name`,
`.tool_input.command`, `.tool_input.file_path`).

## Failure mode 2 — `#!/bin/bash` + `jq` bodies

Every hook `command` is an inline bash script that shells out to `jq`. Neither `bash` nor `jq` is
on the default PATH of a stock Windows 11 machine, which is the primary target of this repo. Even
where bash exists, the bodies below are actively hostile.

## Hooks deliberately DROPPED, not ported

Three hooks from this bundle were removed on purpose. They are not "todo — port later"; they are
rejected designs.

1. **tmux dev-server blocker** — unconditionally `exit 1`s on any
   `npm run dev` / `pnpm dev` / `yarn dev` / `bun run dev` and demands the command be relaunched
   under `tmux`. It does not even check whether tmux is present or whether `$TMUX` is already set —
   it always blocks. tmux does not exist on Windows, so this bricks every dev server with no
   escape hatch.

2. **`read -r` git-push pause** — on `git push`, prints a "press Enter to continue" prompt and then
   calls a blocking `read -r` to wait for an interactive keypress. Hooks run non-interactively with
   no TTY attached, so this hangs the session indefinitely — a guaranteed deadlock in any agent or
   CI context.

3. **block-all-`.md`/`.txt`-writes** — blocks `Write` to *any* `.md` or `.txt` file whose name is
   not README / CLAUDE / AGENTS / CONTRIBUTING. Far too broad: it blocks legitimate docs, ADRs,
   notes, changelogs, and test fixtures.

## What survived

The salvageable intent — secret scanning before commit, prettier/tsc after edit, `console.log`
warnings — was rewritten from scratch as the PowerShell hooks in the parent directory. See
`../README.md`.
