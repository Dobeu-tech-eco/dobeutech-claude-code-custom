# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

Production-ready Claude Code configurations (agents, skills, commands, rules, hooks, MCP configs) distributed as an npm package (`@jwdobeutechsolutions/dobeutech-claude-code-custom`). Originally forked from `everything-claude-code`. Users install via npm and configs are copied to `~/.claude/` (global) or `./.claude/` (local).

## Development Commands

```bash
# Test the install script locally (simulates what happens on npm install)
node scripts/install.js

# Test the CLI tool
node bin/claude-config.js status
node bin/claude-config.js list

# Publish a new version (bump version in package.json first)
npm publish --access public
```

There is no build step, test suite, or linter. The two JS files (`scripts/install.js` and `bin/claude-config.js`) are the only code. Everything else is markdown and JSON config. To verify changes, run `node scripts/install.js` and confirm configs land correctly in the target directory, then test in a real Claude Code session.

## Architecture

### npm Package & Install System

Zero runtime dependencies. Two key scripts:

- **`scripts/install.js`** — Runs as a `postinstall` hook. Detects global vs local install scope (`npm_config_global` env var or path heuristics), determines target directory (`~/.claude/` for global, `./.claude/` for local), then copies config directories (`agents/`, `skills/`, `commands/`, `rules/`, `templates/`, `docs/`). It also **merges** JSON files rather than overwriting them (see Merge Logic below).

- **`bin/claude-config.js`** — CLI registered as the `claude-config` bin. Commands: `status`, `list`, `update`, `help`.

**Important `getTargetDir()` difference:** `install.js` uses `npm_config_global` env var to decide global (`~/.claude/`) vs local (`./.claude/`). `claude-config.js` instead checks if `.claude/` exists in CWD first, falling back to `~/.claude/`. This means `claude-config status` run inside a project with a local `.claude/` will report local state, even if the package was installed globally.

### Merge Logic (critical path)

The `mergeJson()` function in `install.js` handles two distinct merge strategies:

- **Hooks** (`hooks/hooks.json` → `settings.json`): Deduplicates hooks by `matcher` string within each category (`PreToolUse`, `PostToolUse`, `Stop`). Existing hooks with the same matcher are preserved, not overwritten.
- **MCP Servers** (`mcp-configs/mcp-servers.json` → `.claude.json`): For new servers, copies the whole config. For existing servers, preserves user's `env` values (API keys) while merging other fields. The spread order matters: source config first, then existing overrides, with `env` handled separately.

**Known issue:** The MCP merge path mutates `serverConfig.env` on the source object in-place (`install.js:183`). This is safe in practice since `install()` reads source data fresh from disk, but it would be a bug if `mergeJson` were called multiple times with the same source object.

### Config Types

**Agents** (`agents/*.md`) — Subagent definitions with YAML frontmatter (`name`, `description`, `tools`, `model`). Used with Claude Code's Task tool via `subagent_type=<agent-name>`.

**Skills** (`skills/`) — Either single `.md` files or directories with a `SKILL.md` entry point plus reference files.

**Commands** (`commands/*.md`) — Slash commands with YAML frontmatter (`description`). Invoked via `/<command-name>`.

**Rules** (`rules/*.md`) — Always-active guidelines. Modular by topic (security, coding-style, testing, git-workflow, agents, performance, patterns, hooks).

**Hooks** (`hooks/hooks.json`) — Three event types: `PreToolUse` (can block via exit 1), `PostToolUse` (analyze results), `Stop` (session-end checks). Each hook's `command` field is a bash script that reads tool context from stdin via `jq`. Matchers use Claude Code's expression syntax: `tool == "Bash" && tool_input.command matches "regex"`.

**MCP Configs** (`mcp-configs/mcp-servers.json`) — MCP server definitions with `YOUR_*_HERE` placeholders. Keep under 10 MCPs enabled per project to avoid context window shrinkage (200k → 70k with too many tools).

### Other Files

- **`.claude-plugin/plugin.json`** — Plugin manifest listing all agents, skills, commands, and MCP servers by name. Must be kept in sync manually when adding/removing components.
- **`.cursor/rules/*.mdc`** — Cursor-specific rule files that mirror `rules/*.md` content. `session-init.mdc` has a dynamic discovery protocol for MCP servers and tools at Cursor session start.
- **`examples/`** — Example `CLAUDE.md`, user-level config, and statusline config for reference.
- **`templates/` and `docs/`** — Referenced in `install.js` `dirsToCopy` and `package.json` `files` array but **do not exist yet**. `install.js` skips them silently (existence check at line 229). Creating these directories with content will automatically include them in the install flow.

## Contributing

- **Naming**: lowercase with hyphens, descriptive (`tdd-workflow.md` not `workflow.md`), filename matches agent/skill name
- **Agents**: must have frontmatter with `name`, `description`, `tools`, `model`
- **Skills**: include "When to Use" and "How It Works" sections
- **Commands**: must have frontmatter with `description`
- **Hooks**: include `description` field, test matchers before submitting
- **Plugin manifest**: update `.claude-plugin/plugin.json` arrays when adding or removing any component
- **Portability**: never commit absolute user-specific paths (e.g. `C:\Users\...`). Use relative paths or `~`
- **Credentials**: use `YOUR_API_KEY_HERE` style placeholders, never real values

## Version Management

Version is in `package.json`. Bump before each `npm publish`. Published to the public npm registry under the `@jwdobeutechsolutions` scope.
