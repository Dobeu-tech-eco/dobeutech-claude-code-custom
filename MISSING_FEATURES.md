# Missing Features & Improvements

## BLOCKING — Hooks are not actually installable (v2.0.0)

The v2 hooks (`hooks/*.ps1` + `hooks/hooks.json`) are correct and work when wired up by hand, but
**the installer cannot deliver them.** Two independent gaps, both verified by reading the code.
Until both are fixed, hooks require the manual setup documented in [hooks/README.md](hooks/README.md).

### H1. `hooks/` is never copied to the target directory
**Status**: Broken
**Priority**: BLOCKING
**Where**: `scripts/generators/claude-generator.js:43`

```js
const dirsToCopy = ['agents', 'skills', 'commands', 'rules', 'templates', 'docs'];
```

`hooks` is not in the list. The generator reads `hooks/hooks.json` in place (from the package dir)
and merges it into `settings.json`, but **`hooks/*.ps1` is never copied to `~/.claude/hooks/`**.
The hook commands therefore point at scripts that do not exist at the destination.

**Fix**: add `hooks` to `dirsToCopy`, or copy `hooks/*.ps1` explicitly (excluding `legacy/`).

### H2. `mergeHooks()` performs no path substitution
**Status**: Broken
**Priority**: BLOCKING
**Where**: `scripts/utils/merge-utils.js:60` (`mergeHooks`)

`mergeHooks()` splices hook objects from `hooks.json` into `settings.json` **verbatim**,
deduplicating only on the `matcher` string. It never inspects or rewrites the `command` field.

`hooks/hooks.json` deliberately ships a portable placeholder rather than a hardcoded absolute path
(committing `C:/Users/<someone>/...` violates the portability rule in `CONTRIBUTING.md`):

```json
"command": "pwsh -NoProfile -File ${CLAUDE_CONFIG_DIR}/hooks/pre-commit-secret-scan.ps1"
```

`${CLAUDE_CONFIG_DIR}` is **not** expanded by Claude Code and **not** expanded by `mergeHooks()`.
It is a token the *installer* must substitute.

**Fix**: before calling `mergeHooks()`, walk `hooksData.hooks[*][*].hooks[*].command` and replace
`${CLAUDE_CONFIG_DIR}` with the resolved `targetDir` (`~/.claude` global, `./.claude` local).
Without this, hooks land in `settings.json` pointing at a literal nonexistent path and silently
never fire.

### H3. `--dry-run` is honored by the generators but not parsed from argv
**Status**: Partial
**Priority**: High
**Where**: `scripts/generators/base-generator.js:10` reads `options.dryRun`, and every generator
respects it — but `scripts/install.js` does not parse a `--dry-run` flag into that option.
The flag is documented in the README as the safe-preview path, so the argv plumbing needs to exist.

### H4. Three commands shadow Claude Code built-ins and are still shipped
**Status**: Unresolved
**Priority**: High

`commands/login.md`, `commands/plan.md`, and `commands/code-review.md` override the built-in
`/login`, `/plan`, and `/code-review`. Overriding `/login` in particular can lock a user out of
re-authenticating. The working local config at `~/.claude/commands/` resolves this by **omitting
`login` and `plan` entirely** and shipping `code-review` as **`code-review-strict.md`** — but the
repo still carries all three under their shadowing names, and `.claude-plugin/plugin.json` still
declares them (it is required to mirror what is on disk).

**Fix (decide one)**:
- delete `commands/login.md` + `commands/plan.md`, rename `commands/code-review.md` →
  `commands/code-review-strict.md`, and drop/rename them in `plugin.json`; **or**
- keep the files but add an installer exclusion list so they are never copied to
  `~/.claude/commands/`.

Documented as a manual post-install cleanup in the README until resolved.

## Identified Missing Features

### 1. Uninstall Script/Command
**Status**: Missing  
**Priority**: Medium  
**Description**: No way to uninstall the package and remove configurations  
**Solution**: Add `claude-config uninstall` command that:
- Removes installed files
- Optionally backs up before removal
- Cleans up merged configurations

### 2. Backup Before Installation
**Status**: Missing  
**Priority**: High  
**Description**: No backup of existing configurations before installation  
**Solution**: Add automatic backup to `~/.claude/.backup/` before installation

### 3. Selective Component Installation
**Status**: Missing  
**Priority**: Low  
**Description**: Must install all components, cannot choose specific ones  
**Solution**: Add flags like `--agents-only`, `--commands-only`, or `--select=agents,commands`

