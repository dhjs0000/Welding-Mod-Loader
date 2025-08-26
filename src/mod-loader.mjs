// ================================================================
//  Welding Mod Loader (Weld)  ‑ VSenv Forge-style loader
// ================================================================
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const fs = require('fs');
// child_process 在 ESM 环境中通过 createRequire 引入
const child_process = require('child_process');

// 获取当前文件的目录（ES 模块兼容方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WELD_MODS_DIR = path.join(os.homedir(), '.vsenv', 'work', 'mods');

// 定义核心API模块名称
const CORE_MODULES = {
    WELD_API: 'weld-api'
};

// 检查前置依赖是否满足
function checkDependencies(mod, loadedMods) {
    const dependencies = mod.pkg['weld-dependencies'] || {};
    
    for (const [depName, depVersion] of Object.entries(dependencies)) {
        // 检查核心模块依赖
        if (depName === CORE_MODULES.WELD_API && !global.WeldAPI) {
            throw new Error(`Mod ${mod.pkg.name} requires ${CORE_MODULES.WELD_API} but it's not available`);
        }
        
        // 检查其他mod依赖
        const depMod = loadedMods.find(m => m.pkg.name === depName);
        if (!depMod) {
            throw new Error(`Mod ${mod.pkg.name} requires ${depName} but it's not loaded`);
        }
        
        // 可选：版本检查（简单实现）
        if (depVersion && depMod.pkg.version !== depVersion) {
            console.warn(`[WML] Version mismatch: ${mod.pkg.name} requires ${depName}@${depVersion} but found ${depMod.pkg.version}`);
        }
    }
    return true;
}

// 拓扑排序mod（基于依赖关系）
function sortModsByDependency(mods) {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();
    
    function visit(mod) {
        if (temp.has(mod)) {
            throw new Error(`Circular dependency detected involving ${mod.pkg.name}`);
        }
        if (!visited.has(mod)) {
            temp.add(mod);
            
            // 处理前置依赖
            const dependencies = mod.pkg['weld-dependencies'] || {};
            for (const depName of Object.keys(dependencies)) {
                if (depName === CORE_MODULES.WELD_API) continue; // 核心模块跳过
                
                const depMod = mods.find(m => m.pkg.name === depName);
                if (depMod) visit(depMod);
            }
            
            temp.delete(mod);
            visited.add(mod);
            sorted.push(mod);
        }
    }
    
    mods.forEach(mod => {
        if (!visited.has(mod)) visit(mod);
    });
    
    return sorted;
}

function scanWeldMods() {
    if (!fs.existsSync(WELD_MODS_DIR)) return [];
    return fs.readdirSync(WELD_MODS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
            const dir = path.join(WELD_MODS_DIR, d.name);
            const pkgPath = path.join(dir, 'package.json');
            if (!fs.existsSync(pkgPath)) return null;
            
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                
                // 验证必要字段
                if (!pkg.name) {
                    console.error(`[WML] Mod in ${dir} is missing 'name' field`);
                    return null;
                }
                if (!pkg.main) {
                    console.error(`[WML] Mod ${pkg.name} is missing 'main' field`);
                    return null;
                }
                
                // 要求所有mod明确声明前置依赖（weld-api或其他mod）
                if (!pkg['weld-dependencies'] || Object.keys(pkg['weld-dependencies']).length === 0) {
                    console.error(`[WML] Mod ${pkg.name} must declare 'weld-dependencies'`);
                    return null;
                }
                
                return { dir, pkg };
            } catch (e) {
                console.error(`[WML] Failed to parse package.json in ${dir}`, e);
                return null;
            }
        })
        .filter(Boolean);
}

// 修改 loadWeldMod 函数
function loadWeldMod({ dir, pkg }, loadedMods = []) {
    const mainFile = path.join(dir, pkg.main || 'out/extension.js');
    if (!fs.existsSync(mainFile)) {
        throw new Error(`Main file not found for mod ${pkg.name}`);
    }
    
    try {
        // 检查前置依赖
        checkDependencies({ dir, pkg }, loadedMods);
        
        // 判断模块类型
        const isESModule = pkg.type === 'module' || pkg.main.endsWith('.mjs');
        
        if (isESModule) {
            // 使用 import() 动态导入 ES 模块
            import(`file://${mainFile}`).then(mod => {
                if (typeof mod?.activate === 'function') {
                    mod.activate();
                    console.log(`[WML] loaded ES module ${pkg.name} v${pkg.version}`);
                } else {
                    throw new Error(`Mod ${pkg.name} does not export an activate function`);
                }
            }).catch(e => {
                console.error(`[WML] failed to load ES module ${pkg.name}`, e);
            });
        } else {
            // 使用 require 加载 CommonJS 模块
            const mod = require(mainFile);
            if (typeof mod?.activate === 'function') {
                mod.activate();
                console.log(`[WML] loaded CommonJS module ${pkg.name} v${pkg.version}`);
                return true;
            } else {
                throw new Error(`Mod ${pkg.name} does not export an activate function`);
            }
        }
    } catch (e) {
        console.error(`[WML] failed to load ${pkg.name}`, e);
        return false;
    }
}

console.log('[WML] Welding Mod Loader v1.1.0 started');

// 安装依赖
function installDependencies(modPath) {
    try {
        const result = child_process.spawnSync('npm', ['install'], {
            cwd: modPath,
            stdio: 'inherit',
            shell: true
        });
        return result.status === 0;
    } catch (err) {
        console.error(`[WML] Failed to install dependencies:`, err);
        return false;
    }
}

// 先加载核心API模块
const coreApiPath = path.join(WELD_MODS_DIR, 'weld-api');
const corePkgPath = path.join(coreApiPath, 'package.json');

// 确保核心API的依赖已安装
if (fs.existsSync(corePkgPath)) {
    installDependencies(coreApiPath);
}

if (fs.existsSync(corePkgPath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));
        const mainFile = path.join(coreApiPath, pkg.main || 'weld-api.js');
        
        if (fs.existsSync(mainFile)) {
            // 使用 import() 动态导入 ES 模块
            import(`file://${mainFile}`).then(mod => {
                if (typeof mod?.activate === 'function') {
                    mod.activate();
                    console.log(`[WML] loaded core module ${CORE_MODULES.WELD_API} v${pkg.version}`);
                    
                    // 扫描并加载其他mod
                    const foundMods = scanWeldMods().filter(m => m.pkg.name !== CORE_MODULES.WELD_API);
                    const sortedMods = sortModsByDependency(foundMods);
                    const loadedMods = [{ dir: coreApiPath, pkg }];
                    
                    for (const mod of sortedMods) {
                        loadWeldMod(mod, loadedMods);
                        loadedMods.push(mod);
                    }
                    
                    console.log(`[WML] loaded ${loadedMods.length} mods successfully`);
                }
            }).catch(e => {
                console.error('[WML] failed to load core API module', e);
            });
        }
    } catch (e) {
        console.error('[WML] failed to load core API module', e);
    }
} else {
    console.error('[WML] weld-api not found in mods directory');
}