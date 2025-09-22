# Creates a minimal, valid cline_mcp_settings.json with one test server to verify format

$ErrorActionPreference = 'Stop'

$settingsPath = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

# Backup existing
if (Test-Path $settingsPath) {
  $backup = "$settingsPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
  Copy-Item -Force $settingsPath $backup
  Write-Host "Backup created: $backup"
}

# Create minimal, clean JSON structure (UTF-8 without BOM)
$minimal = @{
  mcpServers = @{
    'puppeteer' = @{
      command = 'npx'
      args = @('-y', '@modelcontextprotocol/server-puppeteer')
      env = @{}
      disabled = $false
      autoApprove = @()
    }
  }
} | ConvertTo-Json -Depth 10

# Write with proper encoding
[System.IO.File]::WriteAllText($settingsPath, $minimal, [System.Text.Encoding]::UTF8)

Write-Host "Minimal MCP settings created with just Puppeteer server."
Write-Host "If this works, we can add the other servers one by one."
