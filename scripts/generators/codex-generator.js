#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { BaseGenerator } = require('./base-generator');
const { log, ensureDir } = require('../utils/merge-utils');
const { concatenateRules } = require('../transformers/rules-transformer');
const { toCodexSummary, toCodexSkills } = require('../transformers/agents-transformer');
const { appendTomlMcpServers } = require('../transformers/mcp-transformer');

class CodexGenerator extends BaseGenerator {
  get targetName() {
    return 'Codex CLI';
  }

  get targetDir() {
    return path.join(os.homedir(), '.codex');
  }

  install() {
    log(`\nInstalling ${this.targetName} configurations...`, 'bright');
    log(`Target: ${this.targetDir}`, 'blue');

    this.generateInstructions();
    this.generateSkills();
    this.mergeMcpServers();

    log(`✓ ${this.targetName} installation complete!`, 'green');
    return true;
  }

  /**
   * Generate ~/.codex/AGENTS.md from rules + agent summaries
   */
  generateInstructions() {
    log(`Generating AGENTS.md...`, 'green');

    const rulesDir = path.join(this.sourceDir, 'rules');
    const agentsDir = path.join(this.sourceDir, 'agents');

    // Concatenate rules (adapted for Codex)
    let content = concatenateRules(rulesDir, 'codex');

    // Append agent role summaries
    const agentSummary = toCodexSummary(agentsDir);
    if (agentSummary) {
      content += '\n---\n\n' + agentSummary;
    }

    this.writeTarget('AGENTS.md', content);
  }

  /**
   * Generate Codex skills from key agents
   */
  generateSkills() {
    log(`Generating Codex skills...`, 'green');

    const agentsDir = path.join(this.sourceDir, 'agents');
    const targetSkillsDir = path.join(this.targetDir, 'skills');

    if (!this.dryRun) {
      toCodexSkills(agentsDir, targetSkillsDir);
    } else {
      log(`[DRY RUN] Would generate Codex skills`, 'yellow');
    }
  }

  /**
   * Append MCP servers to config.toml (string-append, preserves existing config)
   */
  mergeMcpServers() {
    const mcpSrc = path.join(this.sourceDir, 'mcp-configs', 'mcp-servers.json');
    if (!fs.existsSync(mcpSrc)) return;

    log(`Merging MCP servers into config.toml...`, 'green');

    const mcpData = JSON.parse(fs.readFileSync(mcpSrc, 'utf8'));
    const servers = mcpData.mcpServers || {};

    const configPath = path.join(this.targetDir, 'config.toml');
    let existingToml = '';
    if (fs.existsSync(configPath)) {
      existingToml = fs.readFileSync(configPath, 'utf8');
    }

    if (!this.dryRun) {
      const updated = appendTomlMcpServers(existingToml, servers);
      ensureDir(this.targetDir);
      fs.writeFileSync(configPath, updated);
    } else {
      log(`[DRY RUN] Would append MCP servers to config.toml`, 'yellow');
    }
  }
}

module.exports = { CodexGenerator };
