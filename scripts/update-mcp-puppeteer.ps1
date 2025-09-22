# Adds the Puppeteer MCP server to Cline MCP settings with disabled=false and autoApprove=[]
# Path: C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json

$path = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

# Load existing JSON or start fresh
if (Test-Path $path) {
  $raw = Get-Content -Raw -Path $path
} else {
  $raw = '{}'
}

try {
  $json = $raw | ConvertFrom-Json
} catch {
  $json = [pscustomobject]@{}
}

if ($null -eq $json) {
  $json = [pscustomobject]@{}
}

# Ensure mcpServers object exists
if (-not ($json.PSObject.Properties.Name -contains 'mcpServers') -or $null -eq $json.mcpServers) {
  $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}

# Prepare entry
$entry = [pscustomobject]@{
  command = 'npx'
  args = @('-y','@modelcontextprotocol/server-puppeteer')
  env = [pscustomobject]@{}
  disabled = $false
  autoApprove = @()
}

# Normalize mcpServers to PSCustomObject if it's a hashtable
if ($json.mcpServers -is [hashtable]) {
  $mcp = [pscustomobject]@{}
  foreach ($k in $json.mcpServers.Keys) {
    $mcp | Add-Member -NotePropertyName $k -NotePropertyValue $json.mcpServers[$k] -Force
  }
  $json.mcpServers = $mcp
}

# Upsert the puppeteer server
$json.mcpServers | Add-Member -NotePropertyName puppeteer -NotePropertyValue $entry -Force

# Write back
$json | ConvertTo-Json -Depth 20 | Set-Content -Path $path -Encoding UTF8

Write-Host 'Puppeteer MCP server entry added/updated successfully.'
