#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { adaptContent } = require('../utils/cli-adapter');

/**
 * Parse YAML-ish frontmatter from a markdown file
 * Returns { frontmatter: {}, body: string }
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kvMatch) {
      let value = kvMatch[2].trim();
      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[kvMatch[1]] = value;
    }
  }

  return { frontmatter, body: match[2] };
}

/**
 * Read all agent .md files from the agents directory
 */
function readAgents(agentsDir) {
  if (!fs.existsSync(agentsDir)) return [];

  return fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);
      return {
        filename: f,
        name: frontmatter.name || f.replace('.md', ''),
        description: frontmatter.description || '',
        model: frontmatter.model || 'sonnet',
        body,
        raw: content,
      };
    });
}

/**
 * Generate a summary table of agents for Codex instructions
 */
function toCodexSummary(agentsDir) {
  const agents = readAgents(agentsDir);
  if (agents.length === 0) return '';

  const lines = [
    '## Available Roles',
    '',
    'When working on tasks, adopt the appropriate role:',
    '',
    '| Role | Purpose |',
    '|------|---------|',
  ];

  for (const agent of agents) {
    const desc = agent.description.split('.')[0] || agent.name;
    lines.push(`| ${agent.name} | ${desc} |`);
  }

  lines.push('');

  // Include full content of key agents
  const keyAgents = ['planner', 'code-reviewer', 'tdd-guide', 'security-reviewer', 'build-error-resolver', 'architect'];
  for (const agent of agents) {
    const agentKey = agent.filename.replace('.md', '');
    if (keyAgents.includes(agentKey)) {
      lines.push(`### ${agent.name} Role`);
      lines.push('');
      const adapted = adaptContent(agent.body, 'codex');
      lines.push(adapted.trim());
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Convert agents to Codex SKILL.md format
 * Only converts the most universally useful agents
 */
function toCodexSkills(agentsDir, targetSkillsDir) {
  const agents = readAgents(agentsDir);
  const codexSkillAgents = [
    'planner', 'code-reviewer', 'tdd-guide', 'security-reviewer',
    'build-error-resolver', 'architect', 'refactor-cleaner',
  ];

  for (const agent of agents) {
    const agentKey = agent.filename.replace('.md', '');
    if (!codexSkillAgents.includes(agentKey)) continue;

    const skillDir = path.join(targetSkillsDir, agentKey);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    const adapted = adaptContent(agent.body, 'codex');
    const skillMd = [
      '---',
      `name: ${agentKey}`,
      `description: ${agent.description || agent.name}`,
      '---',
      '',
      adapted.trim(),
      '',
    ].join('\n');

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);
  }
}

/**
 * Convert agents to Gemini skill directories with SKILL.md
 */
function toGeminiSkills(agentsDir, targetSkillsDir) {
  const agents = readAgents(agentsDir);

  for (const agent of agents) {
    const agentKey = agent.filename.replace('.md', '');
    const skillDir = path.join(targetSkillsDir, agentKey);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    const adapted = adaptContent(agent.body, 'gemini');
    const skillMd = [
      '---',
      `name: ${agentKey}`,
      `description: ${agent.description || agent.name}`,
      '---',
      '',
      adapted.trim(),
      '',
    ].join('\n');

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);
  }
}

/**
 * Convert source skills to Gemini skill directories
 */
function convertSkillsToGemini(skillsDir, targetSkillsDir) {
  if (!fs.existsSync(skillsDir)) return;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(skillsDir, entry.name);

    if (entry.isDirectory()) {
      // Already a skill directory with SKILL.md
      const skillMdPath = path.join(srcPath, 'SKILL.md');
      if (fs.existsSync(skillMdPath)) {
        const destDir = path.join(targetSkillsDir, entry.name);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const content = fs.readFileSync(skillMdPath, 'utf8');
        const adapted = adaptContent(content, 'gemini');
        fs.writeFileSync(path.join(destDir, 'SKILL.md'), adapted);
      }
    } else if (entry.name.endsWith('.md')) {
      // Standalone .md skill — wrap in directory
      const skillName = entry.name.replace('.md', '');
      const destDir = path.join(targetSkillsDir, skillName);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      const content = fs.readFileSync(srcPath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);
      const adapted = adaptContent(body, 'gemini');

      const skillMd = [
        '---',
        `name: ${frontmatter.name || skillName}`,
        `description: ${frontmatter.description || skillName}`,
        '---',
        '',
        adapted.trim(),
        '',
      ].join('\n');

      fs.writeFileSync(path.join(destDir, 'SKILL.md'), skillMd);
    }
  }
}

module.exports = {
  parseFrontmatter,
  readAgents,
  toCodexSummary,
  toCodexSkills,
  toGeminiSkills,
  convertSkillsToGemini,
};
