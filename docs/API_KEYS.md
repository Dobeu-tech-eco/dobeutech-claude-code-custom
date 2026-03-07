# API Keys Configuration Guide

To fully unlock the capabilities of these Claude Code configurations, you need to provide API keys for the Model Context Protocol (MCP) servers and third-party tools that your agents, commands, and skills will use.

This guide details where to configure these keys and best practices for doing so.

## 1. Where to Configure API Keys

When you install this package (either globally or locally), an `mcp-servers.json` template gets merged into your `.claude.json` file.

- **Global Installation:** Keys are configured in `~/.claude/.claude.json`
- **Local Installation:** Keys are configured in `./.claude/.claude.json` (at the root of your project)

*Note: Your `settings.json` file controls hook triggers, but `.claude.json` is where the environment variables and server configurations live.*

## 2. Setting Up Your Keys

Open the appropriate `.claude.json` file in your preferred editor. You'll see a structure under the `mcpServers` object. Find the `"env"` sections for each tool and replace the `YOUR_*_HERE` placeholders with your actual keys.

### Example: GitHub Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_yourRealGithubTokenHere"
      }
    }
  }
}
```

### Common Tools & Where to Get Their Keys

- **GitHub (`GITHUB_PERSONAL_ACCESS_TOKEN`)**: Generate a Personal Access Token from your [GitHub Developer Settings](https://github.com/settings/tokens). Give it standard repo access.
- **Supabase / Databases**: If using database plugins or migrator agents, refer to your database provider's dashboard for connection URLs and API keys.
- **Vercel / Railway**: Find your access tokens in your platform's account settings for deployment commands to work.
- **mem0 (`MEM0_API_KEY`)**: Used for advanced memory management skills. Get this from your mem0.ai dashboard.

## 3. Best Practices & Security

1. **NEVER Commit Your `.claude.json` File.**
   If you installed this locally in a project, ensure `./.claude/.claude.json` is added to your project's `.gitignore` file to prevent accidentally leaking your API keys.

2. **Disable Unused Servers.**
   Too many active tools will crowd the AI's context window. You can disable specific servers by adding them to the `disabledMcpServers` array in your `CLAUDE.md` or `.claude.json`.

3. **Backup Settings.**
   When running `claude-config update` or `claude-config uninstall`, your `.claude.json` and `settings.json` are automatically preserved so you won't lose your API keys.

## 4. Troubleshooting

If an agent or command complains about lacking permissions or invalid credentials:
- Check that the corresponding environment variable placeholder (`YOUR_*_HERE`) was properly replaced.
- Ensure the JSON syntax in `.claude.json` is valid (no missing commas or quotes).
- Try running `claude-config list` to ensure your components are installed properly.
