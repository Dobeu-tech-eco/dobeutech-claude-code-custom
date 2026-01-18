# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a collection of production-ready Claude Code configurations including agents, skills, commands, rules, hooks, and MCP configurations. These configs are meant to be copied to user's `~/.claude/` directory or project-specific locations.

**Not a development project** - This is a configuration repository with no build process, tests, or deployment pipeline.

## Repository Structure

```
everything-claude-code/
├── agents/           # Specialized subagents (planner, architect, tdd-guide, etc.)
├── skills/           # Workflow definitions and domain knowledge
├── commands/         # Slash commands (/tdd, /plan, /e2e, etc.)
├── rules/            # Always-follow guidelines (security, coding-style, testing, etc.)
├── hooks/            # Trigger-based automations (hooks.json)
├── mcp-configs/      # MCP server configurations (mcp-servers.json)
├── examples/         # Example CLAUDE.md files and statusline config
└── plugins/          # Plugin ecosystem documentation
```

## Key Concepts

### Agents (agents/)
Subagents with limited scope and specific tools. Format:
```markdown
---
name: agent-name
description: What it does
tools: Read, Grep, Glob, Bash
model: sonnet
---
Instructions here...
```

### Skills (skills/)
Workflow definitions and domain knowledge. Two formats:
- **Single file**: `coding-standards.md`, `backend-patterns.md`
- **Directory**: `tdd-workflow/SKILL.md`, `security-review/SKILL.md` (with optional reference files)

### Commands (commands/)
Slash commands that invoke workflows. Format:
```markdown
---
description: Brief description
---
# Command Name
Instructions...
```

### Rules (rules/)
Always-follow guidelines that apply across all work. Kept modular by topic (security, testing, git-workflow, etc.).

### Hooks (hooks/hooks.json)
Event-driven automations triggered by tool usage:
- **PreToolUse**: Runs before tool executes (can block)
- **PostToolUse**: Runs after tool completes (analyze results)
- **Stop**: Runs when session ends (final checks)

Matchers use JMESPath-like syntax to filter when hooks run. Each hook executes bash commands with stdin containing tool context (accessible via `jq`).

## Contributing Guidelines

When adding new configs:

**File Naming:**
- Use lowercase with hyphens: `python-reviewer.md`
- Be descriptive: `tdd-workflow.md` not `workflow.md`
- Match agent/skill name to filename

**Agent Format:**
- Include frontmatter with name, description, tools, model
- Keep focused on specific task
- Document when to use it

**Skill Format:**
- Include "When to Use" and "How It Works" sections
- Provide clear examples
- Keep actionable

**Rules Format:**
- Keep modular (one concern per file)
- Use clear examples
- Include checklist format when applicable

**Hooks:**
- Include description field
- Test matchers thoroughly
- Document what triggers the hook

**Security:**
- Never include API keys, tokens, or paths
- Use placeholder text: `YOUR_API_KEY_HERE`

## Installation Pattern

Users copy configs to their Claude directory:

```bash
# Copy all configs
cp agents/*.md ~/.claude/agents/
cp rules/*.md ~/.claude/rules/
cp commands/*.md ~/.claude/commands/
cp -r skills/* ~/.claude/skills/

# Or copy selectively
cp agents/planner.md ~/.claude/agents/
cp agents/tdd-guide.md ~/.claude/agents/
cp rules/security.md ~/.claude/rules/
```

For hooks, manually merge from `hooks/hooks.json` into `~/.claude/settings.json`:
- Copy the `"hooks"` object into your settings
- Adjust paths and commands as needed for your environment
- Test matchers thoroughly before enabling

For MCP servers, merge from `mcp-configs/mcp-servers.json` into `~/.claude.json`:
- Replace all `YOUR_*_HERE` placeholders with real API keys
- Enable only MCPs you need (see Context Window Management)

## Context Window Management

**Critical:** Don't enable all MCPs at once - context window shrinks from 200k to 70k with too many tools.

Guidelines:
- Configure 20-30 MCPs total
- Enable under 10 per project
- Keep under 80 tools active
- Use `disabledMcpServers` in project config

## Testing Configs

Before contributing:
1. Copy config to appropriate `~/.claude/` directory
2. Test with Claude Code in real scenarios
3. Verify hooks don't block normal operations
4. Confirm agents complete their tasks successfully

## Common Workflows

### Adding a New Agent
1. Create `agents/my-agent.md` with frontmatter (name, description, tools, model)
2. Write clear instructions defining agent's role and process
3. Test by copying to `~/.claude/agents/` and using Task tool with `subagent_type=my-agent`

### Adding a New Command
1. Create `commands/my-command.md` with frontmatter (description)
2. Write instructions that will be invoked when user types `/my-command`
3. Test by copying to `~/.claude/commands/` and running `/my-command`

### Adding a Hook
1. Add hook definition to `hooks/hooks.json`
2. Define matcher to filter when hook runs
3. Write bash command that processes stdin (tool context)
4. Test thoroughly to ensure it doesn't block normal operations

### Validating Configs
Before committing:
- Copy config to appropriate `~/.claude/` directory
- Test in real Claude Code scenarios
- Verify agents complete tasks successfully
- Confirm hooks don't interfere with normal workflow
- Check that matchers filter correctly

## Important Notes

- This repo has no code to run, build, or test
- No package.json, no dependencies, no deployment
- Focus is on config quality and documentation
- See CONTRIBUTING.md for detailed contribution process
- Read the [full guide](https://x.com/affaanmustafa/status/2012378465664745795) for usage philosophy
