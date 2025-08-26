<#
.SYNOPSIS
  一键回滚 Weld Mod Loader
.EXAMPLE
  .\uninstall.ps1
#>
param(
  [string]$Instance = "work"
)

$base   = Join-Path $env:USERPROFILE '.vsenv'
$root   = Join-Path $base $Instance
$outDir = Join-Path $root 'vscode\resources\app\out'

$main   = Join-Path $outDir 'main.js'
$bak    = "$main.original.js"
$mark   = Join-Path $outDir '.weld-injected'

if (-not (Test-Path $mark)) {
  Write-Host "❌ 未检测到 WML，无需卸载"
  exit 0
}

# 1. 还原入口
Remove-Item $main -Force
Rename-Item $bak 'main.js'

# 2. 删除标记 & 可选清理
Remove-Item $mark -Force
Remove-Item (Join-Path $outDir 'package.json') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $outDir 'mod-loader.mjs') -Force -ErrorAction SilentlyContinue

Write-Host "✅ WML 已从 $Instance 卸载"