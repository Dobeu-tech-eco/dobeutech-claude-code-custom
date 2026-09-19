#!/usr/bin/env pwsh
# PostToolUse hook - matcher: "Edit|Write"
#
# Reads the Claude Code hook payload from stdin:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# For .ts/.tsx/.js/.jsx only:
#   1. prettier --write <file>   (if prettier is on PATH)
#   2. npx tsc --noEmit          (if a tsconfig.json sits at the nearest package.json root)
#      -> only errors mentioning THIS file are surfaced.
#
# NON-BLOCKING by contract: always exit 0. Warnings go to stderr. Never blocks an edit.

Set-StrictMode -Off
$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$TscTimeoutMs = 60000   # hard ceiling; a wedged tsc must never stall the session

function Invoke-Bounded {
    # Runs an external command with a hard timeout; returns combined stdout+stderr as string[].
    #
    # Deliberately uses ProcessStartInfo rather than Start-Process -PassThru: the Process object
    # Start-Process hands back does not reliably report exit, so WaitForExit(ms) returns $false
    # even for a process that finished in ~1s -- which silently killed tsc and swallowed all
    # output. Reading both streams asynchronously also avoids the classic full-pipe deadlock.
    param([string]$Exe, [string[]]$Arguments, [string]$WorkDir, [int]$TimeoutMs)

    try {
        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName = $Exe
        foreach ($a in $Arguments) { [void]$psi.ArgumentList.Add($a) }
        $psi.WorkingDirectory = $WorkDir
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.RedirectStandardInput = $true   # give it a stdin we control, then close it
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $p = [System.Diagnostics.Process]::Start($psi)
        if (-not $p) { return @() }

        $p.StandardInput.Close()   # nothing to feed it; prevents any wait-on-stdin hang
        $so = $p.StandardOutput.ReadToEndAsync()
        $se = $p.StandardError.ReadToEndAsync()

        if (-not $p.WaitForExit($TimeoutMs)) {
            try { $p.Kill($true) } catch {}
            return @()
        }
        $p.WaitForExit()   # parameterless overload: ensures redirected streams are flushed

        $text = ($so.Result + "`n" + $se.Result)
        return @($text -split "`r?`n" | Where-Object { $_ -ne '' })
    }
    catch { return @() }
}

try {
    # ---------- read + parse payload ----------
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json -ErrorAction Stop
    $file = $payload.tool_input.file_path
    if ([string]::IsNullOrWhiteSpace($file)) { exit 0 }

    # ---------- FAST PATH: not a JS/TS source file -> leave immediately, silently ----------
    if ($file -notmatch '(?i)\.(ts|tsx|js|jsx)$') { exit 0 }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { exit 0 }

    $item = Get-Item -LiteralPath $file -ErrorAction Stop
    $full = $item.FullName

    # ---------- 1. prettier ----------
    $prettier = Get-Command prettier -ErrorAction SilentlyContinue
    if ($prettier) {
        $res = Invoke-Bounded -Exe $prettier.Source -Arguments @('--write', $full) `
            -WorkDir $item.DirectoryName -TimeoutMs 20000
        $problems = $res | Where-Object { $_ -match '(?i)error|\[error\]|SyntaxError' }
        if ($problems) {
            [Console]::Error.WriteLine('[Hook] prettier reported a problem (edit was NOT blocked):')
            $problems | Select-Object -First 5 | ForEach-Object { [Console]::Error.WriteLine("  $_") }
        }
    }

    # ---------- 2. locate package root, then tsc ----------
    $dir = $item.Directory
    $pkgRoot = $null
    while ($dir) {
        if (Test-Path -LiteralPath (Join-Path $dir.FullName 'package.json') -PathType Leaf) {
            $pkgRoot = $dir.FullName
            break
        }
        $dir = $dir.Parent
    }
    if (-not $pkgRoot) { exit 0 }

    $tsconfig = Join-Path $pkgRoot 'tsconfig.json'
    if (-not (Test-Path -LiteralPath $tsconfig -PathType Leaf)) { exit 0 }

    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $npx) { exit 0 }

    # --no-install: never let npx try to fetch typescript, which would prompt on stdin and hang.
    # If tsc is not already a project dep, npx exits immediately and the check is simply skipped.
    $tsc = Invoke-Bounded -Exe $npx.Source -Arguments @('--no-install', 'tsc', '--noEmit', '--pretty', 'false') `
        -WorkDir $pkgRoot -TimeoutMs $TscTimeoutMs
    if (-not $tsc) { exit 0 }

    # tsc emits paths relative to the project root, forward-slashed: src/foo.ts(3,5): error TS...
    $rel = [System.IO.Path]::GetRelativePath($pkgRoot, $full).Replace('\', '/')
    $base = $item.Name

    $mine = $tsc | Where-Object {
        $_ -match '(?i)error TS' -and ($_ -like "*$rel*" -or $_ -like "*$base*")
    }

    if ($mine) {
        [Console]::Error.WriteLine("[Hook] tsc errors in $rel (edit was NOT blocked):")
        $mine | Select-Object -First 10 | ForEach-Object { [Console]::Error.WriteLine("  $_") }
        exit 0
    }

    # Config-level failures (TS5xxx/TS6xxx) mean tsc never type-checked ANYTHING.
    # Without this, a broken tsconfig makes the hook silently useless forever.
    # Per-file errors elsewhere in the project stay suppressed, by design.
    $config = $tsc | Where-Object { $_ -match '(?i)error TS[56]\d{3}' }
    if ($config) {
        [Console]::Error.WriteLine('[Hook] tsc could not run - typecheck was SKIPPED (edit was NOT blocked):')
        $config | Select-Object -First 3 | ForEach-Object { [Console]::Error.WriteLine("  $_") }
    }

    exit 0
}
catch {
    # Advisory hook: swallow everything. An edit must never fail because formatting did.
    exit 0
}
