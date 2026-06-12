# 🦞 龙虾短剧工坊 — 全链路实机测试指南

> 本文档说明如何从零开始完成完整的短剧创作全链路测试。

## 前置条件

- 一个 **AI API Key**（推荐 DeepSeek，国内直接访问，价格低廉）
  - 注册：https://platform.deepseek.com
  - 充值：￥10 足够测试数百次
- Electron 运行环境或 `node` 命令行

## 全链路流程

```
角色设定 → AI剧本 → 图像生成 → AI配音 → 字幕 → BGM → 合成 → 发布
```

### Phase 1: 设置 API Key

1. 打开「设置」→「AI 模型配置」
2. 选择供应商：**DeepSeek**（国内首选）或 **OpenAI** / **硅基流动**
3. 输入 API Key
4. 点击「测试连接」验证连通性
5. 点击「保存设置」

### Phase 2: 创建角色

1. 进入「角色工坊」
2. 创建主角（如：总裁/女主）
3. 填写性格、外貌、声线
4. 使用「AI 增强描述」自动扩充

### Phase 3: 生成剧本

1. 进入「剧本工厂」
2. 选择角色和故事框架
3. 设定冲突和情感基调
4. 点击「生成剧本」— 等待 AI 创作
5. 审核并手动调整对话

### Phase 4: 展开分镜

1. 进入「分镜面板」
2. 已有场次自动生成
3. 用「AI 扩展」细化每个场景描述
4. 设定情绪标签（紧张/浪漫/悲伤...）

### Phase 5: 合成管线

1. 进入「合成管线」
2. **图像生成**：每场景→AI绘图→预览
3. **AI配音**：每句对话→选择声线→生成音频
4. **字幕**：自动生成 SRT/ASS 格式
5. **配乐**：BGM引擎自动匹配情绪
6. **预览**：画面+配音+字幕+BGM 同步播放

### Phase 6: 平台自适应

1. 进入「发布」页面
2. 选择发布平台（国内：抖音/快手/B站；海外：TikTok/YouTube/KakaoTV）
3. 查看「智能分析」评分和建议
4. 自适应参数优化（时长/比例/标签）
5. 编辑 SEO 元数据（标题/描述/标签）
6. 一键发布或导出草稿（剪映/FCPXML/ASS）

## 命令行一键测试

```bash
# 离线测试（14个模块，无需 API Key）
node scripts/self-test.js

# 全链路在线测试（需要 API Key）
set DEEPSEEK_API_KEY=sk-xxxxxxxxxx && node scripts/e2e-live-test.js
```

## 验证清单

- [ ] API Key 配置并测试连通
- [ ] 角色创建 + AI 增强
- [ ] 剧本生成（3+ 场景）
- [ ] 分镜展开
- [ ] 图像生成（至少 1 张）
- [ ] AI 配音（至少 1 句）
- [ ] 字幕生成（SRT + ASS）
- [ ] BGM 配乐
- [ ] 剪映草稿导出
- [ ] 平台自适应评分
- [ ] SEO 元数据
- [ ] .lspack 项目打包
- [ ] 项目导入回环验证

## 测试环境

| 项目 | 规格 |
|------|------|
| 构建工具 | Vite + React + TypeScript |
| 数据库 | sql.js (SQLite WASM) |
| AI API | DeepSeek / OpenAI / SiliconFlow / GLM |
| 图像 | FLUX.1 / DALL-E 3 |
| TTS | Fish Speech 1.5 |
| 视频 | FFmpeg WASM |
| 桌面 | Electron + 手动打包 |
| 手机 | PWA + Capacitor |
