# Welding Mod Loader

一个为 VSenv 设计的 Forge 风格模组加载器。

## 🌟 特性

- 💡 ES Module 支持 - 使用现代 JavaScript 模块系统
- 🔌 插件化架构 - 基于依赖的自动加载顺序
- 🛠 统一 API - 通过 `weld-api` 提供标准化接口
- 📦 简单集成 - 一键安装到现有 VSenv 实例

## 🚀 快速开始

### 安装

#### 前置要求

- Windows 操作系统
- PowerShell 5.0 或更高版本
- VSenv 环境（VS Code 的定制版本）

#### 安装步骤

1. **检查 VSenv 环境**
   ```powershell
   # 检查 VSenv 目录是否存在
   Test-Path "$env:USERPROFILE\.vsenv"
   ```

2. **下载 Mod Loader**
   ```powershell
   # 克隆仓库
   git clone https://github.com/dhjs0000/weld.git
   cd weld
   ```

3. **运行安装脚本**
   ```powershell
   # 安装到默认实例（work）
   .\scripts\install.ps1

   # 或安装到指定实例（如 dev/preview）
   .\scripts\install.ps1 -Instance dev
   ```

4. **验证安装**
   - 重启 VS Code
   - 打开开发者工具（Ctrl+Shift+I）
   - 检查控制台是否显示 `[WML] Welding Mod Loader v1.0.0 started`

#### 可能遇到的问题

1. **VSenv 实例不存在**
   ```
   错误信息：实例 xxx 不存在，请先创建或检查路径
   解决方案：确保已安装 VSenv 并创建了相应实例
   ```

2. **权限问题**
   ```
   错误信息：Access denied
   解决方案：以管理员权限运行 PowerShell
   ```

3. **进程占用**
   ```
   错误信息：文件被占用
   解决方案：完全退出 VS Code 后重试
   ```

### 创建一个简单的 Mod

1. 在 `~/.vsenv/work/mods` 创建新目录
2. 添加以下文件：

```text
hello-mod/
├── package.json
└── out/
    └── extension.js
```

## 📝 配置说明

### package.json

```json
{
  "name": "hello-mod",
  "version": "1.0.0",
  "main": "out/extension.js",
  "type": "module",
  "weld-dependencies": {
    "weld-api": "2.1.0"
  }
}
```

### extension.js

```javascript
export function activate() {
  console.log('[Hello Mod] Activated successfully');
  global.WeldAPI.showBalloon('Hello Mod', '你好，世界！');
}
```

## 📚 文档

详细的 API 文档和示例请参考 [APIDocs.md](./APIDocs.md)。

## 🤝 贡献

欢迎提交 Pull Request！请确保：

1. 遵循现有代码风格
2. 添加必要的测试
3. 更新相关文档

## 📄 许可证

MIT © VSenv Team