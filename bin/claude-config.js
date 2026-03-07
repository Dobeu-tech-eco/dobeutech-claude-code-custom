#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Colors for console output
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

// Get target directory (same logic as install.js)
function getTargetDir() {
  // Check if .claude exists in current directory (local)
  if (fs.existsSync(path.join(process.cwd(), '.claude'))) {
    return path.join(process.cwd(), '.claude');
  }
  // Otherwise use global
  return path.join(os.homedir(), '.claude');
}

// Get installed package version
function getInstalledVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.version;
    }
  } catch (err) {
    // Ignore
  }
  return null;
}

// Get latest version from npm
function getLatestVersion() {
  try {
    const result = execSync('npm view @jwdobeutechsolutions/dobeutech-claude-code-custom version', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return result.trim();
  } catch (err) {
    return null;
  }
}

// Count installed components
function countComponents(targetDir) {
  const counts = {
    agents: 0,
    skills: 0,
    commands: 0,
    rules: 0,
  };
  
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    counts.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
  }
  
  const skillsDir = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    counts.skills = entries.filter(e => {
      if (e.isDirectory()) {
        return fs.existsSync(path.join(skillsDir, e.name, 'SKILL.md'));
      }
      return e.name.endsWith('.md');
    }).length;
  }
  
  const commandsDir = path.join(targetDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    counts.commands = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md')).length;
  }
  
  const rulesDir = path.join(targetDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    counts.rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).length;
  }
  
  return counts;
}

// Command: status
function showStatus() {
  const targetDir = getTargetDir();
  const installedVersion = getInstalledVersion();
  const latestVersion = getLatestVersion();
  
  log(`\n${colors.bright}Claude Code Config Status${colors.reset}`, 'bright');
  log(`─`.repeat(50), 'blue');
  
  if (!fs.existsSync(targetDir)) {
    log(`\n${colors.red}✗ Not installed${colors.reset}`, 'red');
    log(`Run: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom`, 'yellow');
    return;
  }
  
  log(`\nInstallation directory: ${targetDir}`, 'blue');
  
  if (installedVersion) {
    log(`Installed version: ${installedVersion}`, 'green');
  }
  
  if (latestVersion) {
    if (installedVersion && installedVersion !== latestVersion) {
      log(`Latest version: ${latestVersion} ${colors.yellow}(update available)${colors.reset}`, 'yellow');
      log(`\nRun 'claude-config update' to update`, 'yellow');
    } else if (installedVersion === latestVersion) {
      log(`Latest version: ${latestVersion} ${colors.green}(up to date)${colors.reset}`, 'green');
    } else {
      log(`Latest version: ${latestVersion}`, 'blue');
    }
  }
  
  const counts = countComponents(targetDir);
  log(`\nInstalled components:`, 'bright');
  log(`  Agents: ${counts.agents}`, 'cyan');
  log(`  Skills: ${counts.skills}`, 'cyan');
  log(`  Commands: ${counts.commands}`, 'cyan');
  log(`  Rules: ${counts.rules}`, 'cyan');
  
  log(``, 'reset');
}

// Command: list
function listComponents() {
  const targetDir = getTargetDir();
  
  if (!fs.existsSync(targetDir)) {
    log(`\n${colors.red}✗ Not installed${colors.reset}`, 'red');
    log(`Run: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom`, 'yellow');
    return;
  }
  
  log(`\n${colors.bright}Installed Components${colors.reset}`, 'bright');
  log(`─`.repeat(50), 'blue');
  
  // List agents
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    if (agents.length > 0) {
      log(`\n${colors.bright}Agents (${agents.length}):${colors.reset}`, 'bright');
      agents.forEach(agent => {
        log(`  • ${agent.replace('.md', '')}`, 'cyan');
      });
    }
  }
  
  // List skills
  const skillsDir = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skills = entries.filter(e => {
      if (e.isDirectory()) {
        return fs.existsSync(path.join(skillsDir, e.name, 'SKILL.md'));
      }
      return e.name.endsWith('.md');
    });
    if (skills.length > 0) {
      log(`\n${colors.bright}Skills (${skills.length}):${colors.reset}`, 'bright');
      skills.forEach(skill => {
        const name = skill.isDirectory() ? skill.name : skill.name.replace('.md', '');
        log(`  • ${name}`, 'cyan');
      });
    }
  }
  
  // List commands
  const commandsDir = path.join(targetDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    if (commands.length > 0) {
      log(`\n${colors.bright}Commands (${commands.length}):${colors.reset}`, 'bright');
      commands.forEach(cmd => {
        log(`  • ${cmd.replace('.md', '')}`, 'cyan');
      });
    }
  }
  
  // List rules
  const rulesDir = path.join(targetDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    const rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
    if (rules.length > 0) {
      log(`\n${colors.bright}Rules (${rules.length}):${colors.reset}`, 'bright');
      rules.forEach(rule => {
        log(`  • ${rule.replace('.md', '')}`, 'cyan');
      });
    }
  }
  
  log(``, 'reset');
}

