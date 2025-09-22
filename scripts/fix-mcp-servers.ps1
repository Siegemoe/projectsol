# Fixes cline_mcp_settings.json to the exact format Cline expects and repairs broken server paths.
# - Preserves existing tokens and envs
# - Normalizes JSON structure
# - Repairs common path corruption issues (indexx.js, iindex.js, index.jss, etc.)
# - Ensures each server has disabled and autoApprove fields
# - Sets known-correct paths for local servers when available

$ErrorActionPreference = 'Stop'

$settingsPath = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'
$mcpRoot = 'C:\Users\zghor\Documents\Cline\MCP'

if (-not (Test-Path $settingsPath)) {
  Write-Error "Settings file not found: $settingsPath"
  exit 1
}

# Backup
$backup = "$settingsPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
Copy-Item -Force $settingsPath $backup
Write-Host "Backup created: $backup"

# Read JSON and parse
$raw = Get-Content -Raw -Path $settingsPath -Encoding UTF8

# Attempt to parse; if it fails, bail out (use repair script first)
try {
  $json = $raw | ConvertFrom-Json -ErrorAction Stop
} catch {
  Write-Error "JSON parse failed: $($_.Exception.Message). Run scripts\repair-mcp-json.ps1 first."
  exit 2
}

# Ensure top-level object and mcpServers exist
if ($null -eq $json) { $json = [pscustomobject]@{} }
if (-not ($json.PSObject.Properties.Name -contains 'mcpServers') -or $null -eq $json.mcpServers) {
  $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}

# Helper: ensure boolean/array presence
function Ensure-ServerMeta([pscustomobject]$srv) {
  if (-not ($srv.PSObject.Properties.Name -contains 'disabled')) {
    $srv | Add-Member -NotePropertyName disabled -NotePropertyValue $false -Force
  }
  if (-not ($srv.PSObject.Properties.Name -contains 'autoApprove') -or $null -eq $srv.autoApprove) {
    $srv | Add-Member -NotePropertyName autoApprove -NotePropertyValue @() -Force
  }
  if (-not ($srv.PSObject.Properties.Name -contains 'env') -or $null -eq $srv.env) {
    $srv | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{}) -Force
  }
}

