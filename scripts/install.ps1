<#
.SYNOPSIS
  一键把 Weld Mod Loader 注入到当前 VSenv 实例
.EXAMPLE
  .\install.ps1
#>
param(
  [string]$Instance = "work"   # 可改成 dev / preview 等
)

$base   = Join-Path $env:USERPROFILE '.vsenv'
$root   = Join-Path $base $Instance
$outDir = Join-Path $root 'vscode\resources\app\out'

# 检查实例是否存在
if (-not (Test-Path $outDir)) {
  Write-Error "实例 $Instance 不存在，请先创建或检查路径"
  exit 1
}

# 备份原入口
$main   = Join-Path $outDir 'main.js'
$bak    = "$main.original.js"
$loader = Join-Path $outDir 'mod-loader.mjs'
$mark   = Join-Path $outDir '.weld-injected'

if (Test-Path $mark) {
  Write-Host "✅ WML 已注入，跳过"
  exit 0
}

# 1. 强制 ES Module 目录
Set-Content (Join-Path $outDir 'package.json') -Value '{"type":"module"}'

# 2. 备份 main.js
Copy-Item $main $bak -Force

# 3. 写入新入口
Set-Content $main -Value @"
import './mod-loader.mjs';
import './main.original.js';
"@ -NoNewline

# 4. 拷贝加载器（如不存在）
if (-not (Test-Path $loader)) {
  Copy-Item "$PSScriptRoot\..\src\mod-loader.mjs" $loader -Force
}

# 5. 打标记
New-Item $mark -ItemType File | Out-Null
Write-Host "✅ WML 已注入到 $Instance"