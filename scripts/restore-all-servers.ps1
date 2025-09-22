# Restores all original MCP servers using clean JSON format

$ErrorActionPreference = 'Stop'

$settingsPath = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'

# Backup current working version
$backup = "$settingsPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
Copy-Item -Force $settingsPath $backup
Write-Host "Backup created: $backup"

# Create complete configuration with all servers (clean paths and tokens)
$fullJson = @'
{
  "mcpServers": {
    "github.com/github/github-mcp-server": {
      "command": "C:\\Users\\zghor\\Documents\\Cline\\MCP\\github-mcp-server\\bin\\github-mcp-server.exe",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
      },
      "disabled": false,
      "autoApprove": []
    },
    "vercel-mcp": {
      "command": "node",
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\vercel-mcp\\build\\index.js"],
      "env": {
        "VERCEL_TOKEN": "VOFRnx26AyeylOX7bNk4oEXY"
      },
      "disabled": false,
      "autoApprove": ["list_projects", "list_deployments", "get_deployment"]
    },
    "dep-audit-mcp": {
      "command": "node",
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\dep-audit-mcp\\build\\index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": ["npm_audit", "npm_outdated"]
    },
    "eslint-mcp": {
      "command": "node", 
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\eslint-mcp\\build\\index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": ["eslint_lint"]
    },
    "supabase-mcp": {
      "command": "node",
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\supabase-mcp\\build\\index.js"],
      "env": {
        "SUPABASE_URL": "https://yahebimdtevrfntopldn.supabase.co",
        "SUPABASE_SERVICE_ROLE": "sb_secret_B1JkG0T4HHbErkXUaodn1A_Ig4qQQnSB"
      },
      "disabled": false,
      "autoApprove": ["list_tables", "get_schema", "run_select"]
    },
    "google-mcp": {
      "command": "node",
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\google-mcp\\build\\index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "197556773904-oq06406h5k7m679bibccdvi7ccecbup44.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "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",
        "GOOGLE_REFRESH_TOKEN": "1//05MVNPCrRy5PXCgYIARAAGAUSNwF-L9Ir9P1nVVjDSg61Ok0fUtm94iFitSDZyDhcQuBB6-2AZplN6sT1P45BQ93I1-e52ygPqtck"
      },
      "disabled": false,
      "autoApprove": ["list_calendars", "list_events", "list_threads", "get_thread"]
    },
    "gmail-mcp": {
      "command": "node",
      "args": ["C:\\Users\\zghor\\Documents\\Cline\\MCP\\gmail-mcp\\dist\\index.js"],
      "env": {
        "CLIENT_ID": "197556773904-oq06406h5k7m679bibccdvi7ccecbup4.apps.googleusercontent.com",
        "CLIENT_SECRET": "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",
        "REFRESH_TOKEN": "1//05MVNPCrRy5PXCgYIARAAGAUSNwF-L9Ir9P1nVjDSg61Ok0fUtm94iFitSDZyDhcQuBB6-2AZplN6sT1P45BQ93I1-e52ygPqtck",
        "TELEMETRY_ENABLED": "false",
        "MCP_CONFIG_DIR": "C:\\Users\\zghor\\.gmail-mcp",
        "AUTH_SERVER_PORT": "5556",
        "PORT": "0"
      },
      "disabled": false,
      "autoApprove": []
    },
    "context7": {
      "type": "streamableHttp",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "Authorization": "Bearer ctx7sk-2a4327e8-e4bd-437a-97d9-e9ad50c999212",
        "Accept": "application/json, text/event-stream"
      },
      "disabled": false,
      "autoApprove": ["resolve-library-id", "get-library-docs"]
    },
    "@21st-dev/magic": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@21st-dev/magic@latest", "API_KEY=\"7602fd7ac13efc4c4fb55ea6925e6461a59f167994f8f5205ffe1f00ae0c23494\""],
      "env": {},
      "disabled": false,
      "autoApprove": ["21st_magic_component_builder", "logo_search", "21st_magic_component_inspiration", "21st_magic_component_refiner"]
    },
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
[System.IO.File]::WriteAllText($settingsPath, $fullJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "All MCP servers restored."

# Validate JSON
try {
  $test = $fullJson | ConvertFrom-Json
  $serverCount = ($test.mcpServers.PSObject.Properties | Measure-Object).Count
  Write-Host "JSON validation: PASSED"
  Write-Host "Server count: $serverCount"
  $test.mcpServers.PSObject.Properties | ForEach-Object { Write-Host "- $($_.Name)" }
} catch {
  Write-Host "JSON validation: FAILED - $($_.Exception.Message)"
}
