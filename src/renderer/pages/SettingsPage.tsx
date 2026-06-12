import React, { useState, useEffect } from 'react';
import { db, ai } from '../lib/bridge';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    llmProvider: 'deepseek',
    llmApiKey: '',
    llmModel: 'deepseek-chat',
    imageProvider: 'openai',
    imageApiKey: '',
    imageModel: 'dall-e-3',
    ttsProvider: 'openai',
    ttsApiKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const llmApiKey = await db.getSetting('llmApiKey');
    const imageApiKey = await db.getSetting('imageApiKey');
    const ttsApiKey = await db.getSetting('ttsApiKey');
    const llmProvider = await db.getSetting('llmProvider');
    const llmModel = await db.getSetting('llmModel');
    setSettings({
      llmProvider: llmProvider || 'deepseek',
      llmApiKey: llmApiKey || '',
      llmModel: llmModel || 'deepseek-chat',
      imageProvider: 'openai',
      imageApiKey: imageApiKey || '',
      imageModel: 'dall-e-3',
      ttsProvider: 'openai',
      ttsApiKey: ttsApiKey || '',
    });
  };

  const saveSettings = async () => {
    await db.setSetting('llmApiKey', settings.llmApiKey);
    await db.setSetting('imageApiKey', settings.imageApiKey);
    await db.setSetting('ttsApiKey', settings.ttsApiKey);
    await db.setSetting('llmProvider', settings.llmProvider);
    await db.setSetting('llmModel', settings.llmModel);
    await ai.configure(settings.llmProvider, settings.llmApiKey, settings.llmModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    setTestResult('⏳ 测试连接中...');
    // Try generating a simple script to test the API
    try {
      await ai.configure(settings.llmProvider, settings.llmApiKey, settings.llmModel);
      const result = await ai.generateScript({
        genre: '测试', style: '测试', duration: 30, keyword: '测试API连接',
      });
      if (result.success) {
        setTestResult('✅ API 连接成功！已生成测试剧本');
      } else {
        setTestResult(`❌ API 错误：${result.error || '未知错误'}`);
      }
    } catch (e: any) {
      setTestResult(`❌ 连接失败：${e.message}`);
    }
  };

  const providers = [
    { value: 'deepseek', label: 'DeepSeek', desc: '性价比高，推荐首选' },
    { value: 'openai', label: 'OpenAI', desc: '需要海外网络' },
    { value: 'siliconflow', label: 'SiliconFlow', desc: '国内可用，需注册' },
    { value: 'glm', label: '智谱 GLM', desc: '国内可用，稳定' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 750 }}>
      {saved && (
        <div style={{
          position: 'fixed', top: 60, right: 24, padding: '10px 20px',
          borderRadius: 8, background: '#10b981', color: '#fff', fontWeight: 600,
          fontSize: 14, zIndex: 1000, animation: 'fadeIn 0.3s',
        }}>
          ✅ 设置已保存
        </div>
      )}

      {/* AI 模型配置 */}
      <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🧠 AI 模型配置</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>至少配置一个语言模型 API 密钥才能生成剧本</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>AI 供应商</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {providers.map((p) => (
              <button key={p.value} onClick={() => setSettings({ ...settings, llmProvider: p.value })}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px solid ${settings.llmProvider === p.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: settings.llmProvider === p.value ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: settings.llmProvider === p.value ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                }}>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>API Key</label>
          <input value={settings.llmApiKey}
            onChange={(e) => setSettings({ ...settings, llmApiKey: e.target.value })}
            placeholder="sk-..." type="password"
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>模型名称</label>
          <input value={settings.llmModel}
            onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
            placeholder="deepseek-chat"
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          💡 DeepSeek（sk-...）注册免费赠送额度，无需海外网络。
          <br />
          国内用户推荐使用 DeepSeek 或硅基流动（SiliconFlow）。
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveSettings}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 600,
              cursor: 'pointer', fontSize: 14, flex: 1,
            }}>
            💾 保存设置
          </button>
          <button onClick={testConnection}
            style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
              cursor: 'pointer', fontSize: 14,
            }}>
            🔌 测试连接
          </button>
        </div>

        {testResult && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: testResult.includes('✅') ? '#10b98122' : testResult.includes('❌') ? '#e8414222' : 'var(--bg-secondary)',
            border: `1px solid ${testResult.includes('✅') ? '#10b981' : testResult.includes('❌') ? '#e84142' : 'var(--border)'}`,
            fontSize: 13, color: testResult.includes('✅') ? '#10b981' : testResult.includes('❌') ? '#ff6b6b' : 'var(--text-secondary)',
          }}>
            {testResult}
          </div>
        )}
      </div>

      {/* 其他设置入口 */}
      {[
        { title: '🔗 发布平台绑定', desc: '绑定抖音、快手、视频号等平台的发布账号', soon: true },
        { title: '⚙️ 输出设置', desc: '短片默认分辨率、格式、字幕样式', soon: true },
        { title: '💾 角色记忆库', desc: '管理跨短剧角色记忆存储位置和备份', soon: true },
        { title: '🔄 音色更新', desc: '设置音色库自动更新时间', soon: true },
        { title: '🔑 授权与更新', desc: '软件激活、许可证信息、自动更新', soon: true },
      ].map((section) => (
        <div key={section.title} style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 20px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 14, opacity: section.soon ? 0.5 : 1,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{section.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{section.desc}</div>
          </div>
          {section.soon && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>即将上线</span>}
        </div>
      ))}
    </div>
  );
};

export default SettingsPage;
