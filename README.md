# Everything Claude Code

**The complete collection of Claude Code configs from an Anthropic hackathon winner.**

This repo contains production-ready agents, skills, hooks, commands, rules, and MCP configurations that I use daily with Claude Code. These configs evolved over 10+ months of intensive use building real products.

---

## Read the Full Guide First

**Before diving into these configs, read the complete guide on X:**


<img width="592" height="445" alt="image" src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" />


**[The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)**



The guide explains:
- What each config type does and when to use it
- How to structure your Claude Code setup
- Context window management (critical for performance)
- Parallel workflows and advanced techniques
- The philosophy behind these configs

**This repo is configs only! Tips, tricks and more examples are in my X articles and videos (links will be appended to this readme as it evolves).**

---

## What's Inside

```
everything-claude-code/
|-- agents/           # Specialized subagents for delegation (20 agents)
|   |-- planner.md           # Feature implementation planning
|   |-- architect.md         # System design decisions
|   |-- tdd-guide.md         # Test-driven development
|   |-- code-reviewer.md     # Quality and security review
|   |-- security-reviewer.md # Vulnerability analysis
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E testing
|   |-- refactor-cleaner.md  # Dead code cleanup
|   |-- doc-updater.md       # Documentation sync
|   |-- api-designer.md      # API design and OpenAPI specs
|   |-- database-migrator.md # Database migration management
|   |-- integration-tester.md # Integration testing
|   |-- fullstack-architect.md # Full-stack architecture
|   |-- deployment-manager.md # Deployment automation
|   |-- ci-cd-generator.md    # CI/CD pipeline creation
|   |-- infrastructure-engineer.md # Infrastructure as Code
|   |-- docker-specialist.md  # Containerization
|   |-- unit-test-generator.md # Unit test generation
|   |-- performance-tester.md # Performance analysis
|   |-- accessibility-auditor.md # Accessibility compliance
|
|-- skills/           # Workflow definitions and domain knowledge (17 skills)
|   |-- coding-standards.md         # Language best practices
|   |-- backend-patterns.md         # API, database, caching patterns
|   |-- frontend-patterns.md        # React, Next.js patterns
|   |-- project-guidelines-example.md # Example project-specific skill
|   |-- tdd-workflow/               # TDD methodology
|   |-- security-review/            # Security checklist
|   |-- clickhouse-io.md            # ClickHouse analytics
|   |-- api-design-patterns.md     # REST, GraphQL, gRPC patterns
|   |-- database-patterns.md        # ORM, query optimization
|   |-- frontend-backend-integration.md # Integration patterns
|   |-- microservices-patterns.md   # Microservices architecture
|   |-- deployment-strategies.md    # Blue-green, canary, rolling
|   |-- ci-cd-patterns.md           # CI/CD pipeline patterns
|   |-- infrastructure-patterns.md   # Infrastructure as Code
|   |-- api-documentation.md        # API documentation patterns
|   |-- technical-writing.md        # Technical writing patterns
|   |-- architecture-diagrams.md   # Architecture visualization
|   |-- memory-management.md        # Memory persistence patterns
|
|-- commands/         # Slash commands for quick execution (19 commands)
|   |-- tdd.md              # /tdd - Test-driven development
|   |-- plan.md             # /plan - Implementation planning
|   |-- e2e.md              # /e2e - E2E test generation
|   |-- code-review.md      # /code-review - Quality review
|   |-- build-fix.md        # /build-fix - Fix build errors
|   |-- refactor-clean.md   # /refactor-clean - Dead code removal
|   |-- test-coverage.md    # /test-coverage - Coverage analysis
|   |-- update-codemaps.md  # /update-codemaps - Refresh docs
|   |-- update-docs.md      # /update-docs - Sync documentation
|   |-- api-design.md       # /api-design - Generate API specs
|   |-- migrate-db.md       # /migrate-db - Database migrations
|   |-- test-integration.md # /test-integration - Integration tests
|   |-- deploy.md           # /deploy - Deployment workflow
|   |-- docs-api.md         # /docs-api - API documentation
|   |-- docs-arch.md        # /docs-arch - Architecture docs
|   |-- changelog.md        # /changelog - Generate changelog
|   |-- audit-security.md   # /audit-security - Security audit
|   |-- audit-performance.md # /audit-performance - Performance audit
|   |-- audit-accessibility.md # /audit-accessibility - A11y audit
|
|-- rules/            # Always-follow guidelines
|   |-- security.md         # Mandatory security checks
|   |-- coding-style.md     # Immutability, file organization
|   |-- testing.md          # TDD, 80% coverage requirement
|   |-- git-workflow.md     # Commit format, PR process
|   |-- agents.md           # When to delegate to subagents
|   |-- performance.md      # Model selection, context management
|   |-- patterns.md         # API response formats, hooks
|   |-- hooks.md            # Hook documentation
|
|-- hooks/            # Trigger-based automations
|   |-- hooks.json          # PreToolUse, PostToolUse, Stop hooks
|
|-- mcp-configs/      # MCP server configurations
|   |-- mcp-servers.json    # GitHub, Supabase, Vercel, Railway, mem0, etc.

|-- templates/        # Templates for creating components
|   |-- agent-template.md   # Agent creation template
|   |-- skill-template.md   # Skill creation template
|   |-- command-template.md # Command creation template
|   |-- hook-template.json  # Hook creation template
|   |-- mcp-template.json   # MCP config template

|-- docs/             # Comprehensive documentation
|   |-- INSTALLATION.md     # Installation guide
|   |-- QUICK_START.md      # Quick start guide
|   |-- AGENTS_GUIDE.md     # Agents usage guide
|   |-- SKILLS_GUIDE.md     # Skills creation guide
|   |-- COMMANDS_GUIDE.md   # Commands usage guide
|   |-- HOOKS_GUIDE.md      # Hooks creation guide
|   |-- MCP_GUIDE.md        # MCP configuration guide
|   |-- COMMUNITY_PLUGINS.md # Community plugins guide
|   |-- BEST_PRACTICES.md   # Best practices
|   |-- TROUBLESHOOTING.md  # Troubleshooting guide

|-- plugins/          # Plugin ecosystem documentation
|   |-- README.md           # Plugins, marketplaces, skills guide
|
|-- examples/         # Example configurations
    |-- CLAUDE.md           # Example project-level config
    |-- user-CLAUDE.md      # Example user-level config (~/.claude/CLAUDE.md)
    |-- statusline.json     # Custom status line config
```

