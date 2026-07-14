#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ensureDir, log, copyDir } = require('../utils/merge-utils');

class BaseGenerator {
  constructor(sourceDir, options = {}) {
    this.sourceDir = sourceDir;
    this.dryRun = options.dryRun || false;
  }

  // Snapshot the dirs we are about to overwrite, so a bad install is recoverable.
  createBackup(dirs) {
    if (!fs.existsSync(this.targetDir)) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.targetDir, '.backup', timestamp);
    let backedUp = false;

    for (const dir of dirs) {
      const srcPath = path.join(this.targetDir, dir);
      if (!fs.existsSync(srcPath)) continue;

      if (!backedUp) {
        if (this.dryRun) {
          log(`[DRY RUN] Would back up to ${backupDir}`, 'yellow');
          return null;
        }
        log(`Backing up existing config to ${backupDir}...`, 'blue');
        ensureDir(backupDir);
        backedUp = true;
      }
      copyDir(srcPath, path.join(backupDir, dir));
    }

    return backedUp ? backupDir : null;
  }

  get targetName() {
    throw new Error('Override targetName in subclass');
  }

  get targetDir() {
    throw new Error('Override targetDir in subclass');
  }

  install() {
    throw new Error('Override install() in subclass');
  }

  readSource(relativePath) {
    const fullPath = path.join(this.sourceDir, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  }

  writeTarget(relativePath, content) {
    const fullPath = path.join(this.targetDir, relativePath);
    if (this.dryRun) {
      log(`[DRY RUN] Would write: ${fullPath}`, 'yellow');
      return;
    }
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content);
  }

  readExistingTarget(relativePath) {
    const fullPath = path.join(this.targetDir, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  }

  sourceExists(relativePath) {
    return fs.existsSync(path.join(this.sourceDir, relativePath));
  }

  targetExists(relativePath) {
    return fs.existsSync(path.join(this.targetDir, relativePath));
  }
}

module.exports = { BaseGenerator };
