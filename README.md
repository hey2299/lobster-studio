# 🦞 龙虾短剧工坊 — Lobster Studio

> **AI 驱动的短剧创作全栈工具**
> 从角色设定到多平台发布，一条龙完成。

---

## 📦 项目结构

```
lobster-studio/
├── src/
│   ├── main/                    # Electron 主进程 (Node.js 模块)
│   │   ├── main.js              #  Electron 入口 + 全部 IPC handler
│   │   ├── preload.js           #  安全 Bridge，暴露 electronAPI
│   │   ├── database.js          #  持久化层 (sql.js / SQLite WASM)
│   │   ├── ai-engine.js         #  AI API 调用层 (DeepSeek/OpenAI/SiliconFlow/GLM)
│   │   ├── vector-memory.js     #  128维向量检索引擎 (余弦相似度)
│   │   ├── license.js           #  授权系统 (社区/专业/永久)
│   │   ├── bgm-engine.js        #  背景配乐生成 (Web Audio API)
│   │   ├── subtitle-engine.js   #  字幕生成 (SRT/ASS)
│   │   ├── draft-export.js      #  剪辑软件导出 (CapCut/FCPXML/ASS)
│   │   ├── translation.js       #  翻译引擎 (50种语言，AI驱动)
│   │   ├── auto-detect.js       #  平台自适应检测 (13平台双模式)
│   │   ├── publish-engine.js    #  一键发布引擎 (国内+海外)
│   │   ├── video-composer.js    #  视频合成 (FFmpeg WASM)
│   │   ├── git-sync.js          #  Git 远程备份
│   │   ├── project-pack.js      #  项目打包 (.lspack)
│   │   ├── user-account.js      #  用户账户系统
│   │   └── web-fetch-shim.js    #  Web 请求垫片
│   └── renderer/                # React 渲染进程
│       ├── App.tsx              #  路由 + 主题切换
│       ├── main.tsx             #  React 入口
│       ├── index.html           #  HTML 模板
│       ├── index.css            #  全局样式 (暗/亮双主题 + 响应式)
│       ├── lib/bridge.ts        #  IPC Bridge 封装 (全类型安全)
│       ├── components/
│       │   ├── Sidebar.tsx      #  导航侧边栏 (响应式折叠)
│       │   └── TopBar.tsx       #  顶部面包屑
│       └── pages/
│           ├── DashboardPage.tsx    # 工作台 (统计 + 快捷操作)
│           ├── ScriptFactoryPage.tsx # 剧本工厂
│           ├── CharacterWorkshopPage.tsx # 角色工坊
│           ├── StoryboardPage.tsx    # 分镜面板
│           ├── VoiceStudioPage.tsx   # 音色工坊
│           ├── PipelinePage.tsx      # 合成管线 (全自动)
│           ├── PublishPage.tsx       # 一键发布
│           └── SettingsPage.tsx      # 设置 (AI/授权/翻译/Git)
├── scripts/                    # 工具脚本
│   ├── self-test.js            #  离线自测 (14模块, 64断言)
│   ├── e2e-test.js             #  E2E离线测试 (12模块)
│   ├── e2e-live-test.js        #  全链路在线测试 (需 API Key)
│   ├── build-installer.js      #  安装包构建
│   ├── build-mobile.js         #  手机版构建
│   ├── pack.js                 #  便携版打包
│   └── demo-pipeline.js        #  演示管线
├── knowledge-base/             # 知识库
│   └── known-errors.md         #  缺陷分类 [ACTIVE]/[FLAG]/[FIXED]
├── public/                     # 静态资源
│   ├── sw.js                   #  Service Worker
│   ├── manifest.json           #  PWA Manifest
│   └── LIVE-TEST-GUIDE.md      #  全链路在线测试指南
├── release/                    # 构建产物
│   ├── LobsterStudio-win32-x64/ # 便携版 (190MB)
│   ├── installer/               # 安装包 (311MB)
│   └── mobile/                  # 手机版
└── vite.config.js              # Vite 构建配置
```

## 🚀 快速开始

