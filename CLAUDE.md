# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

A collection of production-ready Claude Code configurations (agents, skills, commands, rules, hooks, MCP configs) distributed as an npm package (`@jwdobeutechsolutions/dobeutech-claude-code-custom`). Users install via npm and configs are copied to `~/.claude/` (global) or `./.claude/` (local).

## Architecture

### npm Package & Install System

The repo is an npm package with zero runtime dependencies. The two key scripts:

- **`scripts/install.js`** — Runs as a `postinstall` hook on `npm install`. Detects global vs local install scope (`npm_config_global` env var or path heuristics), determines the target directory (`~/.claude/` for global, `./.claude/` for local), then copies all config directories (`agents/`, `skills/`, `commands/`, `rules/`, `templates/`, `docs/`). It also **merges** `hooks/hooks.json` into `settings.json` and `mcp-configs/mcp-servers.json` into `.claude.json`, preserving existing user API keys and hooks (deduplicates by matcher string).

- **`bin/claude-config.js`** — CLI tool registered as the `claude-config` bin. Commands: `status` (version + component counts), `list` (enumerate all installed agents/skills/commands/rules), `update` (npm update to latest), `help`. Uses the same target directory detection as the install script.

### Config Types

**Agents** (`agents/*.md`) — Subagent definitions with YAML frontmatter (`name`, `description`, `tools`, `model`). Used with Claude Code's Task tool via `subagent_type=<agent-name>`.

**Skills** (`skills/`) — Workflow and domain knowledge. Either single `.md` files or directories with a `SKILL.md` entry point plus reference files.

**Commands** (`commands/*.md`) — Slash commands with YAML frontmatter (`description`). Invoked by users typing `/<command-name>` in Claude Code.

**Rules** (`rules/*.md`) — Always-active guidelines. Modular by topic (security, coding-style, testing, git-workflow, agents, performance, patterns, hooks).

**Hooks** (`hooks/hooks.json`) — Event-driven automations in Claude Code settings format. Three event types: `PreToolUse` (can block via exit 1), `PostToolUse` (analyze results), `Stop` (session-end checks). Matchers use JMESPath-like expressions. Each hook's `command` field is a bash script that reads tool context from stdin via `jq`.

**MCP Configs** (`mcp-configs/mcp-servers.json`) — MCP server definitions with `YOUR_*_HERE` placeholders for API keys. Critical: keep under 10 MCPs enabled per project to avoid context window shrinkage (200k → 70k with too many tools).

### Cursor Integration

`.cursor/rules/session-init.mdc` defines a Cursor session init protocol that discovers MCP servers, tools, plugins, and skills at the start of each session. This is Cursor-specific and separate from the Claude Code configs.

## Contributing

- **Naming**: lowercase with hyphens, descriptive (`tdd-workflow.md` not `workflow.md`), filename matches agent/skill name
- **Agents**: must have frontmatter with `name`, `description`, `tools`, `model`
- **Skills**: include "When to Use" and "How It Works" sections
- **Commands**: must have frontmatter with `description`
- **Hooks**: include `description` field, test matchers before submitting
- **Security**: use `YOUR_API_KEY_HERE` style placeholders, never real credentials
- **Testing**: copy config to `~/.claude/`, verify in real Claude Code sessions before submitting

## Version Management

Version is in `package.json` (currently 1.0.3). Bump the version before each `npm publish`. The package is published to the public npm registry under the `@jwdobeutechsolutions` scope.
