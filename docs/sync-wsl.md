# Syncing Claude Code Setup: Windows to WSL

Use this when you run Claude Code on both Windows (PowerShell) and WSL on the same machine and want the same agents, skills, commands, rules, MCP config, and settings in both.

- **Windows config lives at:** `C:\Users\<you>\.claude\`
- **WSL config lives at:** `~/.claude/` (e.g. `/home/<you>/.claude/`)

---

## Approach 1: Install in WSL + copy customizations (recommended)

1. **In WSL**, install the package globally so it creates `~/.claude/` with the full structure:

   ```bash
   npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom
   ```

2. **Copy your Windows customizations** (MCP/API keys and settings) into WSL. From the repo in WSL:

   ```bash
   chmod +x scripts/sync-claude-to-wsl.sh
   ./scripts/sync-claude-to-wsl.sh approach1
   ```

   The script **auto-detects your Windows username** — nothing is hardcoded. It asks Windows
   directly via `cmd.exe /c echo %USERNAME%`, falls back to `$USER`/`whoami`, and finally to the
   sole profile under `/mnt/c/Users` that contains a `.claude` directory. It prints the profile it
   chose before doing anything.

   Or manually, deriving the username the same way:

   ```bash
   WIN_USER=$(cd /mnt/c && cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r\n')
   WIN_CLAUDE=/mnt/c/Users/$WIN_USER/.claude

   cp "$WIN_CLAUDE/.claude.json" ~/.claude/.claude.json
   cp "$WIN_CLAUDE/settings.json" ~/.claude/settings.json
   [ -f "$WIN_CLAUDE/settings.local.json" ] && cp "$WIN_CLAUDE/settings.local.json" ~/.claude/
   ```

3. **Auto-detection picked the wrong profile?** Override it. Two knobs, in precedence order:

   ```bash
   # Give the full path (highest precedence)
   WINDOWS_CLAUDE_DIR=/mnt/c/Users/YourUser/.claude ./scripts/sync-claude-to-wsl.sh approach1

   # ...or just the username, and let the script build the path
   WINDOWS_USER=YourUser ./scripts/sync-claude-to-wsl.sh approach1

   # ...or pass the path positionally
   ./scripts/sync-claude-to-wsl.sh approach1 /mnt/c/Users/YourUser/.claude
   ```

   Auto-detection matters because the WSL username and the Windows username are frequently
   different (e.g. WSL `jeremy` vs Windows `JeremyWilliams`). A hardcoded username is what made
   the previous version of this doc go stale.

**Pros:** Clean WSL install; only overwrites the few files you customize.  
**Cons:** If you add new agents/skills/commands by editing `~/.claude/` on Windows, copy them over or re-run Approach 2 once.

---

## Approach 2: Full copy (exact clone)

Use this to make WSL’s `~/.claude/` an exact copy of Windows’ directory (including any manual edits).

1. **In WSL**, from the repo:

   ```bash
   chmod +x scripts/sync-claude-to-wsl.sh
   ./scripts/sync-claude-to-wsl.sh approach2
   ```

   Or manually:

   ```bash
   WIN_USER=$(cd /mnt/c && cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r\n')
   WIN_CLAUDE=/mnt/c/Users/$WIN_USER/.claude

   mkdir -p ~/.claude
   rsync -av "$WIN_CLAUDE/" ~/.claude/
   # If you don't have rsync:
   cp -r "$WIN_CLAUDE"/* ~/.claude/
   ```

2. **Line endings (recommended):** convert CRLF to LF so tools in WSL behave correctly:

   ```bash
   find ~/.claude -type f \( -name '*.md' -o -name '*.json' \) -exec sed -i 's/\r$//' {} \;
   ```

   The script runs this automatically for approach2.

3. **Paths in JSON:** If `.claude.json` or `settings.json` contain absolute Windows paths (e.g. `C:\Users\...`), update them to WSL paths (e.g. `/home/...` or `/mnt/c/...`) if needed. The default package config uses env vars, so often no change is required.

**Pros:** One-to-one duplicate.  
**Cons:** Overwrites all of WSL’s `~/.claude/`; re-run when you want to refresh from Windows.

---

## Keeping Windows and WSL in sync

- **After package updates on Windows:** Run `npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom` in WSL, then run the script with `approach1` again (or copy the three files manually).
- **After changing only customizations on Windows:** Run `./scripts/sync-claude-to-wsl.sh approach1` in WSL (or copy `.claude.json` / `settings.json` / `settings.local.json`).
- **After any Windows ~/.claude changes:** Run `./scripts/sync-claude-to-wsl.sh approach2` to refresh the full directory.

You can run the script whenever you change config on Windows; no need to edit the plan file.

---

## Cursor rules (optional)

If you use Cursor in WSL and want the same rules as on Windows:

- **User-level rules:** Copy from your Windows Cursor config into the WSL Cursor config location.
- **Project-level rules:** The repo’s `.cursor/rules/` are per-workspace. If you open the same repo in both Windows and WSL, the rules travel with the repo; no extra sync needed unless you maintain separate clones.
