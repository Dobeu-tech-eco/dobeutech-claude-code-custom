#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { adaptContent } = require('../utils/cli-adapter');

// Concatenation order (priority)
const RULE_ORDER = [
  'startup',
  'coding-style',
  'security',
  'testing',
  'git-workflow',
  'patterns',
  'performance',
  'agents',
  'hooks',
];

// Sections to skip per target
const SKIP_SECTIONS = {
  codex: ['hooks'],
  gemini: ['hooks'],
};

/**
 * Concatenate all rules into a single instructions document
 */
function concatenateRules(rulesDir, target) {
  const skipList = SKIP_SECTIONS[target] || [];
  const lines = [
    `# Development Guidelines`,
    '',
    `> Auto-generated from dobeutech-claude-code-custom. Do not edit directly.`,
    '',
  ];

  for (const ruleName of RULE_ORDER) {
    if (skipList.includes(ruleName)) continue;

    const filePath = path.join(rulesDir, `${ruleName}.md`);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8').trim();
    content = adaptContent(content, target);

    // For codex/gemini: adapt the agents section
    if (ruleName === 'agents' && target === 'codex') {
      content = adaptAgentsForCodex(content);
    }
    if (ruleName === 'agents' && target === 'gemini') {
      content = adaptAgentsForGemini(content);
    }

    lines.push(content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * For Codex: replace agent dispatch references with behavioral roles
 */
function adaptAgentsForCodex(content) {
  return content
    .replace(/Use \*\*(\w[\w-]*)\*\* agent/g, 'Apply the **$1** role')
    .replace(/Located in `~\/\.codex\/agents\/`:/g, 'Available behavioral roles:')
    .replace(/## Immediate Agent Usage/g, '## Automatic Role Selection')
    .replace(/No user prompt needed:/g, 'Automatically adopt the right role:');
}

/**
 * For Gemini: replace agent references with skill references
 */
function adaptAgentsForGemini(content) {
  return content
    .replace(/Use \*\*(\w[\w-]*)\*\* agent/g, 'Use the **$1** skill')
    .replace(/Located in `~\/\.gemini\/agents\/`:/g, 'Available skills in `~/.gemini/skills/`:')
    .replace(/## Immediate Agent Usage/g, '## Automatic Skill Selection')
    .replace(/\bagent\b/g, 'skill')
    .replace(/\bAgent\b/g, 'Skill');
}

module.exports = { concatenateRules, RULE_ORDER };
