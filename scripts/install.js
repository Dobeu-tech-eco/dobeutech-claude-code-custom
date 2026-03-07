#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Detect installation scope
function isGlobalInstall() {
  // Check npm_config_global environment variable
  if (process.env.npm_config_global === 'true') {
    return true;
  }
  
  // Check if we're in a global node_modules location
  const installPath = __dirname;
  const globalPaths = [
    path.join(os.homedir(), '.npm'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm'),
    '/usr/local/lib/node_modules',
    '/usr/lib/node_modules',
  ];
  
  return globalPaths.some(globalPath => installPath.includes(globalPath));
}

// Get target directory
function getTargetDir() {
  if (isGlobalInstall()) {
    // Global installation: ~/.claude/
    return path.join(os.homedir(), '.claude');
  } else {
    // Local installation: ./.claude/ in project root
    // Find project root by looking for package.json or .git
    let currentDir = process.cwd();
    let projectRoot = currentDir;
    
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'package.json')) || 
          fs.existsSync(path.join(currentDir, '.git'))) {
        projectRoot = currentDir;
        break;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return path.join(projectRoot, '.claude');
  }
}

// Get source directory (where package files are)
function getSourceDir() {
  // Try to resolve the package location first (most reliable for npm installs)
  try {
    const packageJsonPath = require.resolve('@jwdobeutechsolutions/dobeutech-claude-code-custom/package.json');
    const packageDir = path.dirname(packageJsonPath);
    if (fs.existsSync(path.join(packageDir, 'agents'))) {
      return packageDir;
    }
  } catch (err) {
    // Package not found via require.resolve, try other methods
  }
  
  // When installed via npm, files are in node_modules/@jwdobeutechsolutions/dobeutech-claude-code-custom
  // When running from source, files are in the repo root
  const possiblePaths = [
    path.join(__dirname, '..'), // From scripts/install.js -> repo root
    path.join(process.cwd(), 'node_modules', '@jwdobeutechsolutions', 'dobeutech-claude-code-custom'),
    path.join(process.cwd(), 'node_modules', 'dobeutech-claude-code-custom'),
  ];
  
  // Also check global npm locations
  const npmPrefix = process.env.npm_config_prefix || (process.platform === 'win32' 
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'npm')
    : '/usr/local');
  possiblePaths.push(
    path.join(npmPrefix, 'lib', 'node_modules', '@jwdobeutechsolutions', 'dobeutech-claude-code-custom'),
    path.join(npmPrefix, 'node_modules', '@jwdobeutechsolutions', 'dobeutech-claude-code-custom')
  );
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(path.join(possiblePath, 'agents'))) {
      return possiblePath;
    }
  }
  
  // Fallback to __dirname/..
  return path.join(__dirname, '..');
}

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Copy directory recursively
function copyDir(src, dest) {
  try {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to copy directory from ${src} to ${dest}: ${error.message}`);
  }
}

// Create backup of existing configurations
function createBackup(targetDir) {
  if (!fs.existsSync(targetDir)) return null;

  const backupBaseDir = path.join(targetDir, '.backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(backupBaseDir, timestamp);
  
  const dirsToBackup = ['agents', 'skills', 'commands', 'rules', 'templates', 'docs'];
  let createdBackup = false;

  for (const dir of dirsToBackup) {
    const srcPath = path.join(targetDir, dir);
    const destPath = path.join(backupDir, dir);
    
    if (fs.existsSync(srcPath)) {
      if (!createdBackup) {
        log(`Creating backup in ${backupDir}...`, 'blue');
        ensureDir(backupDir);
        createdBackup = true;
      }
      copyDir(srcPath, destPath);
    }
  }

  return createdBackup ? backupDir : null;
}

// Copy file
function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

// Merge JSON files
function mergeJson(targetPath, sourceData, mergeKey) {
  let targetData = {};
  
  if (fs.existsSync(targetPath)) {
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      targetData = JSON.parse(content);
    } catch (err) {
      log(`Warning: Could not parse existing ${path.basename(targetPath)}: ${err.message}`, 'yellow');
    }
  }
  
  // Merge based on structure
  if (mergeKey === 'hooks') {
    // For hooks.json, merge into settings.json
    if (!targetData.hooks) {
      targetData.hooks = {};
    }
    if (sourceData.hooks) {
      // Merge each hook category
      for (const [category, hooks] of Object.entries(sourceData.hooks)) {
        if (!targetData.hooks[category]) {
          targetData.hooks[category] = [];
        }
        // Add new hooks that don't already exist (by matcher)
        const existingMatchers = new Set(
          targetData.hooks[category].map(h => h.matcher).filter(Boolean)
        );
        for (const hook of hooks) {
          if (!hook.matcher || !existingMatchers.has(hook.matcher)) {
            targetData.hooks[category].push(hook);
          }
        }
      }
    }
  } else if (mergeKey === 'mcpServers') {
    // For mcp-servers.json, merge into .claude.json
    if (!targetData.mcpServers) {
      targetData.mcpServers = {};
    }
    if (sourceData.mcpServers) {
      // Merge MCP servers, preserving existing API keys
      for (const [serverName, serverConfig] of Object.entries(sourceData.mcpServers)) {
        if (!targetData.mcpServers[serverName]) {
          targetData.mcpServers[serverName] = serverConfig;
        } else {
          // Preserve existing env vars (API keys)
          if (targetData.mcpServers[serverName].env) {
            serverConfig.env = {
              ...serverConfig.env,
              ...targetData.mcpServers[serverName].env,
            };
          }
          targetData.mcpServers[serverName] = {
            ...serverConfig,
            ...targetData.mcpServers[serverName],
            env: serverConfig.env || targetData.mcpServers[serverName].env,
          };
        }
      }
    }
  }
  
  return targetData;
}

// Main installation function
function install() {
  try {
    const sourceDir = getSourceDir();
    const targetDir = getTargetDir();
    const isGlobal = isGlobalInstall();
    
    log(`\n${colors.bright}Installing Claude Code Configurations${colors.reset}`, 'bright');
    log(`Source: ${sourceDir}`, 'blue');
    log(`Target: ${targetDir}`, 'blue');
    log(`Scope: ${isGlobal ? 'Global' : 'Local'}\n`, 'blue');
    
    // Verify source directory has required files
    if (!fs.existsSync(path.join(sourceDir, 'agents'))) {
      log(`Error: Source directory does not contain 'agents' folder`, 'red');
      log(`Expected: ${path.join(sourceDir, 'agents')}`, 'red');
      process.exit(1);
    }
    
    // Create target directory structure
    ensureDir(targetDir);

    // Create backup before modifying
    createBackup(targetDir);
    
    // Copy directories
    const dirsToCopy = ['agents', 'skills', 'commands', 'rules', 'templates', 'docs'];
    for (const dir of dirsToCopy) {
      const srcPath = path.join(sourceDir, dir);
      const destPath = path.join(targetDir, dir);
      
      if (fs.existsSync(srcPath)) {
        log(`Copying ${dir}/...`, 'green');
        copyDir(srcPath, destPath);
      }
    }
    
    // Handle hooks.json -> settings.json merge
    const hooksSrc = path.join(sourceDir, 'hooks', 'hooks.json');
    if (fs.existsSync(hooksSrc)) {
      log(`Merging hooks into settings.json...`, 'green');
      const hooksData = JSON.parse(fs.readFileSync(hooksSrc, 'utf8'));
      const settingsPath = path.join(targetDir, 'settings.json');
      const mergedSettings = mergeJson(settingsPath, hooksData, 'hooks');
      fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
    }
    
    // Handle mcp-servers.json -> .claude.json merge
    const mcpSrc = path.join(sourceDir, 'mcp-configs', 'mcp-servers.json');
    if (fs.existsSync(mcpSrc)) {
      log(`Merging MCP servers into .claude.json...`, 'green');
      const mcpData = JSON.parse(fs.readFileSync(mcpSrc, 'utf8'));
      const claudeJsonPath = path.join(targetDir, '.claude.json');
      const mergedMcp = mergeJson(claudeJsonPath, mcpData, 'mcpServers');
      fs.writeFileSync(claudeJsonPath, JSON.stringify(mergedMcp, null, 2));
    }
    
    log(`\n${colors.bright}✓ Installation complete!${colors.reset}`, 'green');
    log(`\nConfiguration files installed to: ${targetDir}`, 'blue');
    log(`\nNext steps:`, 'bright');
    log(`1. Review and configure API keys in ${path.join(targetDir, '.claude.json')}`, 'yellow');
    log(`2. Customize settings in ${path.join(targetDir, 'settings.json')} if needed`, 'yellow');
    log(`3. Run 'claude-config update' to sync latest changes`, 'yellow');
    log(``, 'reset');
    
  } catch (error) {
    log(`\n${colors.red}Error during installation:${colors.reset}`, 'red');
    log(error.message, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

// Run installation
install();
