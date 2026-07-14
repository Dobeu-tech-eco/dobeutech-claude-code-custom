#!/usr/bin/env pwsh
# PreToolUse hook - matcher: "Bash"
#
# Fires on EVERY Bash tool call, so the non-commit fast path must be cheap and silent.
# Reads the Claude Code hook payload from stdin:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, "cwd": "..." }
#
# If the command is a `git commit`, scans staged files for secrets.
# BLOCKING: exit 1 on a hit (aborts the commit). Otherwise exit 0.
# Fails open: no git, no repo, malformed payload, or any unexpected error -> exit 0 silently.

Set-StrictMode -Off
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

# ---------- secret patterns ----------
# Generic assignment of a long opaque value to a secret-ish name.
$GenericPattern = '(?i)(api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*["'']?[A-Za-z0-9_\-]{20,}'
# Known vendor key prefixes - flag on sight.
$PrefixPatterns = @(
    'ghp_[A-Za-z0-9]{8,}'          # GitHub personal access token
    'sk-proj-[A-Za-z0-9_\-]{8,}'   # OpenAI project key
    'sk-ant-[A-Za-z0-9_\-]{8,}'    # Anthropic key
    'ntn_[A-Za-z0-9]{8,}'          # Notion integration token
    'tvly-[A-Za-z0-9_\-]{8,}'      # Tavily key
)

$MaxFileBytes = 2MB   # skip anything bigger; it is not hand-written source

try {
    # ---------- read + parse payload ----------
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json -ErrorAction Stop
    $cmd = $payload.tool_input.command
    if ([string]::IsNullOrWhiteSpace($cmd)) { exit 0 }

    # ---------- FAST PATH: not a git commit -> leave immediately, silently ----------
    if ($cmd -notmatch '(?i)\bgit\b[\s\S]*?\bcommit\b') { exit 0 }

    # ---------- locate the repo ----------
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { exit 0 }

    $workDir = $payload.cwd
    if ([string]::IsNullOrWhiteSpace($workDir) -or -not (Test-Path -LiteralPath $workDir)) {
        $workDir = (Get-Location).Path
    }

    $repoRoot = & git -C "$workDir" rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) { exit 0 }  # not a git repo
    $repoRoot = $repoRoot.Trim()

    # Added / Copied / Modified / Renamed - deletions have nothing to scan.
    $staged = & git -C "$repoRoot" diff --cached --name-only --diff-filter=ACMR 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $staged) { exit 0 }

    # ---------- scan ----------
    $findings = [System.Collections.Generic.List[string]]::new()

    foreach ($rel in $staged) {
        if ([string]::IsNullOrWhiteSpace($rel)) { continue }
        $full = Join-Path $repoRoot $rel.Trim()
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }

        $info = Get-Item -LiteralPath $full -ErrorAction SilentlyContinue
        if (-not $info -or $info.Length -gt $MaxFileBytes) { continue }

        $lines = [System.IO.File]::ReadAllLines($full)
        for ($i = 0; $i -lt $lines.Length; $i++) {
            $line = $lines[$i]
            if ([string]::IsNullOrWhiteSpace($line)) { continue }

            $hit = $null
            if ($line -match $GenericPattern) {
                $hit = 'secret-like assignment'
            }
            else {
                foreach ($p in $PrefixPatterns) {
                    if ($line -match $p) { $hit = "known key prefix ($($Matches[0].Substring(0, [Math]::Min(12, $Matches[0].Length)))...)"; break }
                }
            }

            if ($hit) {
                $snippet = $line.Trim()
                if ($snippet.Length -gt 100) { $snippet = $snippet.Substring(0, 100) + '...' }
                $findings.Add("  $rel`:$($i + 1)  [$hit]`n      $snippet")
            }
        }
    }

    if ($findings.Count -gt 0) {
        [Console]::Error.WriteLine('[Hook] BLOCKED: potential secrets detected in staged files.')
        foreach ($f in $findings) { [Console]::Error.WriteLine($f) }
        [Console]::Error.WriteLine('[Hook] Unstage or scrub these values before committing.')
        [Console]::Error.WriteLine('[Hook] If this is a false positive, move the value to an env var or .env (gitignored).')
        exit 1
    }

    exit 0
}
catch {
    # Never break the user's commit because the hook itself broke.
    exit 0
}
