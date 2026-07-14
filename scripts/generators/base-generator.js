#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ensureDir, log } = require('../utils/merge-utils');

class BaseGenerator {
  constructor(sourceDir, options = {}) {
    this.sourceDir = sourceDir;
    this.dryRun = options.dryRun || false;
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
