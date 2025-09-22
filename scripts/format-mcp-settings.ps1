# Validates and reformats Cline MCP settings JSON (preserves all servers).
# Creates a backup before making changes if invalid JSON is detected.

$ErrorActionPreference = 'Stop'

$path = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

if (-not (Test-Path $path)) {
  Write-Error "Settings file not found: $path"
  exit 1
}

# Read raw JSON
$raw = Get-Content -Raw -Path $path -Encoding UTF8

# Try parse
try {
  $json = $raw | ConvertFrom-Json
} catch {
  $bak = "$path.bak"
  Copy-Item -Force $path $bak
  Write-Host "INVALID JSON detected. Backed up to: $bak"
  Write-Host ("Parse error: " + $_.Exception.Message)
  exit 1
}

# Ensure top-level object exists
if ($null -eq $json) {
  $json = [pscustomobject]@{}
}

# Ensure mcpServers exists and is an object
if (-not ($json.PSObject.Properties.Name -contains 'mcpServers') -or $null -eq $json.mcpServers) {
  $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}

# Re-emit pretty JSON
$pretty = $json | ConvertTo-Json -Depth 50

# Write back (UTF-8)
$pretty | Set-Content -Path $path -Encoding UTF8

# Summary
$keys = @()
if ($json.mcpServers -ne $null) {
  $keys = $json.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
}
Write-Host "Formatted MCP settings saved."
Write-Host ("Servers: " + ($keys -join ', '))
