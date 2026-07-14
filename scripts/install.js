#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { colors, log } = require('./utils/merge-utils');
const { ClaudeGenerator } = require('./generators/claude-generator');
const { CodexGenerator } = require('./generators/codex-generator');
const { GeminiGenerator } = require('./generators/gemini-generator');

// Detect installation scope
function isGlobalInstall() {
  if (process.env.npm_config_global === 'true') {
    return true;
  }
  const installPath = __dirname;
  const globalPaths = [
    path.join(os.homedir(), '.npm'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm'),
    '/usr/local/lib/node_modules',
    '/usr/lib/node_modules',
  ];
  return globalPaths.some(globalPath => installPath.includes(globalPath));
}

// Get source directory (where package files are)
function getSourceDir() {
  try {
    const packageJsonPath = require.resolve('@jwdobeutechsolutions/dobeutech-claude-code-custom/package.json');
    const packageDir = path.dirname(packageJsonPath);
    if (fs.existsSync(path.join(packageDir, 'agents'))) {
      return packageDir;
    }
  } catch (err) {
    // Package not found via require.resolve, try other methods
  }

  const possiblePaths = [
    path.join(__dirname, '..'),
    path.join(process.cwd(), 'node_modules', '@jwdobeutechsolutions', 'dobeutech-claude-code-custom'),
    path.join(process.cwd(), 'node_modules', 'dobeutech-claude-code-custom'),
  ];

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

  return path.join(__dirname, '..');
}

// Parse --target flag from args
function parseTarget() {
  const args = process.argv.slice(2);

  // Check for --target=value or --target value
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--target=')) {
      return args[i].split('=')[1];
    }
    if (args[i] === '--target' && args[i + 1]) {
      return args[i + 1];
    }
  }

  // Default: if invoked via npm postinstall, only install Claude
  if (process.env.npm_lifecycle_event === 'postinstall') {
    return 'claude';
  }

  // Default when run directly: all targets
  return 'all';
}

// Parse --dry-run flag
function isDryRun() {
  return process.argv.includes('--dry-run');
}

// Generator registry
const GENERATORS = {
  claude: ClaudeGenerator,
  codex: CodexGenerator,
  gemini: GeminiGenerator,
};

function install() {
  try {
    const sourceDir = getSourceDir();
    const target = parseTarget();
    const dryRun = isDryRun();
    const isGlobal = isGlobalInstall();

    const targets = target === 'all' ? Object.keys(GENERATORS) : [target];

    log(`\n${colors.bright}Installing AI CLI Configurations${colors.reset}`, 'bright');
    log(`Source: ${sourceDir}`, 'blue');
    log(`Targets: ${targets.join(', ')}`, 'blue');
    log(`Scope: ${isGlobal ? 'Global' : 'Local'}`, 'blue');
    if (dryRun) log(`Mode: DRY RUN`, 'yellow');
    log('', 'reset');

    // Verify source directory
    if (!fs.existsSync(path.join(sourceDir, 'agents'))) {
      log(`Error: Source directory does not contain 'agents' folder`, 'red');
      log(`Expected: ${path.join(sourceDir, 'agents')}`, 'red');
      process.exit(1);
    }

    let success = true;
    for (const t of targets) {
      const GeneratorClass = GENERATORS[t];
      if (!GeneratorClass) {
        log(`Unknown target: ${t}`, 'red');
        log(`Valid targets: ${Object.keys(GENERATORS).join(', ')}, all`, 'yellow');
        success = false;
        continue;
      }

      const gen = new GeneratorClass(sourceDir, { dryRun, isGlobal });
      if (!gen.install()) {
        success = false;
      }
    }

    if (success) {
      log(`\n${colors.bright}✓ All installations complete!${colors.reset}`, 'green');
    } else {
      log(`\n${colors.yellow}⚠ Some installations had issues${colors.reset}`, 'yellow');
    }

    log(`\nNext steps:`, 'bright');
    if (targets.includes('claude')) {
      log(`  Claude: Review API keys in ~/.claude.json (home root, NOT ~/.claude/)`, 'yellow');
    }
    if (targets.includes('codex')) {
      log(`  Codex:  Check ~/.codex/AGENTS.md and config.toml`, 'yellow');
    }
    if (targets.includes('gemini')) {
      log(`  Gemini: Check ~/.gemini/GEMINI.md and settings.json`, 'yellow');
    }
    log('', 'reset');

  } catch (error) {
    log(`\nError during installation:`, 'red');
    log(error.message, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

install();
