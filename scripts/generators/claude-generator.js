#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { BaseGenerator } = require('./base-generator');
const { log, copyDir, mergeHooks, mergeMcpServers, writeJson } = require('../utils/merge-utils');

class ClaudeGenerator extends BaseGenerator {
  constructor(sourceDir, options = {}) {
    super(sourceDir, options);
    this._isGlobal = options.isGlobal !== undefined ? options.isGlobal : true;
  }

  get targetName() {
    return 'Claude Code';
  }

  get targetDir() {
    if (this._isGlobal) {
      return path.join(os.homedir(), '.claude');
    }
    return path.join(process.cwd(), '.claude');
  }

  // Claude Code reads MCP servers from .claude.json at the home/project ROOT,
  // NOT from inside the .claude/ directory. Writing it inside .claude/ is a no-op.
  get mcpConfigPath() {
    const root = this._isGlobal ? os.homedir() : process.cwd();
    return path.join(root, '.claude.json');
  }

  // /login, /plan and /code-review are Claude Code built-ins. A user command of the same
  // name shadows the built-in — shadowing /login breaks OAuth outright. Drop the first two
  // and land the third under a non-colliding name.
  pruneShadowedCommands() {
    const commandsDir = path.join(this.targetDir, 'commands');
    if (!fs.existsSync(commandsDir)) return;

    for (const name of ['login.md', 'plan.md']) {
      const p = path.join(commandsDir, name);
      if (!fs.existsSync(p)) continue;
      log(`Skipping ${name} (shadows a Claude Code built-in)`, 'yellow');
      if (!this.dryRun) fs.unlinkSync(p);
    }

    const from = path.join(commandsDir, 'code-review.md');
    const to = path.join(commandsDir, 'code-review-strict.md');
    if (fs.existsSync(from)) {
      log(`Renaming code-review.md -> code-review-strict.md (shadows built-in /code-review)`, 'yellow');
      if (!this.dryRun) fs.renameSync(from, to);
    }
  }

  install() {
    log(`\nInstalling ${this.targetName} configurations...`, 'bright');
    log(`Target: ${this.targetDir}`, 'blue');

    if (!this.sourceExists('agents')) {
      log(`Error: Source directory does not contain 'agents' folder`, 'red');
      return false;
    }

    // 'hooks' must be here: hooks.json points settings.json at these .ps1 files by path,
    // so a hooks entry without the scripts on disk is a dangling reference.
    const dirsToCopy = ['agents', 'skills', 'commands', 'rules', 'hooks', 'templates', 'docs'];

    this.createBackup(dirsToCopy);

    for (const dir of dirsToCopy) {
      const srcPath = path.join(this.sourceDir, dir);
      const destPath = path.join(this.targetDir, dir);
      if (fs.existsSync(srcPath)) {
        log(`Copying ${dir}/...`, 'green');
        if (!this.dryRun) {
          copyDir(srcPath, destPath);
        } else {
          log(`[DRY RUN] Would copy ${dir}/`, 'yellow');
        }
      }
    }

    this.pruneShadowedCommands();

    // Merge hooks
    const hooksSrc = path.join(this.sourceDir, 'hooks', 'hooks.json');
    if (fs.existsSync(hooksSrc)) {
      const settingsPath = path.join(this.targetDir, 'settings.json');
      log(`Merging hooks into settings.json...`, 'green');
      if (!this.dryRun) {
        const raw = fs.readFileSync(hooksSrc, 'utf8');
        // hooks.json ships ${CLAUDE_CONFIG_DIR} placeholders so it stays portable in git.
        // mergeHooks() copies `command` verbatim, so resolve them here or they ship broken.
        const resolved = raw.split('${CLAUDE_CONFIG_DIR}').join(this.targetDir.replace(/\\/g, '/'));
        const merged = mergeHooks(settingsPath, JSON.parse(resolved));
        writeJson(settingsPath, merged);
      } else {
        log(`[DRY RUN] Would merge hooks into ${settingsPath}`, 'yellow');
      }
    }

    // Merge MCP servers
    const mcpSrc = path.join(this.sourceDir, 'mcp-configs', 'mcp-servers.json');
    if (fs.existsSync(mcpSrc)) {
      const claudeJsonPath = this.mcpConfigPath;
      log(`Merging MCP servers into ${claudeJsonPath}...`, 'green');
      if (!this.dryRun) {
        const mcpData = JSON.parse(fs.readFileSync(mcpSrc, 'utf8'));
        const merged = mergeMcpServers(claudeJsonPath, mcpData);
        writeJson(claudeJsonPath, merged);
      } else {
        log(`[DRY RUN] Would merge MCP servers into ${claudeJsonPath}`, 'yellow');
      }
    }

    log(`✓ ${this.targetName} installation complete!`, 'green');
    return true;
  }
}

module.exports = { ClaudeGenerator };
