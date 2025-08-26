// ===================================================================
//  Weld API  v2.2  —  主进程级 API 插件（等待 app ready）
// ===================================================================
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs';
import os from 'os';
import { app, Notification } from 'electron';
import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';

// 获取当前文件的目录（ES 模块兼容方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VSCode 通信管理器
class VSCodeBridge {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.handlers = new Map();
  }

  start(port = 7890) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      global.WeldAPI.log('VSCode extension connected');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (err) {
          global.WeldAPI.log('Error handling message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        global.WeldAPI.log('VSCode extension disconnected');
      });
    });

    global.WeldAPI.log(`VSCode bridge listening on port ${port}`);
  }

  handleMessage(ws, message) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message.data, (response) => {
        ws.send(JSON.stringify({
          type: `${message.type}_response`,
          data: response
        }));
      });
    }
  }

  broadcast(type, data) {
    const message = JSON.stringify({ type, data });
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }
}

// 创建全局 VSCode 桥接实例
const vscodeBridge = new VSCodeBridge();

function activate() {
  console.log('[Weld-API] activated v2.2');

  // 1. 全局 API
  global.WeldAPI = {
    version: '2.2',
    log: (...args) => console.log('[Weld-API]', ...args),

    // VSCode 通信 API
    vscode: {
      broadcast: (type, data) => vscodeBridge.broadcast(type, data),
      onMessage: (type, handler) => vscodeBridge.registerHandler(type, handler),
      sendTo: (client, type, data) => {
        if (client?.readyState === 1) {
          client.send(JSON.stringify({ type, data }));
        }
      }
    },

    readUserSetting: (key) => {
      const settingsPath = path.join(
        os.homedir(), // 使用导入的 os 模块
        '.vsenv/work/data/user/settings.json'
      );
      try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))[key];
      } catch {
        return undefined;
      }
    },

    showBalloon: (title, body) => {
      // 延迟到 app ready
      app.whenReady().then(() => {
        new Notification({ title, body }).show();
      });
    },

    on: (event, fn) => {
      if (!global.WeldBus) global.WeldBus = new EventEmitter();
      global.WeldBus.on(event, fn);
    },

    emit: (event, ...args) => global.WeldBus?.emit(event, ...args),
  };

  // 2. 启动 VSCode 桥接服务
  app.whenReady().then(() => {
    vscodeBridge.start();
    global.WeldAPI.showBalloon('Weld API', '插件已就绪，可在控制台使用 `WeldAPI`');
  });
}

export { activate };