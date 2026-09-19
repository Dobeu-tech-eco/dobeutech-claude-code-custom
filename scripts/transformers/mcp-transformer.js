#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Convert a single MCP server config to TOML block string
 */
function serverToToml(name, config) {
  const lines = [];

  // Normalize the server name for TOML (replace hyphens, keep dots safe)
  const tomlName = name.includes('-') ? `"${name}"` : name;
  lines.push(`[mcp_servers.${tomlName}]`);

  if (config.command) {
    lines.push(`command = ${JSON.stringify(config.command)}`);
  }
  if (config.args && config.args.length > 0) {
    lines.push(`args = ${JSON.stringify(config.args)}`);
  }
  if (config.type === 'http' && config.url) {
    lines.push(`url = ${JSON.stringify(config.url)}`);
  } else if (config.url && !config.command) {
    lines.push(`url = ${JSON.stringify(config.url)}`);
  }

  if (config.env && Object.keys(config.env).length > 0) {
    lines.push('');
    lines.push(`[mcp_servers.${tomlName}.env]`);
    for (const [key, value] of Object.entries(config.env)) {
      lines.push(`${key} = ${JSON.stringify(String(value))}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get existing MCP server names from a TOML file (regex-based, no parser needed)
 */
function getExistingTomlMcpServers(tomlContent) {
  const regex = /^\[mcp_servers\.([^\]]+)\]/gm;
  const names = new Set();
  let match;
  while ((match = regex.exec(tomlContent)) !== null) {
    // Handle quoted and unquoted names, strip .env sub-tables
    let name = match[1].replace(/^"([^"]+)"/, '$1').split('.')[0];
    names.add(name);
  }
  return names;
}

/**
 * Append MCP servers to an existing config.toml file (string-append strategy)
 * Returns the updated TOML string
 */
function appendTomlMcpServers(existingToml, mcpServers) {
  const existingNames = getExistingTomlMcpServers(existingToml);
  const newBlocks = [];

  for (const [name, config] of Object.entries(mcpServers)) {
    if (existingNames.has(name)) continue;
    newBlocks.push('');
    newBlocks.push(serverToToml(name, config));
  }

  if (newBlocks.length === 0) return existingToml;

  // Ensure file ends with newline before appending
  let result = existingToml.trimEnd();
  result += '\n' + newBlocks.join('\n') + '\n';
  return result;
}

/**
 * Convert MCP servers to Gemini settings.json format
 * Transforms: { type: "http", url } → { httpUrl }
 */
function toGeminiFormat(mcpServers) {
  const result = {};

  for (const [name, config] of Object.entries(mcpServers)) {
    const geminiConfig = {};

    if (config.type === 'http' && config.url) {
      geminiConfig.httpUrl = config.url;
    } else if (config.url && !config.command) {
      geminiConfig.httpUrl = config.url;
    } else {
      if (config.command) geminiConfig.command = config.command;
      if (config.args) geminiConfig.args = config.args;
    }

    if (config.env && Object.keys(config.env).length > 0) {
      geminiConfig.env = { ...config.env };
    }

    result[name] = geminiConfig;
  }

  return result;
}

module.exports = {
  serverToToml,
  getExistingTomlMcpServers,
  appendTomlMcpServers,
  toGeminiFormat,
};
