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
Workflow definitions and domain knowledge. Can be single `.md` files or directories with `SKILL.md` and references.

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
Event-driven automations using `PreToolUse`, `PostToolUse`, and `Stop` hooks. Use bash commands with jq for processing.

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
cp agents/*.md ~/.claude/agents/
cp rules/*.md ~/.claude/rules/
cp commands/*.md ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
```

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

## Important Notes

- This repo has no code to run, build, or test
- No package.json, no dependencies, no deployment
- Focus is on config quality and documentation
- See CONTRIBUTING.md for detailed contribution process
- Read the [full guide](https://x.com/affaanmustafa/status/2012378465664745795) for usage philosophy
