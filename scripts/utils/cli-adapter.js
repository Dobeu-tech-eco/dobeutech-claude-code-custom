#!/usr/bin/env node

/**
 * CLI Adapter - Word-boundary-aware terminology replacement
 * Converts Claude Code-specific references to Codex/Gemini equivalents
 */

const ADAPTATIONS = {
  codex: [
    [/\bClaude Code\b/g, 'Codex CLI'],
    [/\bclaude code\b/g, 'codex cli'],
    [/~\/\.claude\//g, '~/.codex/'],
    [/\bCLAUDE\.md\b/g, 'AGENTS.md'],
    [/\b\.claude\.json\b/g, 'config.toml'],
    [/\bsettings\.json\b/g, 'config.toml'],
    [/\bRead tool\b/g, 'file read'],
    [/\bWrite tool\b/g, 'file write'],
    [/\bBash tool\b/g, 'shell tool'],
    [/\bGlob tool\b/g, 'file search'],
    [/\bGrep tool\b/g, 'content search'],
    [/\bEdit tool\b/g, 'file edit'],
    [/\bTask tool\b/g, 'agent delegation'],
  ],
  gemini: [
    [/\bClaude Code\b/g, 'Gemini CLI'],
    [/\bclaude code\b/g, 'gemini cli'],
    [/~\/\.claude\//g, '~/.gemini/'],
    [/\bCLAUDE\.md\b/g, 'GEMINI.md'],
    [/\b\.claude\.json\b/g, 'settings.json'],
    [/\bRead tool\b/g, 'read_file tool'],
    [/\bWrite tool\b/g, 'write_file tool'],
    [/\bBash tool\b/g, 'shell tool'],
    [/\bGlob tool\b/g, 'file search tool'],
    [/\bGrep tool\b/g, 'search tool'],
    [/\bEdit tool\b/g, 'edit_file tool'],
    [/\bTask tool\b/g, 'skill invocation'],
  ],
};

/**
 * Apply CLI-specific terminology replacements to markdown content
 */
function adaptContent(content, target) {
  const rules = ADAPTATIONS[target];
  if (!rules) return content;

  let result = content;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

module.exports = { adaptContent, ADAPTATIONS };
