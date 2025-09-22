# Rebuilds cline_mcp_settings.json from scratch with only known-good servers
# This eliminates any invisible/problematic keys that filtering can't catch

$ErrorActionPreference = 'Stop'

$settingsPath = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

# Backup current file
$backup = "$settingsPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
Copy-Item -Force $settingsPath $backup
Write-Host "Backup created: $backup"

# Read existing to extract values
$existing = Get-Content -Raw -Path $settingsPath | ConvertFrom-Json

# Create clean structure with only known servers
$clean = [pscustomobject]@{
  mcpServers = [pscustomobject]@{
    'github.com/github/github-mcp-server' = $existing.mcpServers.'github.com/github/github-mcp-server'
    'vercel-mcp' = $existing.mcpServers.'vercel-mcp'
    'dep-audit-mcp' = $existing.mcpServers.'dep-audit-mcp'
    'eslint-mcp' = $existing.mcpServers.'eslint-mcp'
    'supabase-mcp' = $existing.mcpServers.'supabase-mcp'
    'google-mcp' = $existing.mcpServers.'google-mcp'
    'gmail-mcp' = $existing.mcpServers.'gmail-mcp'
    'context7' = $existing.mcpServers.'context7'
    '@21st-dev/magic' = $existing.mcpServers.'@21st-dev/magic'
    'puppeteer' = [pscustomobject]@{
      command = 'npx'
      args = @('-y','@modelcontextprotocol/server-puppeteer')
      env = [pscustomobject]@{}
      disabled = $false
      autoApprove = @()
    }
  }
}

# Write clean JSON
$clean | ConvertTo-Json -Depth 50 | Set-Content -Path $settingsPath -Encoding UTF8

# Validate and list
$final = Get-Content -Raw -Path $settingsPath | ConvertFrom-Json
$servers = $final.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
Write-Host "Clean MCP settings created successfully."
Write-Host ("Servers: " + ($servers -join ', '))