### 4. Configuration Wizard for API Keys
**Status**: Missing  
**Priority**: Medium  
**Description**: No interactive wizard to configure API keys  
**Solution**: Add `claude-config setup` command that:
- Prompts for API keys
- Validates keys
- Updates `.claude.json`

### 5. Validation of Installed Components
**Status**: Partial  
**Priority**: Medium  
**Description**: Basic validation exists, but could be more comprehensive  
**Solution**: Add validation that:
- Checks file integrity
- Verifies frontmatter format
- Validates JSON syntax
- Checks for required fields

### 6. Rollback Functionality
**Status**: Missing  
**Priority**: Medium  
**Description**: Cannot rollback to previous version  
**Solution**: Add `claude-config rollback` that:
- Lists previous versions
- Restores from backup
- Reinstalls specific version

### 7. Version Comparison/Diff
**Status**: Missing  
**Priority**: Low  
**Description**: Cannot see what changed between versions  
**Solution**: Add `claude-config diff` command that shows changes

### 8. Migration from Manual Installation
**Status**: Missing  
**Priority**: Low  
**Description**: No migration path for users with manual installations  
**Solution**: Add migration script that:
- Detects existing manual installation
- Backs up existing configs
- Merges with package configs

## Documentation Gaps

### 1. Troubleshooting Guide
**Status**: Partial (exists in docs/troubleshooting.md)  
**Priority**: Medium  
**Action**: Ensure troubleshooting.md is comprehensive and linked from README

### 2. Common Error Solutions
**Status**: Missing  
**Priority**: High  
**Description**: No centralized list of common errors and solutions  
**Solution**: Add to troubleshooting.md:
- Permission errors
- Installation failures
- CLI command errors
- Configuration merge issues

### 3. Browser-Based Installation Guide
**Status**: Created (BROWSER_INSTALLATION_ANALYSIS.md)  
**Priority**: High  
**Action**: Link from README and add to docs/

### 4. Migration Guide from Manual Install
**Status**: Missing  
**Priority**: Low  
**Solution**: Create docs/MIGRATION.md

### 5. API Key Configuration Guide
**Status**: Missing  
**Priority**: Medium  
**Solution**: Create docs/API_KEYS.md with:
- How to get API keys
- Where to configure them
- Security best practices

### 6. Uninstall Instructions
**Status**: Missing  
**Priority**: Medium  
**Solution**: Add to README and create uninstall command

## Error Handling Improvements

### 1. Network Failures During Install
**Status**: Basic  
**Priority**: Medium  
**Improvement**: Add retry logic and better error messages

### 2. Permission Denied Errors
**Status**: Basic  
**Priority**: High  
**Improvement**: 
- Clear error messages
- Suggestions for fixing permissions
- Alternative installation methods

### 3. Missing Dependencies
**Status**: Not applicable (no dependencies)  
**Priority**: N/A

### 4. Corrupted Package
**Status**: Basic  
**Priority**: Low  
**Improvement**: Add integrity checks

### 5. Invalid Configurations
**Status**: Partial  
**Priority**: Medium  
**Improvement**: 
- Validate JSON before merging
- Better error messages
- Recovery suggestions

## Postinstall Script Issues

### 1. Postinstall Not Running Automatically
**Status**: Identified  
**Priority**: High  
**Issue**: Postinstall script doesn't always run during `npm install`  
**Solution**: 
- Document manual run: `node node_modules/@jwdobeutechsolutions/dobeutech-claude-code-custom/scripts/install.js`
- Add note in README
- Consider alternative installation method

## Future Enhancements

### 1. Cloud Sync
**Priority**: Low  
**Description**: Sync configurations across devices via cloud

### 2. Web UI
**Priority**: Low  
**Description**: Web-based configuration manager

### 3. Browser Extension
**Priority**: Low  
**Description**: Browser extension for managing configurations

### 4. Configuration Templates
**Priority**: Low  
**Description**: Pre-configured templates for different use cases

### 5. Auto-Updates
**Priority**: Low  
**Description**: Automatic updates with notifications

## Immediate Actions Required

1. ✅ Create missing command files (migrate-db, test-integration, docs-arch)
2. ✅ Create missing skill files (api-design-patterns, database-patterns, memory-management)
3. ✅ Document browser installation scenario
4. ✅ Add backup functionality to install script
5. ✅ Improve error handling and messages
6. ✅ Document postinstall script manual execution
7. ✅ Add uninstall command
8. ✅ Create API key configuration guide

## Notes

- Most critical missing feature is backup before installation
- Postinstall script issue needs documentation
- Browser-based installation limitations are documented
- Missing files have been created
