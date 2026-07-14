#!/usr/bin/env pwsh
# PostToolUse hook - matcher: "Edit|Write"
#
# Reads the Claude Code hook payload from stdin:
#   { "tool_name": "Write", "tool_input": { "file_path": "..." }, ... }
#
# For .ts/.tsx/.js/.jsx only: warn (stderr) with the line numbers of any console.log.
# WARN ONLY: always exit 0. Never blocks.

Set-StrictMode -Off
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$MaxFileBytes = 2MB
$MaxReported = 10

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json -ErrorAction Stop
    $file = $payload.tool_input.file_path
    if ([string]::IsNullOrWhiteSpace($file)) { exit 0 }

    # FAST PATH: not a JS/TS source file -> leave immediately, silently.
    if ($file -notmatch '(?i)\.(ts|tsx|js|jsx)$') { exit 0 }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { exit 0 }

    $item = Get-Item -LiteralPath $file -ErrorAction Stop
    if ($item.Length -gt $MaxFileBytes) { exit 0 }

    $lines = [System.IO.File]::ReadAllLines($item.FullName)
    $hits = [System.Collections.Generic.List[string]]::new()

    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match 'console\.log') {
            $snippet = $lines[$i].Trim()
            if ($snippet.Length -gt 100) { $snippet = $snippet.Substring(0, 100) + '...' }
            $hits.Add("  line $($i + 1): $snippet")
        }
    }

    if ($hits.Count -gt 0) {
        [Console]::Error.WriteLine("[Hook] WARNING: console.log found in $($item.Name) ($($hits.Count) occurrence(s)):")
        $hits | Select-Object -First $MaxReported | ForEach-Object { [Console]::Error.WriteLine($_) }
        if ($hits.Count -gt $MaxReported) {
            [Console]::Error.WriteLine("  ... and $($hits.Count - $MaxReported) more")
        }
        [Console]::Error.WriteLine('[Hook] Remove console.log before committing. (Warning only - nothing was blocked.)')
    }

    exit 0
}
catch {
    exit 0
}
