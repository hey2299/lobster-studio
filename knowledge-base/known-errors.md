# 🦞 Lobster Studio — Known Errors & Solutions

> 自动维护 | 每次自测记录持久保留
> 最后更新: 2026-06-12 13:18 GMT+8

## 如何阅读
- `[ACTIVE]` — 当前仍存在的问题
- `[FIXED]` — 已修复的错误（保留供参考）
- `[FLAG]` — 设计约束/非错误

---

## 当前缺陷 [ACTIVE]

### ACTIVE: VM: semantic search returns empty results
- **时间**: 2026/6/12 13:17
- **模块**: `vector-memory.js`
- **错误**: `searchSimilarCharacters()` 始终返回空数组
- **根因**: `generateEmbedding()` 使用确定性哈希构建128维向量，但 `searchSimilarCharacters` 在 `db.prepare` 时字符 ID 不匹配，或嵌入生成逻辑与存储时不一致（未使用 char.id 匹配）
- **影响**: 语义搜索功能不可用，记忆系统无法召回角色
- **方案**: 修复 embed → 存储 → 搜索回路的向量一致性；添加单元测试验证同一文本嵌入的前后一致性

### ACTIVE: VM: getMemoryStats undefined
- **时间**: 2026/6/12 13:17
- **模块**: `vector-memory.js`
- **错误**: `getMemoryStats()` 不是函数或返回格式错误
- **影响**: 无法获取记忆系统统计信息
- **方案**: 确认该函数签名，或实现标准统计接口

### ACTIVE: LIC: pro has AI (checkFeature key mismatch)
- **时间**: 2026/6/12 13:17
- **模块**: `license.js`
- **错误**: `checkFeature('aiScriptGeneration')` 在专业版下返回 false
- **根因**: 功能门控 key 名 `'aiScriptGeneration'` 与 license 配置中的 feature 列表不匹配
- **影响**: 专业版无法启用 AI 剧本生成功能
- **方案**: 统一 Feature key 命名：检查 license.js 中 features 数组的实际 key 名，与 checkFeature 调用方保持一致

### ACTIVE: LIC: enterprise unlimited (checkFeature after deactivate)
- **时间**: 2026/6/12 13:17
- **模块**: `license.js`
- **错误**: `deactivateLicense()` 后重新激活企业版，`checkFeature('unlimitedScenes')` 仍返回 false
- **根因**: 激活企业版后状态未正确更新，或 license 模块中有缓存状态未刷新
- **影响**: 企业版 feature 检查失效
- **方案**: 修复 `activateLicense()` 后的状态刷新逻辑

### ACTIVE: PUB: getPlatforms returns empty object
- **时间**: 2026/6/12 13:17
- **模块**: `publish-engine.js`
- **错误**: `getPlatforms()` 返回 `{}`（空对象）
- **根因**: 依赖于 `database.getSetting()` 的 DB 调用，在 DB 未初始化时返回0个平台（fallback 未实现）
- **影响**: 发布页面无法显示平台列表
- **方案**: 添加硬编码 fallback 平台数据，使模块在无 DB 状态下也能工作

### ACTIVE: PUB: generateSEOMetadata returns object without title
- **时间**: 2026/6/12 13:17
- **模块**: `publish-engine.js`
- **错误**: `generateSEOMetadata({title:'Test'}).title` 返回 undefined
- **根因**: 返回对象中未包含传入的 title 字段
- **影响**: SEO 元数据生成不完整
- **方案**: 在返回对象中包含 title、genre 等原始输入字段

### ACTIVE: TR: language objects missing `region` field
- **时间**: 2026/6/12 13:17
- **模块**: `translation.js`
- **错误**: `getLanguageInfo('en')` 返回的对象中没有 `region` 字段（有 name/nativeName/flag/code 等）
- **根因**: 语言数据定义时未包含 region 分组字段
- **影响**: 前端语言选择器无法按区域分组
- **方案**: 确保每个语言对象有 `region` 字段（已在 `groupByRegion()` 中实现分组但单个 lagninfo 缺少 region）

---

## 设计约束 [FLAG]

### FLAG: VC: getAvailableOutputs 需要 Electron 运行时
- **模块**: `video-composer.js`
- **说明**: `@ffmpeg/wasm` 需要浏览器/Electron 环境加载 WASM，Node 裸跑不可用
- **影响**: 无 — Electron 中正常工作

### FLAG: GIT: git not found in sandbox PATH
- **模块**: `git-sync.js`
- **说明**: 沙箱环境没有 git.exe，发布版中 git 内置
- **影响**: 无 — 真实环境有 git

### FLAG: Database shared state between tests
- **模块**: `database.js`
- **说明**: 所有模块共享同一个 `db` 全局实例，Node 裸跑时多个 require 顺序可能导致 db 未初始化
- **影响**: Electron 中一切正常

### FLAG: user-account register: data persistence across runs
- **模块**: `user-account.js`
- **说明**: 测试数据会持久化到 DB，第二次运行注册同一用户会失败（预期行为）
- **影响**: 无 — 安全的跨会话持久化

---

## 已修复 [FIXED]

（暂无 — 等修复后移动到这里）

---

## 自动测试历史

| 时间 | 通过 | 失败 | 备注 |
|------|------|------|------|
| 2026-06-12 13:16 | 48 | 15 | 首次全模块测试，大量测试假设错误 |
| 2026-06-12 13:17 | 55 | 9 | 修正测试期望后，暴露出7个真缺陷 |

*每次运行 `node scripts/self-test.js` 自动追加*

### [ACTIVE] VM: semantic search - cold boss
- **Time**: 2026/6/12 13:34:07
- **Error**: `No results`
- **Solution**: TBD


### [ACTIVE] VM: semantic search - warm girl
- **Time**: 2026/6/12 13:34:07
- **Error**: `No results`
- **Solution**: TBD


### [ACTIVE] LIC: pro has AI
- **Time**: 2026/6/12 13:34:07
- **Error**: `PRO should have AI`
- **Solution**: TBD


### [ACTIVE] LIC: enterprise unlimited
- **Time**: 2026/6/12 13:34:07
- **Error**: `Enterprise unlimited`
- **Solution**: TBD


### [ACTIVE] PUB: getPlatforms returns data
- **Time**: 2026/6/12 13:34:07
- **Error**: `Expected >=6 platforms, got 0`
- **Solution**: TBD


### [ACTIVE] USR: register
- **Time**: 2026/6/12 13:34:07
- **Error**: `用户名已存在`
- **Solution**: TBD


### [ACTIVE] VM: semantic search - cold boss
- **Time**: 2026/6/12 13:34:44
- **Error**: `No results`
- **Solution**: TBD


### [ACTIVE] VM: semantic search - warm girl
- **Time**: 2026/6/12 13:34:44
- **Error**: `No results`
- **Solution**: TBD


### [ACTIVE] LIC: enterprise unlimited
- **Time**: 2026/6/12 13:34:44
- **Error**: `Enterprise batch failed`
- **Solution**: TBD


### [ACTIVE] USR: register
- **Time**: 2026/6/12 13:34:44
- **Error**: `用户名已存在`
- **Solution**: TBD


### [ACTIVE] LIC: enterprise unlimited
- **Time**: 2026/6/12 13:35:50
- **Error**: `Enterprise batch failed`
- **Solution**: TBD


### [ACTIVE] USR: register
- **Time**: 2026/6/12 13:35:50
- **Error**: `用户名已存在`
- **Solution**: TBD

