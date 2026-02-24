#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { BaseGenerator } = require('./base-generator');
const { log, ensureDir, readJsonSafe, writeJson } = require('../utils/merge-utils');
const { concatenateRules } = require('../transformers/rules-transformer');
const { toGeminiSkills, convertSkillsToGemini } = require('../transformers/agents-transformer');
const { toGeminiFormat } = require('../transformers/mcp-transformer');

class GeminiGenerator extends BaseGenerator {
  get targetName() {
    return 'Gemini CLI';
  }

  get targetDir() {
    return path.join(os.homedir(), '.gemini');
  }

  install() {
    log(`\nInstalling ${this.targetName} configurations...`, 'bright');
    log(`Target: ${this.targetDir}`, 'blue');

    this.generateContextFile();
    this.generateSkills();
    this.mergeMcpServers();

    log(`✓ ${this.targetName} installation complete!`, 'green');
    return true;
  }

  /**
   * Generate ~/.gemini/GEMINI.md from concatenated rules
   */
  generateContextFile() {
    log(`Generating GEMINI.md...`, 'green');

    const rulesDir = path.join(this.sourceDir, 'rules');
    const content = concatenateRules(rulesDir, 'gemini');

    this.writeTarget('GEMINI.md', content);
  }

  /**
   * Convert agents and skills to Gemini skill directories
   */
  generateSkills() {
    log(`Generating Gemini skills...`, 'green');

    const agentsDir = path.join(this.sourceDir, 'agents');
    const skillsDir = path.join(this.sourceDir, 'skills');
    const targetSkillsDir = path.join(this.targetDir, 'skills');

    if (!this.dryRun) {
      // Convert agents to skills (20 agent skills)
      toGeminiSkills(agentsDir, targetSkillsDir);

      // Convert source skills (10 skills)
      convertSkillsToGemini(skillsDir, targetSkillsDir);
    } else {
      log(`[DRY RUN] Would generate Gemini skills`, 'yellow');
    }
  }

  /**
   * Merge MCP servers into settings.json (preserves existing settings)
   */
  mergeMcpServers() {
    const mcpSrc = path.join(this.sourceDir, 'mcp-configs', 'mcp-servers.json');
    if (!fs.existsSync(mcpSrc)) return;

    log(`Merging MCP servers into settings.json...`, 'green');

    const mcpData = JSON.parse(fs.readFileSync(mcpSrc, 'utf8'));
    const servers = mcpData.mcpServers || {};
    const geminiServers = toGeminiFormat(servers);

    const settingsPath = path.join(this.targetDir, 'settings.json');

    if (!this.dryRun) {
      const existing = readJsonSafe(settingsPath);

      // Only add/update mcpServers key, preserve everything else
      if (!existing.mcpServers) {
        existing.mcpServers = {};
      }

      for (const [name, config] of Object.entries(geminiServers)) {
        if (!existing.mcpServers[name]) {
          existing.mcpServers[name] = config;
        } else {
          // Preserve existing env values (API keys user has set)
          const existingEnv = existing.mcpServers[name].env || {};
          existing.mcpServers[name] = {
            ...config,
            ...existing.mcpServers[name],
            env: { ...config.env, ...existingEnv },
          };
        }
      }

      writeJson(settingsPath, existing);
    } else {
      log(`[DRY RUN] Would merge MCP servers into settings.json`, 'yellow');
    }
  }
}

module.exports = { GeminiGenerator };
