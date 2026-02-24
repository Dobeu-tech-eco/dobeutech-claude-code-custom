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

  install() {
    log(`\nInstalling ${this.targetName} configurations...`, 'bright');
    log(`Target: ${this.targetDir}`, 'blue');

    if (!this.sourceExists('agents')) {
      log(`Error: Source directory does not contain 'agents' folder`, 'red');
      return false;
    }

    // Copy directories
    const dirsToCopy = ['agents', 'skills', 'commands', 'rules', 'templates', 'docs'];
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

    // Merge hooks
    const hooksSrc = path.join(this.sourceDir, 'hooks', 'hooks.json');
    if (fs.existsSync(hooksSrc)) {
      log(`Merging hooks into settings.json...`, 'green');
      if (!this.dryRun) {
        const hooksData = JSON.parse(fs.readFileSync(hooksSrc, 'utf8'));
        const settingsPath = path.join(this.targetDir, 'settings.json');
        const merged = mergeHooks(settingsPath, hooksData);
        writeJson(settingsPath, merged);
      }
    }

    // Merge MCP servers
    const mcpSrc = path.join(this.sourceDir, 'mcp-configs', 'mcp-servers.json');
    if (fs.existsSync(mcpSrc)) {
      log(`Merging MCP servers into .claude.json...`, 'green');
      if (!this.dryRun) {
        const mcpData = JSON.parse(fs.readFileSync(mcpSrc, 'utf8'));
        const claudeJsonPath = path.join(this.targetDir, '.claude.json');
        const merged = mergeMcpServers(claudeJsonPath, mcpData);
        writeJson(claudeJsonPath, merged);
      }
    }

    log(`✓ ${this.targetName} installation complete!`, 'green');
    return true;
  }
}

module.exports = { ClaudeGenerator };
