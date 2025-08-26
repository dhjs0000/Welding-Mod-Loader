// ===================================================================
//  Weld Mod Config  —  模组管理器
// ===================================================================
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs';
import os from 'os';
import { WebSocketServer } from 'ws';
import { app, ipcMain } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模组目录路径
const MODS_DIR = path.join(os.homedir(), '.vsenv', 'work', 'mods');

class ModManager {
  constructor() {
    this.window = null;
  }

  // 创建管理面板窗口
  createWindow() {
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'Weld 模组管理器'
    });

    // 加载管理面板页面
    this.window.loadFile(path.join(__dirname, 'panel.html'));
  }

  // 获取已安装的模组列表
  getInstalledMods() {
    const mods = [];
    if (!fs.existsSync(MODS_DIR)) return mods;

    fs.readdirSync(MODS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .forEach(dirent => {
        const modDir = path.join(MODS_DIR, dirent.name);
        const pkgPath = path.join(modDir, 'package.json');
        
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            mods.push({
              name: pkg.name,
              version: pkg.version,
              description: pkg.description,
              dependencies: pkg['weld-dependencies'] || {},
              enabled: true, // 默认启用
              path: modDir
            });
          } catch (err) {
            global.WeldAPI.log(`Error reading mod ${dirent.name}:`, err);
          }
        }
      });

    return mods;
  }

  // 启用/禁用模组
  toggleMod(modName, enabled) {
    const modPath = path.join(MODS_DIR, modName);
    const disabledPath = `${modPath}.disabled`;

    try {
      if (enabled && fs.existsSync(disabledPath)) {
        fs.renameSync(disabledPath, modPath);
      } else if (!enabled && fs.existsSync(modPath)) {
        fs.renameSync(modPath, disabledPath);
      }
      return true;
    } catch (err) {
      global.WeldAPI.log(`Error toggling mod ${modName}:`, err);
      return false;
    }
  }

  // 设置事件监听
  setupEvents() {
    ipcMain.handle('get-mods', () => this.getInstalledMods());
    ipcMain.handle('toggle-mod', (event, { name, enabled }) => 
      this.toggleMod(name, enabled));
  }
}

let manager = null;

export function activate() {
  global.WeldAPI.log('Mod Config activated');

  manager = new ModManager();

  // 注册全局命令
  global.WeldAPI.on('mod-config.showPanel', () => {
    global.WeldAPI.log('Opening mod config panel');
    if (manager) {
      manager.createWindow();
    }
  });

  // 注册到 WeldAPI
  global.WeldAPI.registerCommand?.('mod-config.showPanel', () => {
    if (manager) {
      manager.createWindow();
    }
  });

  return manager;
}
