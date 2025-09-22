# Creates a clean cline_mcp_settings.json using basic JSON structure

$ErrorActionPreference = 'Stop'

$settingsPath = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

# Backup existing
if (Test-Path $settingsPath) {
  $backup = "$settingsPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
  Copy-Item -Force $settingsPath $backup
  Write-Host "Backup created: $backup"
}

# Create clean JSON as string (no PowerShell object conversion)
$cleanJson = @'
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
'@

# Write as UTF-8 without BOM
[System.IO.File]::WriteAllText($settingsPath, $cleanJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Clean MCP settings created."

# Validate JSON
try {
  $test = $cleanJson | ConvertFrom-Json
  Write-Host "JSON validation: PASSED"
} catch {
  Write-Host "JSON validation: FAILED - $($_.Exception.Message)"
}