### 在线体验
直接在浏览器访问：**[https://hey2299.github.io/lobster-studio/](https://hey2299.github.io/lobster-studio/)**

### 前置条件
- **Node.js** ≥ 18 (已安装 v22.19.0)
- **npm** (已安装 10.9.3)
- 可选：**API Key** (推荐 DeepSeek，国内可用)

### 开发
```bash
# 安装依赖（已完成）
npm install

# 前端开发（Vite HMR）
npx vite --config vite.config.js

# 构建前端
npx vite build --config vite.config.js

# 启动 Electron（需要 display server）
npx electron .
```

### 测试
```bash
# 离线模块测试 (14模块, 无需API Key)
node scripts/self-test.js

# 全链路在线测试 (需 API Key)
set DEEPSEEK_API_KEY=sk-xxx && node scripts/e2e-live-test.js
```

### 构建
```bash
# 便携版
node scripts/pack.js

# 安装包
node scripts/build-installer.js

# 手机版
node scripts/build-mobile.js
```

## 🧪 测试覆盖 (64/64 自测 + 43/43 全链路)

### 离线自测 `node scripts/self-test.js` — 64/64 ✅

| 模块 | 断言数 | 状态 |
|------|--------|------|
| database.js | 7 | ✅ |
| vector-memory.js | 5 | ✅ |
| license.js | 8 | ✅ |
| bgm-engine.js | 4 | ✅ |
| subtitle-engine.js | 5 | ✅ |
| draft-export.js | 5 | ✅ |
| auto-detect.js | 6 | ✅ |
| translation.js | 7 | ✅ |
| publish-engine.js | 3 | ✅ |
| git-sync.js | 1 | ✅ |
| video-composer.js | 2 | ✅ |
| ai-engine.js | 1 | ✅ |
| user-account.js | 6 | ✅ |
| project-pack.js | 4 | ✅ |

### 全链路实机测试 `node scripts/e2e-live-test.js` — 43/43 ✅

| 阶段 | 测试项 | 结果 |
|------|--------|------|
| Phase 1 | 12模块加载 | ✅ |
| Phase 2 | 向量记忆 + 授权系统 | ✅ |
| Phase 3 | BGM/字幕/导出/自适应/翻译/发布 | ✅ |
| Phase 4 | AI剧本/AI角色增强/AI翻译/ASS双语 | ✅ (DeepSeek API)
| Phase 5 | 项目打包导入/发布记录 | ✅ |

> 需要 API Key（DeepSeek/OpenAI/硅基流动），设置环境变量 `DEEPSEEK_API_KEY` 运行。

## 🔧 核心架构

### 零外部依赖
所有 native 模块完全纯 JS 替代：
- **SQLite** → `sql.js` (WebAssembly)
- **FFmpeg** → `@ffmpeg/ffmpeg` (WebAssembly)
- **数据库** → 同步 API，无 Python 依赖

### 授权体系
| 版本 | 特性 |
|------|------|
| 社区版 | 基础功能，场景数量限制 |
| 专业版 | AI 剧本/图像/TTS，向量记忆 |
| 永久版 | 全部功能，无限发布 |

### 发布平台 (13个)
- **国内**: 抖音 / 快手 / B站 / 视频号 / 小红书
- **海外**: TikTok / YouTube / Instagram / KakaoTV / NaverTV / Facebook / X(Twitter)
- **自适应**: 分辨率/时长/标签/风格自动适配

### 翻译 (50种语言，15个区域)
全球 / 中国 / 南亚 / 西班牙语 / 法语 / 中东 / 斯拉夫 / 罗曼 / 日耳曼 / 北欧 / 东亚 / 东南亚 / 西斯拉夫 / 芬兰-乌戈尔 / 巴尔干 / 非洲 / 中亚

## 🌐 在线演示

> [https://hey2299.github.io/lobster-studio/](https://hey2299.github.io/lobster-studio/)

GitHub Pages 部署，PWA 支持，可在手机浏览器中安装到桌面。

```bash
# 部署到 GitHub Pages（需在仓库 Settings 中启用 Pages）
node scripts/deploy-gh-pages.js
```

## 📜 版本历史

```
29 commits (master)
├─ 55aed94 Add: GitHub Pages deploy script
├─ ca5e9db Fix: e2e-live-test 43/43 all green
├─ b4452d7 Add: Batch export (SRT+ASS+CapCut+FCPXML+BGM)
├─ 7c976cc Add: Scene preview player + drag-to-reorder
├─ 3f1c184 Fix: e2e-live-test.js v1.1 — all AI calls verified
├─ 6b5924d Add: Comprehensive README with full project map
├─ 7f29aa0 Add: Responsive layout + mobile sidebar
├─ a2e3162 Add: Theme switch + upgraded Dashboard + Pipeline fix
├─ 1cd1d90 Add: Full-chain live test suite + E2E test guide
├─ 09f3800 Fix: All 7 defects repaired, 64/64 tests passing
├─ d55a2df Add: self-test suite v3 + knowledge base
├─ b85f28e Phase 5 v9: Installer package + Mobile version
├─ ... (17 more)
└─ a5303ea Initial commit
```

## ⚠️ 已知限制
- **FFmpeg WASM**: 30MB+，性能低于原生
- **FFmpeg WASM**: 30MB+，性能低于原生
- **sql.js**: 同步API，大文档需分页
- **Electron**: 需 display server（Windows桌面）

## 📝 许可
MIT License — 免费使用，可商用
