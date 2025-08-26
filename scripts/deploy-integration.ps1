# Deploy Weld integration
param (
    [string]$Instance = "work"
)

$ErrorActionPreference = "Stop"

# 1. 设置路径
$vsenvPath = Join-Path $env:USERPROFILE ".vsenv"
$instancePath = Join-Path $vsenvPath $Instance
$modsPath = Join-Path $instancePath "mods"

# 2. 部署 weld-api
Write-Host "Deploying weld-api..."
$weldApiSrc = Join-Path $PSScriptRoot "../src/weld-api"
$weldApiDest = Join-Path $modsPath "weld-api"
if (Test-Path $weldApiDest) {
    Remove-Item $weldApiDest -Recurse -Force
}
Copy-Item $weldApiSrc $weldApiDest -Recurse

# 3. 安装依赖
Write-Host "Installing dependencies..."
Push-Location $weldApiDest
npm install
Pop-Location

# 4. 部署 VSCode 扩展
Write-Host "Building VSCode extension..."
$vscodePath = Join-Path $PSScriptRoot "../vscode-weld"
Push-Location $vscodePath
npm install
npm run package
Pop-Location

Write-Host "✅ Deployment complete!"
Write-Host "Now you can:"
Write-Host "1. Install the VSCode extension from './vscode-weld/dist/extension.js'"
Write-Host "2. Restart VSCode"
Write-Host "3. Use 'Weld: 显示模组管理器' command to open the manager"
