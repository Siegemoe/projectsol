# Attempts to repair invalid JSON in Cline MCP settings by removing hard line breaks that were inserted inside JSON strings.
# 1) Backs up the original file
# 2) Joins any newline(s) that occur while inside a JSON string (between quotes), also skipping indentation spaces right after those newlines
# 3) Validates the result parses as JSON; if valid, writes it back formatted; otherwise aborts and restores backup.

$ErrorActionPreference = 'Stop'

$path = 'C:\Users\zghor\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json'
if (-not (Test-Path $path)) {
  Write-Error "Settings file not found: $path"
  exit 1
}

$backup = "$path.bak-$(Get-Date -Format yyyyMMddHHmmss)"
Copy-Item -Force $path $backup
Write-Host "Backup created: $backup"

# Read raw file
$raw = Get-Content -Raw -Path $path -Encoding UTF8

# State machine to remove newlines that occur while inside JSON strings
$sb = New-Object System.Text.StringBuilder
$inString = $false
$escape = $false
$skipWSAfterJoin = $false

foreach ($ch in $raw.ToCharArray()) {
  if ($skipWSAfterJoin) {
    if ($ch -eq ' ' -or $ch -eq "`t") {
      continue
    } else {
      $skipWSAfterJoin = $false
      # fall through to normal handling of $ch
    }
  }

  if ($inString) {
    if ($escape) {
      if ($ch -eq "`n" -or $ch -eq "`r") {
        # handle escape-newline broken sequence: drop newline and skip following indentation
        $skipWSAfterJoin = $true
        $escape = $false
        continue
      }
      [void]$sb.Append($ch)
      $escape = $false
      continue
    }

    if ($ch -eq '\') {
      $escape = $true
      [void]$sb.Append($ch)
      continue
    }

    if ($ch -eq '"') {
      $inString = $false
      [void]$sb.Append($ch)
      continue
    }

    if ($ch -eq "`n" -or $ch -eq "`r") {
      # drop newline occurring inside a string and skip indentation spaces that follow
      $skipWSAfterJoin = $true
      continue
    }

    [void]$sb.Append($ch)
  }
  else {
    if ($ch -eq '"') {
      $inString = $true
      [void]$sb.Append($ch)
      continue
    }
    [void]$sb.Append($ch)
  }
}

$repaired = $sb.ToString()

# Try to parse repaired content
try {
  $json = $repaired | ConvertFrom-Json -ErrorAction Stop
} catch {
  Write-Host "Repair failed to produce valid JSON. See backup at: $backup"
  Write-Host ("Parse error: " + $_.Exception.Message)
  exit 2
}

# Ensure top-level object exists
if ($null -eq $json) {
  $json = [pscustomobject]@{}
}

# Ensure mcpServers exists (don't invent values — only ensure shape)
if (-not ($json.PSObject.Properties.Name -contains 'mcpServers') -or $null -eq $json.mcpServers) {
  $json | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}

# Pretty print back to file
$json | ConvertTo-Json -Depth 50 | Set-Content -Path $path -Encoding UTF8
Write-Host "Settings repaired and formatted successfully."

# Show quick summary
$keys = @()
if ($json.mcpServers -ne $null) {
  $keys = $json.mcpServers.PSObject.Properties | ForEach-Object { $_.Name }
}
Write-Host ("Servers: " + ($keys -join ', '))