# Helper: normalize index.js path glitches
function Normalize-IndexJs([string]$p) {
  if ([string]::IsNullOrWhiteSpace($p)) { return $p }
  $np = $p `
    -replace 'iindex\.js', 'index.js' `
    -replace 'indexx\.js', 'index.js' `
    -replace 'index\.jss', 'index.js' `
    -replace '\\build\\iindex\.js', '\build\index.js' `
    -replace '\\dist\\iindex\.js', '\dist\index.js'
  if ($np -notmatch '\.js$' -and $np -match 'index$') {
    $np = $np + '.js'
  }
  return $np
}

# Helper: set known-correct path when applicable
function Get-KnownPath([string]$name) {
  switch ($name) {
    'vercel-mcp'     { return Join-Path (Join-Path $mcpRoot 'vercel-mcp\build') 'index.js' }
    'dep-audit-mcp'  { return Join-Path (Join-Path $mcpRoot 'dep-audit-mcp\build') 'index.js' }
    'eslint-mcp'     { return Join-Path (Join-Path $mcpRoot 'eslint-mcp\build') 'index.js' }
    'supabase-mcp'   { return Join-Path (Join-Path $mcpRoot 'supabase-mcp\build') 'index.js' }
    'google-mcp'     { return Join-Path (Join-Path $mcpRoot 'google-mcp\build') 'index.js' }
    'gmail-mcp'      { return Join-Path (Join-Path $mcpRoot 'gmail-mcp\dist') 'index.js' }
    default          { return $null }
  }
}

# Iterate servers and repair
$servers = @()
if ($json.mcpServers -is [System.Collections.IDictionary]) {
  $servers = $json.mcpServers.Keys
} else {
  $servers = $json.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
}

foreach ($name in $servers) {
  $srv = $json.mcpServers.$name

  # Ensure required metadata fields exist
  Ensure-ServerMeta -srv $srv

  # Fix known local Node servers' path arg
  if (($srv.PSObject.Properties.Name -contains 'command') -and $srv.command -eq 'node' -and ($srv.PSObject.Properties.Name -contains 'args') -and $srv.args.Count -ge 1) {
    $original = [string]$srv.args[0]
    $normalized = Normalize-IndexJs $original

    $known = Get-KnownPath $name
    if ($known) {
      if (Test-Path $known) {
        $srv.args[0] = $known
      } else {
        # If known path missing, at least set the normalized path
        $srv.args[0] = $normalized
      }
    } else {
      $srv.args[0] = $normalized
    }
  }

  # Ensure '@21st-dev/magic' has disabled + env present
  if ($name -eq '@21st-dev/magic') {
    Ensure-ServerMeta -srv $srv
  }
}

# Remove any invalid/blank server keys and rebuild mcpServers cleanly
$props = $json.mcpServers.PSObject.Properties
$newMcp = [pscustomobject]@{}
$allowed = '^[A-Za-z0-9@._\-/]+$'  # only safe characters; excludes spaces and control chars
foreach ($p in $props) {
  $name = ([string]$p.Name)
  if ($null -ne $name) {
    $trim = $name.Trim()
    if ($trim.Length -gt 0 -and $trim -match $allowed) {
      $newMcp | Add-Member -NotePropertyName $name -NotePropertyValue $p.Value -Force
    }
  }
}
$json.mcpServers = $newMcp

# Ensure context7 is http config only: type/url/headers (+ disabled/autoApprove), no env
if ($json.mcpServers.PSObject.Properties.Name -contains 'context7') {
  $ctx = $json.mcpServers.'context7'
  if ($ctx -ne $null) {
    if ($ctx.PSObject.Properties.Name -contains 'env') {
      [void]$ctx.PSObject.Properties.Remove('env')
    }
    Ensure-ServerMeta -srv $ctx
    if (-not ($ctx.PSObject.Properties.Name -contains 'type')) {
      $ctx | Add-Member -NotePropertyName type -NotePropertyValue 'streamableHttp' -Force
    }
  }
}

# Add/ensure Puppeteer is present as final step (per user request)
$pupp = [pscustomobject]@{
  command = 'npx'
  args = @('-y','@modelcontextprotocol/server-puppeteer')
  env = [pscustomobject]@{}
  disabled = $false
  autoApprove = @()
}
$json.mcpServers | Add-Member -NotePropertyName 'puppeteer' -NotePropertyValue $pupp -Force

# Pretty print and write back
$json | ConvertTo-Json -Depth 50 | Set-Content -Path $settingsPath -Encoding UTF8

# Validate final JSON and summarize
try {
  $final = (Get-Content -Raw -Path $settingsPath -Encoding UTF8) | ConvertFrom-Json -ErrorAction Stop
  $serverNames = @()
  if ($final.mcpServers -is [System.Collections.IDictionary]) {
    $serverNames = $final.mcpServers.Keys
  } else {
    $serverNames = $final.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
  }
  Write-Host "Settings normalized successfully."
  Write-Host ("Servers: " + ($serverNames -join ', '))
  foreach ($n in $serverNames) {
    $s = $final.mcpServers.$n
    if ($s.command -eq 'node' -and $s.args.Count -ge 1) {
      Write-Host ("- {0}: {1}" -f $n, $s.args[0])
    } elseif ($s.type -eq 'streamableHttp') {
      Write-Host ("- {0}: {1}" -f $n, $s.url)
    } elseif ($s.command) {
      Write-Host ("- {0}: {1} {2}" -f $n, $s.command, ($s.args -join ' '))
    }
  }
} catch {
  Write-Error "Final JSON validation failed: $($_.Exception.Message)"
  Write-Host "Restoring backup..."
  Copy-Item -Force $backup $settingsPath
  exit 3
}
