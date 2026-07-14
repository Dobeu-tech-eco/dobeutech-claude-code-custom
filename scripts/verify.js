#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { colors, log } = require('./utils/merge-utils');

const TARGETS = {
  claude: {
    dir: path.join(os.homedir(), '.claude'),
    checks: [
      { path: 'agents', type: 'dir', desc: 'Agents directory' },
      { path: 'skills', type: 'dir', desc: 'Skills directory' },
      { path: 'commands', type: 'dir', desc: 'Commands directory' },
      { path: 'rules', type: 'dir', desc: 'Rules directory' },
      { path: 'settings.json', type: 'file', desc: 'Settings (hooks)' },
    ],
  },
  codex: {
    dir: path.join(os.homedir(), '.codex'),
    checks: [
      { path: 'AGENTS.md', type: 'file', desc: 'System instructions' },
      { path: 'config.toml', type: 'file', desc: 'Config (MCP servers)' },
      { path: 'skills', type: 'dir', desc: 'Skills directory' },
    ],
  },
  gemini: {
    dir: path.join(os.homedir(), '.gemini'),
    checks: [
      { path: 'GEMINI.md', type: 'file', desc: 'System instructions' },
      { path: 'settings.json', type: 'file', desc: 'Settings (MCP servers)' },
      { path: 'skills', type: 'dir', desc: 'Skills directory' },
    ],
  },
};

function verify() {
  log(`\n${colors.bright}Verifying AI CLI Configurations${colors.reset}`, 'bright');
  log(`${'─'.repeat(50)}`, 'blue');

  let allGood = true;

  for (const [target, config] of Object.entries(TARGETS)) {
    log(`\n${colors.bright}${target.charAt(0).toUpperCase() + target.slice(1)}${colors.reset} (${config.dir})`, 'bright');

    if (!fs.existsSync(config.dir)) {
      log(`  ✗ Directory does not exist`, 'red');
      allGood = false;
      continue;
    }

    for (const check of config.checks) {
      const fullPath = path.join(config.dir, check.path);
      const exists = fs.existsSync(fullPath);

      if (exists) {
        if (check.type === 'dir') {
          const count = fs.readdirSync(fullPath).length;
          log(`  ✓ ${check.desc}: ${count} items`, 'green');
        } else {
          const size = fs.statSync(fullPath).size;
          log(`  ✓ ${check.desc}: ${(size / 1024).toFixed(1)}KB`, 'green');
        }
      } else {
        log(`  ✗ ${check.desc}: missing (${check.path})`, 'red');
        allGood = false;
      }
    }

    // Target-specific validations
    if (target === 'codex') {
      const configPath = path.join(config.dir, 'config.toml');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const mcpCount = (content.match(/\[mcp_servers\./g) || []).length;
        log(`  ℹ MCP servers in config.toml: ${mcpCount}`, 'cyan');
        // Verify no duplicate sections
        const sections = content.match(/\[mcp_servers\.([^\]]+)\]/g) || [];
        const unique = new Set(sections);
        if (sections.length !== unique.size) {
          log(`  ⚠ Duplicate MCP sections detected!`, 'yellow');
          allGood = false;
        }
      }
    }

    if (target === 'gemini') {
      const settingsPath = path.join(config.dir, 'settings.json');
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          const mcpCount = settings.mcpServers ? Object.keys(settings.mcpServers).length : 0;
          log(`  ℹ MCP servers in settings.json: ${mcpCount}`, 'cyan');
          // Verify user settings preserved
          if (settings.security) log(`  ✓ User auth settings preserved`, 'green');
          if (settings.general) log(`  ✓ User general settings preserved`, 'green');
        } catch (err) {
          log(`  ✗ settings.json is invalid JSON!`, 'red');
          allGood = false;
        }
      }
    }
  }

  log(`\n${'─'.repeat(50)}`, 'blue');
  if (allGood) {
    log(`${colors.bright}✓ All verifications passed${colors.reset}`, 'green');
  } else {
    log(`${colors.yellow}⚠ Some issues found — run 'node scripts/install.js --target all' to fix${colors.reset}`, 'yellow');
  }
  log('', 'reset');
}

verify();