// Command: uninstall
function uninstall() {
  const targetDir = getTargetDir();

  if (!fs.existsSync(targetDir)) {
    log(`\n${colors.red}✗ Not installed${colors.reset}`, 'red');
    return;
  }

  log(`\n${colors.bright}Uninstalling Claude Code Configurations...${colors.reset}`, 'bright');

  const dirsToRemove = ['agents', 'skills', 'commands', 'rules', 'templates', 'docs'];
  let removedCount = 0;

  for (const dir of dirsToRemove) {
    const dirPath = path.join(targetDir, dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`Removed ${dir}/`, 'green');
        removedCount++;
      } catch (err) {
        log(`Failed to remove ${dir}/: ${err.message}`, 'red');
      }
    }
  }

  if (removedCount > 0) {
    log(`\n${colors.green}✓ Uninstallation complete!${colors.reset}`, 'green');
    log(`Note: 'settings.json' and '.claude.json' were left intact to preserve your custom settings and API keys.`, 'yellow');
  } else {
    log(`\n${colors.yellow}No standard configuration directories were found to remove.${colors.reset}`, 'yellow');
  }
}

// Command: update
function update() {
  const targetDir = getTargetDir();
  const installedVersion = getInstalledVersion();
  const latestVersion = getLatestVersion();
  
  if (!fs.existsSync(targetDir)) {
    log(`\n${colors.red}✗ Not installed${colors.reset}`, 'red');
    log(`Run: npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom`, 'yellow');
    return;
  }
  
  if (installedVersion && latestVersion && installedVersion === latestVersion) {
    log(`\n${colors.green}✓ Already up to date (${installedVersion})${colors.reset}`, 'green');
    return;
  }
  
  log(`\n${colors.bright}Updating Claude Code Configurations...${colors.reset}`, 'bright');
  
  // Check if installed globally or locally
  const isGlobal = targetDir === path.join(os.homedir(), '.claude');
  
  try {
    if (isGlobal) {
      log(`Updating global installation...`, 'blue');
      execSync('npm install -g @jwdobeutechsolutions/dobeutech-claude-code-custom@latest', {
        stdio: 'inherit',
      });
    } else {
      log(`Updating local installation...`, 'blue');
      execSync('npm install @jwdobeutechsolutions/dobeutech-claude-code-custom@latest', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    }
    
    log(`\n${colors.green}✓ Update complete!${colors.reset}`, 'green');
    log(`Run 'claude-config status' to verify`, 'yellow');
  } catch (err) {
    log(`\n${colors.red}✗ Update failed${colors.reset}`, 'red');
    log(err.message, 'red');
    process.exit(1);
  }
}

// Main CLI handler
function main() {
  const command = process.argv[2] || 'status';
  
  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'list':
      listComponents();
      break;
    case 'update':
      update();
      break;
    case 'uninstall':
      uninstall();
      break;
    case 'help':
    case '--help':
    case '-h':
      log(`\n${colors.bright}Claude Config CLI${colors.reset}`, 'bright');
      log(`─`.repeat(50), 'blue');
      log(`\nUsage: claude-config <command>\n`, 'bright');
      log(`Commands:`, 'bright');
      log(`  status    Show installation status and version`, 'cyan');
      log(`  list      List all installed components`, 'cyan');
      log(`  update    Update to latest version`, 'cyan');
      log(`  uninstall Remove installed components`, 'cyan');
      log(`  help      Show this help message`, 'cyan');
      log(``, 'reset');
      break;
    default:
      log(`\n${colors.red}Unknown command: ${command}${colors.reset}`, 'red');
      log(`Run 'claude-config help' for usage`, 'yellow');
      process.exit(1);
  }
}

main();
