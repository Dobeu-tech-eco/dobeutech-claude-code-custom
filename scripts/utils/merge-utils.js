#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDir(src, dest) {
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
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    log(`Warning: Could not parse ${path.basename(filePath)}: ${err.message}`, 'yellow');
    return {};
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function mergeHooks(targetPath, sourceData) {
  const targetData = readJsonSafe(targetPath);
  if (!targetData.hooks) {
    targetData.hooks = {};
  }
  if (sourceData.hooks) {
    for (const [category, hooks] of Object.entries(sourceData.hooks)) {
      if (!targetData.hooks[category]) {
        targetData.hooks[category] = [];
      }
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
  return targetData;
}

function mergeMcpServers(targetPath, sourceData) {
  const targetData = readJsonSafe(targetPath);
  if (!targetData.mcpServers) {
    targetData.mcpServers = {};
  }
  if (sourceData.mcpServers) {
    for (const [serverName, serverConfig] of Object.entries(sourceData.mcpServers)) {
      if (!targetData.mcpServers[serverName]) {
        targetData.mcpServers[serverName] = serverConfig;
      } else {
        const existingEnv = targetData.mcpServers[serverName].env || {};
        const newEnv = serverConfig.env || {};
        targetData.mcpServers[serverName] = {
          ...serverConfig,
          ...targetData.mcpServers[serverName],
          env: { ...newEnv, ...existingEnv },
        };
      }
    }
  }
  return targetData;
}

module.exports = {
  colors,
  log,
  ensureDir,
  copyDir,
  copyFile,
  readJsonSafe,
  writeJson,
  mergeHooks,
  mergeMcpServers,
};
