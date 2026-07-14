#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const TARGET_DIRS = {
  claude: path.join(os.homedir(), '.claude'),
  codex: path.join(os.homedir(), '.codex'),
  gemini: path.join(os.homedir(), '.gemini'),
};

function getInstalledVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version;
  } catch (err) {
    return null;
  }
}

function countComponents(targetDir, type) {
  const counts = { agents: 0, skills: 0, commands: 0, rules: 0, mcp: 0 };

  // Agents (Claude only)
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    counts.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
  }

  // Skills
  const skillsDir = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    counts.skills = entries.filter(e => {
      if (e.name.startsWith('.')) return false;
      if (e.isDirectory()) return fs.existsSync(path.join(skillsDir, e.name, 'SKILL.md'));
      return e.name.endsWith('.md');
    }).length;
  }

  // Commands (Claude only)
  const commandsDir = path.join(targetDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    counts.commands = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md')).length;
  }

  // Rules (Claude only)
  const rulesDir = path.join(targetDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    counts.rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).length;
  }

  // System instructions file
  if (type === 'codex' && fs.existsSync(path.join(targetDir, 'AGENTS.md'))) {
    counts.instructions = true;
  }
  if (type === 'gemini' && fs.existsSync(path.join(targetDir, 'GEMINI.md'))) {
    counts.instructions = true;
  }

  return counts;
}

function parseTarget() {
  const args = process.argv.slice(3); // skip node, script, command
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--target=')) return args[i].split('=')[1];
    if (args[i] === '--target' && args[i + 1]) return args[i + 1];
  }
  return 'all';
}

function getTargets() {
  const target = parseTarget();
  return target === 'all' ? Object.keys(TARGET_DIRS) : [target];
}

function showStatus() {
  const version = getInstalledVersion();
  const targets = getTargets();

  log(`\n${colors.bright}AI CLI Config Status${colors.reset}`, 'bright');
  log(`${'─'.repeat(50)}`, 'blue');
  if (version) log(`Package version: ${version}`, 'green');

  for (const target of targets) {
    const dir = TARGET_DIRS[target];
    log(`\n${colors.bright}${target.charAt(0).toUpperCase() + target.slice(1)}${colors.reset} (${dir})`, 'bright');

    if (!fs.existsSync(dir)) {
      log(`  ✗ Not installed`, 'red');
      continue;
    }

    const counts = countComponents(dir, target);

    if (target === 'claude') {
      log(`  Agents: ${counts.agents}`, 'cyan');
      log(`  Skills: ${counts.skills}`, 'cyan');
      log(`  Commands: ${counts.commands}`, 'cyan');
      log(`  Rules: ${counts.rules}`, 'cyan');
    } else if (target === 'codex') {
      log(`  AGENTS.md: ${counts.instructions ? '✓' : '✗'}`, counts.instructions ? 'green' : 'red');
      log(`  Skills: ${counts.skills}`, 'cyan');
    } else if (target === 'gemini') {
      log(`  GEMINI.md: ${counts.instructions ? '✓' : '✗'}`, counts.instructions ? 'green' : 'red');
      log(`  Skills: ${counts.skills}`, 'cyan');
    }
  }

  log('', 'reset');
}

function runInstall() {
  const target = parseTarget();
  const scriptPath = path.join(__dirname, '..', 'scripts', 'install.js');
  try {
    execSync(`node "${scriptPath}" --target ${target}`, { stdio: 'inherit' });
  } catch (err) {
    log(`Installation failed`, 'red');
    process.exit(1);
  }
}

function main() {
  const command = process.argv[2] || 'status';

  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'install':
      runInstall();
      break;
    case 'help':
    case '--help':
    case '-h':
      log(`\n${colors.bright}AI Config CLI${colors.reset}`, 'bright');
      log(`${'─'.repeat(50)}`, 'blue');
      log(`\nUsage: ai-config <command> [--target claude|codex|gemini|all]\n`, 'bright');
      log(`Commands:`, 'bright');
      log(`  status    Show installation status for each CLI`, 'cyan');
      log(`  install   Install configs to target CLI(s)`, 'cyan');
      log(`  help      Show this help message`, 'cyan');
      log(`\nExamples:`, 'bright');
      log(`  ai-config status                    # Show all targets`, 'cyan');
      log(`  ai-config status --target codex     # Show Codex only`, 'cyan');
      log(`  ai-config install --target all      # Install to all CLIs`, 'cyan');
      log(`  ai-config install --target gemini   # Install to Gemini only`, 'cyan');
      log('', 'reset');
      break;
    default:
      log(`Unknown command: ${command}`, 'red');
      log(`Run 'ai-config help' for usage`, 'yellow');
      process.exit(1);
  }
}

main();
