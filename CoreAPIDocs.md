# weld-api  核心 API 文档  
*版本：v1.1.0 | 最后更新：2025-08-26*

---

## 1. 定位与职责
**weld-api** 是 Welding Mod Loader（WML）的运行时核心，**必须**作为第一个被加载的 mod 存在。  
它提供：
- 生命周期事件总线（`events`）
- 日志工具（`Logger`）
- 配置持久化（`Config`）
- 跨 mod 通信（`Registry`）
- 简易工具函数（`Util`）

---

## 2. 模块总览
| 导出名 | 类型 | 说明 |
|---|---|---|
| `events` | EventEmitter | 全局生命周期事件 |
| `Logger` | class | 带命名空间的日志 |
| `Config` | class | JSON 配置文件读写 |
| `Registry` | class | 字符串-对象映射仓库 |
| `Util` | Object | 杂项辅助函数 |

---

## 3. API 详解

### 3.1 生命周期事件
```js
import { events } from 'weld-api';

events.on('weld:loaded', (modInfo) => {
  console.log(`${modInfo.name} 加载完成`);
});

events.on('weld:beforeUnload', () => {
  // 释放资源
});
```

| 事件名 | 回调参数 | 触发时机 |
|---|---|---|
| `weld:loaded` | `{name, version, dir}` | 任意 mod 成功加载后 |
| `weld:beforeUnload` | - | 进程退出前 |

---

### 3.2 日志
```js
import { Logger } from 'weld-api';
const log = new Logger('MyMod');      // 命名空间
log.info('Hello %s', 'world');        // [MyMod] Hello world
log.warn('Disk space low');
log.error(new Error('BOOM'));
```
- 输出格式：  
  `[HH:MM:SS] [namespace] <level> message`
- 等级：trace < debug < info < warn < error

---

### 3.3 配置
```js
import { Config } from 'weld-api';
const cfg = new Config('my_mod');     // 文件：~/.vsenv/work/config/my_mod.json
await cfg.load();                     // 首次会自动创建空对象
cfg.set('theme', 'dark');
await cfg.save();
```
- 所有配置统一放在 `~/.vsenv/work/config/<namespace>.json`
- 支持默认值：
  ```js
  cfg.defaults({ theme: 'light', port: 3000 });
  ```

---

### 3.4 注册表（跨 mod 数据共享）
```js
import { Registry } from 'weld-api';
const blocks = new Registry('blocks');
blocks.register('oak_log', { id: 'minecraft:oak_log' });
const entry = blocks.get('oak_log');
blocks.remove('oak_log');
```
- 每个注册表内部以 `Map<string, any>` 存储
- 名称冲突时会抛错（可配置覆盖）

---

### 3.5 工具函数
```js
import { Util } from 'weld-api';
Util.mkdirIfMissing(path);            // 同步创建目录
Util.deepMerge(obj1, obj2);           // 深合并
Util.uuid();                          // 随机 UUID
```

---

## 4. 示例 mod（最小可运行）
```
mods/
└─ hello-world/
   ├─ package.json
   └─ out/extension.js
```

**package.json**
```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "main": "out/extension.js",
  "type": "module",
  "weld-dependencies": {
    "weld-api": "^1.1.0"
  }
}
```

**out/extension.js**
```js
import { Logger, events } from 'weld-api';
const log = new Logger('HelloWorld');

export function activate() {
  log.info('Hello from HelloWorld!');
  events.emit('hello:shout', 'HelloWorld loaded');
}
```

---

## 5. 版本策略
- **SemVer** 严格遵循。
- weld-api 的 `minor` 升级保证向后兼容，`major` 升级可能破坏 API。

---

## 6. 常见问题
| 问题 | 解决方案 |
|---|---|
| `weld-api not found` | 确保 `~/.vsenv/work/mods/weld-api` 存在且已执行 `npm install` |
| 多个 mod 写入同一注册表键 | 约定命名空间前缀，如 `mymod:block/oak_log` |
| ES vs CommonJS 混用 | weld-api 同时支持 `require` 与 `import` |

---

> 更多示例与变更日志见  
> GitHub: https://github.com/dhjs0000/weld