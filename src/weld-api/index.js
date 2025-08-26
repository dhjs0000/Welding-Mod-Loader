import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WeldAPI {
    constructor() {
        this.mods = new Map();
        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
        try {
            // 创建 HTTP 服务器
            const server = createServer();
            
            // 创建 WebSocket 服务器
            const wss = new WebSocketServer({ server });
            
            // WebSocket 连接处理
            wss.on('connection', (ws) => {
                console.log('[Weld-API] 客户端已连接');
                
                // 发送欢迎消息
                ws.send(JSON.stringify({
                    type: 'welcome',
                    data: {
                        version: '2.2.0',
                        time: new Date().toISOString()
                    }
                }));
                
                // 处理消息
                ws.on('message', async (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        console.log('[Weld-API] 收到消息:', message);
                        
                        const response = await this.handleMessage(message);
                        if (response) {
                            ws.send(JSON.stringify(response));
                        }
                    } catch (err) {
                        console.error('[Weld-API] 处理消息时出错:', err);
                        ws.send(JSON.stringify({
                            type: 'error',
                            error: err.message
                        }));
                    }
                });
                
                // 错误处理
                ws.on('error', (err) => {
                    console.error('[Weld-API] WebSocket 错误:', err);
                });
                
                // 连接关闭处理
                ws.on('close', () => {
                    console.log('[Weld-API] 客户端已断开连接');
                });
            });
            
            // 错误处理
            server.on('error', (err) => {
                console.error('[Weld-API] HTTP 服务器错误:', err);
            });
            
            // 启动服务器
            const port = 8080;
            server.listen(port, () => {
                console.log(`[Weld-API] WebSocket 服务器正在监听端口 ${port}`);
            });
        } catch (err) {
            console.error('[Weld-API] 设置 WebSocket 服务器时出错:', err);
        }
    }
    
    async handleMessage(message) {
        const { type, requestId } = message;
        
        switch (type) {
            case 'get_mods':
                return {
                    type: 'response',
                    requestId,
                    data: await this.getModList()
                };
                
            case 'toggle_mod':
                const { name, enabled } = message.data;
                await this.toggleMod(name, enabled);
                return {
                    type: 'response',
                    requestId,
                    data: { success: true }
                };
                
            default:
                throw new Error(`未知的消息类型: ${type}`);
        }
    }
    
    async getModList() {
        return [
            {
                name: "weld-api",
                version: "2.2.0",
                description: "Weld API 核心模块",
                enabled: true,
                dependencies: {}
            },
            {
                name: "test-mod",
                version: "1.0.0",
                description: "测试模组",
                enabled: false,
                dependencies: {
                    "weld-api": "2.2.0"
                }
            }
        ];
    }
    
    async toggleMod(name, enabled) {
        console.log(`[Weld-API] 切换模组 ${name} 状态为 ${enabled}`);
        // TODO: 实现实际的模组状态切换
    }
}

// 创建并导出实例
const api = new WeldAPI();
export { api as default };
