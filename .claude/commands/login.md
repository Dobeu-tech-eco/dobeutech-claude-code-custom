---
description: Authenticate with services (GitHub, MCP servers, APIs)
---

# Login & Authentication Helper

This command helps you authenticate with various services used in Claude Code workflows.

## Available Authentication Options

Please specify what you'd like to authenticate with:

1. **GitHub CLI (gh)**
   - Repository access
   - PR creation and management
   - Issues and actions

2. **MCP Servers**
   - Context7 (code documentation)
   - Tavily (web search)
   - GitHub MCP
   - Linear, Notion, etc.

3. **Cloud Providers**
   - AWS credentials
   - Azure authentication
   - GCP authentication

4. **API Keys**
   - OpenAI API
   - Anthropic API
   - Other service APIs

## GitHub Authentication

To authenticate with GitHub:

```bash
# Check if already logged in
gh auth status

# Login with browser
gh auth login

# Or use token
gh auth login --with-token < token.txt
```

## MCP Server Configuration

MCP servers are configured in `~/.claude.json`. To set up:

1. Check current MCP status:
```bash
claude-mcp status
```

2. Add API keys to environment variables in `~/.env-mcp`:
```bash
export CONTEXT7_API_KEY="your_key_here"
export TAVILY_API_KEY="your_key_here"
export GITHUB_TOKEN="your_token_here"
```

3. Restart MCP servers:
```bash
claude-mcp restart
```

## Verification Steps

After authentication, verify:

- **GitHub**: `gh auth status`
- **MCP**: `claude-mcp status`
- **AWS**: `aws sts get-caller-identity`
- **Azure**: `az account show`
- **GCP**: `gcloud auth list`

## What would you like to authenticate?

Please respond with the service name (e.g., "GitHub", "MCP servers", "AWS") or ask for help with a specific authentication scenario.
