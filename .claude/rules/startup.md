# Session Startup & Context Priming

## Session Boot Sequence

Execute these steps at the START of every new session. Adapt depth to the task -- skip steps that don't apply (e.g., skip backend checks for a docs-only task).

### Step 1: Orient

- Note the working directory and confirm it matches the expected project.
- Read `CLAUDE.md` / `AGENTS.md` if present -- these contain project-specific instructions that override defaults.

### Step 2: Assess Project Context

Gather situational awareness (use parallel reads where possible):

- **Package metadata**: `package.json` (name, version, scripts, dependencies)
- **Tech stack**: Detect framework, build tools, test runner, linter, formatter, database, ORM
- **Git state**: Current branch, uncommitted changes, recent commits (`git log --oneline -10`)
- **Known issues**: Check for TODO files, progress files (`.agent/claude-progress.txt`), or issue trackers

### Step 3: Health Check

Before writing code, verify the project is in a working state:

- **Dependencies**: `node_modules` exists and lockfile is current; run install if missing
- **Build**: Confirm the project builds cleanly (or note existing build errors)
- **Type checking**: Run the project's type checker if available
- **Lint/format**: Check for pre-existing lint or format violations
- **Dev server**: If the task requires a running app, start it (prefer tmux for long-running processes)

If problems are found, fix them BEFORE starting new work. Use the **build-error-resolver** agent for stubborn build failures.

### Step 4: Session Continuity

Check for prior session context to avoid duplicating or undoing previous work:

- **Progress files**: Read `.agent/claude-progress.txt` or similar session logs if they exist
- **Feature tracking**: Read `.agent/feature_list.json` or project task boards if present
- **Git history**: Review recent commits for context on what was changed and why
- **Open PRs/branches**: Note any in-flight work that might conflict

### Step 5: Route to Agent

Based on the user's request, select the right approach:

| Signal | Action |
|--------|--------|
| Complex feature request | Use **planner** agent before coding |
| Bug fix or new feature | Use **tdd-guide** agent (tests first) |
| Architectural decision | Use **architect** agent |
| Code just written/modified | Use **code-reviewer** agent |
| Build failure | Use **build-error-resolver** agent |
| Security-sensitive change | Use **security-reviewer** agent |
| E2E test needed | Use **e2e-runner** agent |
| Dead code / cleanup | Use **refactor-cleaner** agent |
| Documentation update | Use **doc-updater** agent |

These triggers are automatic -- no user prompt needed to invoke the appropriate agent.

### Step 6: Backend & Infrastructure (if applicable)

When the task involves backend services:

- Check for `.env` with valid credentials (not placeholders)
- Verify database connectivity
- Check for unapplied migrations (`supabase/migrations/`, `prisma/migrations/`, `db/migrations/`)
- Apply migrations if tooling is available; document manual steps if not
- Test basic CRUD operations before building on top of them

## Session Cleanup

Before ending a session:

1. Ensure all changes are saved and committed (conventional commit format)
2. Run the project's check/lint/test commands to verify nothing is broken
3. If session progress tracking exists (`.agent/claude-progress.txt`), update it with:
   - What was accomplished
   - Issues encountered
   - Recommendations for the next session
4. Leave the codebase in a clean, working state -- no half-implemented features

## Context Priming Strategy

For deep sessions on unfamiliar projects, load context in this priority order:

1. **CLAUDE.md / AGENTS.md** -- project-specific instructions (highest priority)
2. **Package metadata** -- name, version, scripts, tech stack
3. **Architecture docs** -- directory structure, key abstractions
4. **Recent changes** -- git log, open PRs
5. **Test infrastructure** -- test framework, coverage thresholds, how to run tests
6. **Conventions** -- linter config, formatter config, TypeScript strictness

Keep context loading under ~8000 tokens to preserve working memory for the actual task.
