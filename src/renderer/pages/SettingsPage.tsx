import React, { useState, useEffect } from 'react';
import { db, ai, translate, autodetect } from '../lib/bridge';

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
    try {
      await ai.configure(settings.llmProvider, settings.llmApiKey, settings.llmModel);
      const result = await ai.generateScript({ genre: '测试', style: '测试', duration: 30, keyword: '测试API连接' });
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

      {/* 授权管理 */}
      <LicenseSection />

      {/* 多语言翻译设置 */}
      <TranslationSection />

      {/* Git 远程备份 */}
      <RepoManagerSection />

      {/* 其他设置入口 */}
      {[
        { title: '⚙️ 输出设置', desc: '短片默认分辨率、格式、字幕样式', soon: true },
        { title: '🔄 音色更新', desc: '设置音色库自动更新时间', soon: true },
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

// License activation component
const LicenseSection: React.FC = () => {
  const [license, setLicense] = useState<any>(null);
  const [key, setKey] = useState('');
  const [edition, setEdition] = useState('professional');
  const [msg, setMsg] = useState('');
  const [editions, setEditions] = useState<any[]>([]);

  useEffect(() => {
    loadLicense();
    ai.getEditions().then(setEditions);
  }, []);

  const loadLicense = async () => {
    const l = await ai.getLicense();
    setLicense(l);
    setMsg(l.activated ? '' : '');
  };

  const handleActivate = async () => {
    if (!key) return;
    const result = await ai.activateLicense(key, edition);
    if (result.success) {
      setMsg('✅ 激活成功！已升级为 ' + (result.edition === 'professional' ? '专业版' : '永久版'));
      await loadLicense();
    } else {
      setMsg('❌ ' + (result.error || '激活失败'));
    }
    setTimeout(() => setMsg(''), 5000);
  };

  const handleDeactivate = async () => {
    await ai.deactivateLicense();
    setMsg('已恢复为社区版');
    await loadLicense();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🔑 授权管理</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        当前版本：{license?.edition === 'professional' ? '专业版' : license?.edition === 'lifetime' ? '永久版' : '社区版'}
        {license?.activated ? ' ✅ 已激活' : ''}
      </p>

      {msg && (
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: msg.includes('✅') ? '#10b98122' : '#e8414222', border: '1px solid', borderColor: msg.includes('✅') ? '#10b981' : '#e84142', fontSize: 13, color: msg.includes('✅') ? '#10b981' : '#ff6b6b' }}>
          {msg}
        </div>
      )}

      {!license?.activated ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>激活码</label>
            <input value={key} onChange={e => setKey(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>版本</label>
            {editions.filter(e => e.id !== 'community').map(e => (
              <button key={e.id} onClick={() => setEdition(e.id)}
                style={{
                  marginRight: 8, padding: '6px 14px', borderRadius: 6,
                  border: '1px solid', borderColor: edition === e.id ? '#e84142' : 'var(--border)',
                  background: edition === e.id ? '#e8414218' : 'transparent',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
                }}>
                {e.name} {e.price}
              </button>
            ))}
          </div>

          <button onClick={handleActivate}
            style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #e84142, #ff6b6b)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            🔑 激活
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            💡 演示激活码：<code>LOBSTER-PRO-2026-DEMO</code>
            <br />
            专业版：¥199/年（支持 AI 生成、视频合成、多平台发布）
            <br />
            永久版：¥599（终身更新 + 优先技术支持）
          </div>
        </>
      ) : (
        <button onClick={handleDeactivate}
          style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
          🔓 解除激活
        </button>
      )}
    </div>
  );
}

// Translation language settings
const TranslationSection: React.FC = () => {
  const [regions, setRegions] = useState<Record<string, any>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('');
  const [bilingual, setBilingual] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    async function init() {
      const groups = await translate.regionGroup();
      setRegions(groups);

      // Load saved preferences
      const savedLang = await db.getSetting('translationTargetLang');
      const savedRegion = await db.getSetting('translationTargetRegion');
      const savedBilingual = await db.getSetting('translationBilingual');
      const savedAuto = await db.getSetting('translationAuto');

      if (savedLang) setTargetLang(savedLang);
      if (savedRegion) { setSelectedRegion(savedRegion); }
      else if (Object.keys(groups).length > 0) setSelectedRegion(Object.keys(groups)[0]);
      if (savedBilingual === 'false') setBilingual(false);
      if (savedAuto === 'false') setAutoTranslate(false);
    }
    init();
  }, []);

  const handleSave = async () => {
    await db.setSetting('translationTargetLang', targetLang);
    await db.setSetting('translationTargetRegion', selectedRegion);
    await db.setSetting('translationBilingual', bilingual ? 'true' : 'false');
    await db.setSetting('translationAuto', autoTranslate ? 'true' : 'false');
    setSaved('✅ 翻译设置已保存');
    setTimeout(() => setSaved(''), 2500);
  };

  const currentLang = regions[selectedRegion]?.languages || [];
  const selectedLangInfo = currentLang.find((l: any) => l.code === targetLang);

  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🌐 多语言翻译设置</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        设置默认翻译语言，用于海外平台发布
        {targetLang && selectedLangInfo && (
          <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
            当前: {selectedLangInfo.flag} {selectedLangInfo.nativeName}
          </span>
        )}
      </p>

      {/* Region selector */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>选择区域</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(regions).map(([key, region]: [string, any]) => (
            <button key={key} onClick={() => { setSelectedRegion(key); setTargetLang(''); }}
              style={{
                padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${selectedRegion === key ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedRegion === key ? 'var(--accent)' : 'var(--bg-secondary)',
                color: selectedRegion === key ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer', fontSize: 12,
              }}>
              {region.name} ({region.languages?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Language grid */}
      {currentLang.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>选择目标语言</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 4 }}>
            {currentLang.map((lang: any) => (
              <button key={lang.code} onClick={() => setTargetLang(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
                  border: `1px solid ${targetLang === lang.code ? 'var(--accent)' : 'var(--border)'}`,
                  background: targetLang === lang.code ? 'var(--accent)22' : 'var(--bg-secondary)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                }}>
                <span style={{ fontSize: 16 }}>{lang.flag}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: targetLang === lang.code ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lang.nativeName}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {lang.name} {lang.direction === 'rtl' ? '🔁' : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings toggles */}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
          <input type="checkbox" checked={bilingual} onChange={e => setBilingual(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          双语字幕（原文 + 翻译并列显示）
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
          <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          自动翻译（发布时自动翻译为选中语言）
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleSave}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            cursor: 'pointer', fontSize: 14, flex: 1,
          }}>
          💾 保存翻译设置
        </button>
        {saved && <span style={{ fontSize: 13, color: '#10b981' }}>{saved}</span>}
      </div>

      {/* Stats */}
      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        支持 50 种语言 · 4 种 RTL方向（阿拉伯语/乌尔都语/希伯来语/波斯语）· SRT/ASS双语字幕格式
        · 自动适配海外平台语言要求
      </div>
    </div>
  );
};

// Separate component for Git backup
const RepoManagerSection: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteName, setRemoteName] = useState('origin');
  const [msg, setMsg] = useState('');
  const [commitMsg, setCommitMsg] = useState('auto backup');
  const [loading, setLoading] = useState('');

  useEffect(() => { refreshStatus(); }, []);

  const refreshStatus = async () => {
    const s = await ai.gitStatus();
    setStatus(s);
    if (s.remotes?.length > 0) {
      setRemoteUrl(s.remotes[0].url);
      setRemoteName(s.remotes[0].name);
    }
  };

  const handleSetRemote = async () => {
    if (!remoteUrl) return;
    setLoading('remote');
    await ai.gitSetRemote(remoteName, remoteUrl);
    await refreshStatus();
    setMsg('✅ 远程仓库已设置');
    setLoading('');
    setTimeout(() => setMsg(''), 3000);
  };

  const handlePush = async () => {
    setLoading('push');
    const result = await ai.gitCommitAndPush(commitMsg, remoteName || 'origin');
    setMsg(result.success ? '✅ 推送成功！' : '❌ ' + (result.error || '推送失败'));
    setLoading('');
    await refreshStatus();
    setTimeout(() => setMsg(''), 5000);
  };

  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🔒 Git 远程备份</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        将项目代码备份到 GitHub / Gitee
      </p>

      {!status ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>正在获取状态...</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 12 }}>
            <span>📂 <strong>{status.branch}</strong></span>
            <span>🔖 <code>{status.commit}</code></span>
            <span>{status.hasChanges ? `📝 ${status.fileCount} 个文件待提交` : '✅ 工作区干净'}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>远程仓库地址</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={remoteUrl}
                onChange={e => setRemoteUrl(e.target.value)}
                placeholder="https://github.com/用户名/仓库名.git"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
              />
              <button onClick={handleSetRemote} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: loading === 'remote' ? 'var(--border)' : 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                {loading === 'remote' ? '...' : '绑定'}
              </button>
            </div>
          </div>

          {status.remotes?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {status.remotes.map((r: any) => (
                <div key={r.name} style={{ padding: '4px 10px', borderRadius: 6, background: '#10b98122', border: '1px solid #10b98144', fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {r.type === 'github' ? '🐙' : '🔗'} {r.name}: {r.url}
                  <button onClick={() => { ai.gitRemoveRemote(r.name).then(() => refreshStatus()); }}
                    style={{ background: 'none', border: 'none', color: '#e84142', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {status.hasChanges && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>提交说明</label>
              <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePush} disabled={loading === 'push'}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: loading === 'push' ? 'var(--border)' : '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, flex: 1 }}>
              {loading === 'push' ? '⏳ 提交并推送中...' : '⬆️ 提交并推送'}
            </button>
            <button onClick={refreshStatus}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
              🔄 刷新
            </button>
          </div>

          {msg && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: msg.includes('✅') ? '#10b98122' : '#e8414222', border: `1px solid ${msg.includes('✅') ? '#10b981' : '#e84142'}`, fontSize: 13, color: msg.includes('✅') ? '#10b981' : '#ff6b6b' }}>
              {msg}
            </div>
          )}

          {status.recentLog?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>最近提交：</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {status.recentLog.map((line: string, i: number) => (
                  <div key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsPage;