---

## Quick Start

### Installation via npm (Recommended)

The easiest way to install and keep your Claude Code configurations up to date:

```bash
# Global installation (recommended for all projects)
npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom

# Or local installation (project-specific)
npm install @jwdobeutechsolutions/dobeutech-claude-code-custom
```

The installation script automatically:
- Copies all agents, skills, commands, and rules to `~/.claude/` (global) or `./.claude/` (local)
- Merges hooks into `settings.json` (preserves your existing hooks)
- Merges MCP server configs into `.claude.json` (preserves your API keys)

**After installation:**
1. Configure your API keys in `~/.claude/.claude.json` (or `./.claude/.claude.json` for local)
2. Customize settings in `~/.claude/settings.json` if needed
3. Use `claude-config update` to sync latest changes

**CLI Commands:**
```bash
claude-config status    # Check installation status and version
claude-config list       # List all installed components
claude-config update     # Update to latest version
claude-config help       # Show help
```

---

### Manual Installation (Alternative)

If you prefer to install manually:

#### 1. Copy what you need

```bash
# Clone the repo
git clone https://github.com/dobeutech/dobeutech-claude-code-custom.git

# Copy agents to your Claude config
cp dobeutech-claude-code-custom/agents/*.md ~/.claude/agents/

# Copy rules
cp dobeutech-claude-code-custom/rules/*.md ~/.claude/rules/

# Copy commands
cp dobeutech-claude-code-custom/commands/*.md ~/.claude/commands/

# Copy skills
cp -r dobeutech-claude-code-custom/skills/* ~/.claude/skills/
```

#### 2. Add hooks to settings.json

Copy the hooks from `hooks/hooks.json` to your `~/.claude/settings.json`.

#### 3. Configure MCPs

Copy desired MCP servers from `mcp-configs/mcp-servers.json` to your `~/.claude.json`.

**Important:** Replace `YOUR_*_HERE` placeholders with your actual API keys.

---

### Read the guide

Seriously, [read the guide](https://x.com/affaanmustafa/status/2012378465664745795). These configs make 10x more sense with context.

---

## Key Concepts

### Agents

Subagents handle delegated tasks with limited scope. Example:

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer...
```

### Skills

Skills are workflow definitions invoked by commands or agents:

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hooks

Hooks fire on tool events. Example - warn about console.log:

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

### Rules

Rules are always-follow guidelines. Keep them modular:

```
~/.claude/rules/
  security.md      # No hardcoded secrets
  coding-style.md  # Immutability, file limits
  testing.md       # TDD, coverage requirements
```

---

## Contributing

**Contributions are welcome and encouraged.**

This repo is meant to be a community resource. If you have:
- Useful agents or skills
- Clever hooks
- Better MCP configurations
- Improved rules

Please contribute! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

- Language-specific skills (Python, Go, Rust patterns)
- Framework-specific configs (Django, Rails, Laravel)
- DevOps agents (Kubernetes, Terraform, AWS)
- Testing strategies (different frameworks)
- Domain-specific knowledge (ML, data engineering, mobile)

---

## Background

I've been using Claude Code since the experimental rollout. Won the Anthropic x Forum Ventures hackathon in Sep 2025 building [zenith.chat](https://zenith.chat) with [@DRodriguezFX](https://x.com/DRodriguezFX) - entirely using Claude Code.

These configs are battle-tested across multiple production applications.

---

## Important Notes

### Context Window Management

**Critical:** Don't enable all MCPs at once. Your 200k context window can shrink to 70k with too many tools enabled.

Rule of thumb:
- Have 20-30 MCPs configured
- Keep under 10 enabled per project
- Under 80 tools active

Use `disabledMcpServers` in project config to disable unused ones.

### Customization

These configs work for my workflow. You should:
1. Start with what resonates
2. Modify for your stack
3. Remove what you don't use
4. Add your own patterns

---

## Links

- **Full Guide:** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **Follow:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## License

MIT - Use freely, modify as needed, contribute back if you can.

---

**Star this repo if it helps. Read the guide. Build something great.**
