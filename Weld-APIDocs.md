Weld-API  v2.2  官方文档  
*Electron 主进程级运行时 | 最后更新：2025-08-26*

---

## 0. 一句话简介  
Weld-API 是 WML 的「主进程大脑」，在 Electron `app ready` 之后自动激活，提供  
- VSCode 扩展的双向 WebSocket 通道  
- 用户配置读取  
- 系统级通知  
- 全局事件总线  

---

## 1. 激活与可用时机
| 条件 | 说明 |
|---|---|
| 位置 | `~/.vsenv/work/mods/weld-api/out/extension.js` |
| 激活时机 | Electron `app.whenReady()` |
| 全局对象 | `global.WeldAPI` |
| 判断可用 | `global.WeldAPI?.version === '2.2'` |

---

## 2. 顶级 API 速查表

| 名称 | 类型 | 简述 |
|---|---|---|
| `WeldAPI.version` | `string` | 固定值 `'2.2'` |
| `WeldAPI.log(...)` | `function` | 统一前缀 `[Weld-API]` 的 `console.log` |
| `WeldAPI.vscode.*` | 命名空间 | 与 VSCode 扩展通信 |
| `WeldAPI.readUserSetting(key)` | `function` | 读取用户配置 |
| `WeldAPI.showBalloon(title, body)` | `function` | 发送系统通知 |
| `WeldAPI.on / emit` | 事件总线 | 任意进程内通信 |

---

## 3. 详细接口

### 3.1 VSCode 双向通道 (`WeldAPI.vscode`)
```ts
interface VSCodeChannel {
  broadcast(type: string, data?: any): void;
  onMessage(type: string, handler: (data: any, reply: (res: any) => void) => void): void;
  sendTo(client: WebSocket, type: string, data?: any): void;
}
```

**示例：主进程 → 扩展**
```js
// 广播
WeldAPI.vscode.broadcast('theme-changed', { theme: 'dark' });

// 一对一
WeldAPI.vscode.sendTo(clientWS, 'focus-file', '/src/main.js');
```

**示例：扩展 → 主进程**
```js
// 在扩展代码中
import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:7890');

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'ping', data: 123 }));
});

ws.on('message', (msg) => {
  const { type, data } = JSON.parse(msg.toString());
  if (type === 'ping_response') console.log('pong', data);
});
```

---

### 3.2 读取用户配置
```js
// ~/.vsenv/work/data/user/settings.json
const fontSize = WeldAPI.readUserSetting('editor.fontSize');
// 未找到返回 undefined
```

---

### 3.3 系统通知
```js
WeldAPI.showBalloon('构建完成', '项目已成功打包');
```
- 自动等待 `app ready`
- 遵循操作系统原生样式

---

### 3.4 进程内事件总线
```js
// 任意代码（主进程）
WeldAPI.on('build-finished', ({ time }) => {
  console.log('Build took', time, 'ms');
});

// 触发
WeldAPI.emit('build-finished', { time: 1240 });
```
- 基于 Node.js `EventEmitter`，**同步**调用  
- 命名建议：`domain:action`

---

## 4. WebSocket 协议约定

| 方向 | JSON 格式 |
|---|---|
| 扩展 → 主进程 | `{ type: 'command', data: any }` |
| 主进程 → 扩展 | `{ type: 'command_response', data: any }` |

---

## 5. 完整工作流示例

1. 扩展连接  
   `ws://localhost:7890` 自动触发 `WeldAPI.log('VSCode extension connected')`

2. 扩展请求读取配置  
   ```js
   // 扩展端
   ws.send(JSON.stringify({ type: 'get-setting', data: { key: 'git.enabled' } }));
   ```

3. 主进程注册处理器  
   ```js
   WeldAPI.vscode.onMessage('get-setting', ({ key }, reply) => {
     reply(WeldAPI.readUserSetting(key));
   });
   ```

4. 主进程主动推送  
   ```js
   WeldAPI.vscode.broadcast('config-changed', { key: 'git.enabled', value: false });
   ```

---

## 6. 错误码与故障排查

| 症状 | 可能原因 | 排查方法 |
|---|---|---|
| `WeldAPI === undefined` | weld-api 未加载成功 | 查看主进程控制台 `[Weld-API] activated` |
| `ws connection refused` | 7890 端口被占用 | `lsof -i :7890` 或修改 `vscodeBridge.start(newPort)` |
---

## 7. 版本迁移（v2.1 → v2.2）
- ✅ **新增** `WeldAPI.showBalloon`  
- ✅ **新增** `WeldAPI.vscode.sendTo(client, …)`  
- ⚠️ **移除** `WeldAPI.getAppPath()`（已合并至 `readUserSetting`）

---

> 源码 & Issue：github.com/dhjs0000/Welding-Mod-Loader   