import React, { useState, useEffect } from 'react';
import { db, ai, translate, autodetect } from '../lib/bridge';

const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [settings, setSettings] = useState<any>({
    llmProvider: 'deepseek',
    llmApiKey: '',
    llmModel: 'deepseek-chat',
  });

  useEffect(() => {
    db.getSetting('llmProvider').then(v => v && setSettings(s => ({...s, llmProvider: v})));
    db.getSetting('llmApiKey').then(v => v && setSettings(s => ({...s, llmApiKey: v})));
    db.getSetting('llmModel').then(v => v && setSettings(s => ({...s, llmModel: v})));
  }, []);

  const providers = [
    { value: 'deepseek', label: '🧠 DeepSeek', desc: '国内可用，性价比高' },
    { value: 'openai', label: '🌐 OpenAI', desc: 'GPT-4，需海外网络' },
    { value: 'siliconflow', label: '🔮 硅基流动', desc: 'SiliconFlow，免费额度' },
    { value: 'glm', label: '💠 GLM', desc: '智谱AI，国产大模型' },
  ];

  const saveSettings = async () => {
    await Promise.all([
      db.setSetting('llmProvider', settings.llmProvider),
      db.setSetting('llmApiKey', settings.llmApiKey),
      db.setSetting('llmModel', settings.llmModel),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    setTestResult('⏳ 测试中...');
    try {
      const r = await ai.testConnection(settings.llmProvider, settings.llmApiKey, settings.llmModel);
      setTestResult(r.result || r.error || '连接失败');
    } catch (e: any) {
      setTestResult('❌ ' + (e.message || '连接异常'));
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 750 }}>
      {/* Toast通知 */}
      {saved && (
        <div style={{
          position: 'fixed', top: 60, right: 24, padding: '10px 20px',
          borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', fontWeight: 600, fontSize: 14, zIndex: 1000,
          animation: 'fadeIn 0.3s', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>✅</span> 设置已保存
        </div>
      )}

      {/* ===== 分区 1: AI模型 ===== */}
      <SectionCard icon="🧠" title="AI 模型配置" subtitle="至少配置一个语言模型 API 密钥才能使用 AI 功能">
        <ProviderGrid providers={providers} selected={settings.llmProvider} onSelect={(v) => setSettings({...settings, llmProvider: v})} />

        <FieldRow label="API Key" tip="建议使用 DeepSeek，国内直接访问">
          <input value={settings.llmApiKey}
            onChange={(e) => setSettings({ ...settings, llmApiKey: e.target.value })}
            placeholder="sk-..." type="password" className="input" />
        </FieldRow>

        <FieldRow label="模型名称">
          <input value={settings.llmModel}
            onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
            placeholder="deepseek-chat" className="input" />
        </FieldRow>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={saveSettings} className="btn-primary" style={{ flex: 1 }}>
            💾 保存设置
          </button>
          <button onClick={testConnection} className="btn-secondary">
            🔌 测试连接
          </button>
        </div>

        {testResult && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: testResult.includes('✅') ? '#10b98111' : testResult.includes('❌') ? '#e8414211' : 'var(--bg-secondary)',
            border: `1px solid ${testResult.includes('✅') ? 'rgba(16,185,129,0.3)' : testResult.includes('❌') ? 'rgba(232,65,66,0.3)' : 'var(--border)'}`,
            fontSize: 13,
            color: testResult.includes('✅') ? '#10b981' : testResult.includes('❌') ? '#ff6b6b' : 'var(--text-secondary)',
          }}>
            {testResult}
          </div>
        )}
      </SectionCard>

      {/* ===== 分区 2: 授权管理 ===== */}
      <LicenseSectionCard />

      {/* ===== 分区 3: 多语言翻译 ===== */}
      <TranslationSectionCard />

      {/* ===== 分区 4: Git 远程备份 ===== */}
      <GitSectionCard />

      {/* ===== 即将上线 ===== */}
      <SectionCard icon="🚀" title="更多功能" subtitle="正在开发中" soon badge="coming">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SoonTag>⚙️ 输出设置</SoonTag>
          <SoonTag>🔄 音色更新</SoonTag>
          <SoonTag>📊 数据分析</SoonTag>
          <SoonTag>🎨 主题切换</SoonTag>
          <SoonTag>📁 批量导出</SoonTag>
        </div>
      </SectionCard>
    </div>
  );
};

// ====== Section Card Wrapper ======
function SectionCard({ icon, title, subtitle, children, soon, badge }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode; soon?: boolean; badge?: string;
}) {
  return (
    <div className="settings-card" style={{
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: 24, marginBottom: 16,
      opacity: soon ? 0.55 : 1,
      transition: 'opacity 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 4 : 16 }}>
        <span className="settings-card-icon">{icon}</span>
        <div style={{ flex: 1 }}>
          <h3 className="settings-card-title">{title}</h3>
          {subtitle && <p className="settings-card-subtitle">{subtitle}</p>}
        </div>
        {badge && (
          <span className="badge-coming">即将上线</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SoonTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 8,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      fontSize: 13, color: 'var(--text-muted)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
      <span className="badge-coming" style={{ marginLeft: 4 }}>soon</span>
    </div>
  );
}

function ProviderGrid({ providers, selected, onSelect }: {
  providers: any[]; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">AI 供应商</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {providers.map((p) => (
          <button key={p.value} onClick={() => onSelect(p.value)}
            className={selected === p.value ? 'provider-btn selected' : 'provider-btn'}>
            <div className="provider-btn-label">{p.label}</div>
            <div className="provider-btn-desc">{p.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="field-label">
        {label}
        {tip && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>💡 {tip}</span>}
      </label>
      {children}
    </div>
  );
}

// ====== License (美化版) ======
const LicenseSectionCard: React.FC = () => {
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
    if (!key.trim()) { setMsg('❌ 请输入激活码'); return; }
    const result = await ai.activateLicense(key.trim(), edition);
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

  const editionNames: Record<string, string> = { community: '社区版', professional: '专业版', lifetime: '永久版' };
  const editionColors: Record<string, string> = { community: '#6b7280', professional: '#e84142', lifetime: '#f59e0b' };

  return (
    <SectionCard icon="🔑" title="授权管理" subtitle={`当前版本：${editionNames[license?.edition] || '社区版'} ${license?.activated ? '✅ 已激活' : '❌ 未激活'}`}>
      {/* 版本状态条 */}
      <div className="license-status-bar">
        <div className="license-edition-tag" style={{ background: editionColors[license?.edition || 'community'] + '22', color: editionColors[license?.edition || 'community'], borderColor: editionColors[license?.edition || 'community'] + '44' }}>
          {editionNames[license?.edition || 'community']}
        </div>
        <div className="license-status-dot" style={{ background: license?.activated ? '#10b981' : '#e84142' }} />
        <span style={{ fontSize: 13, color: license?.activated ? '#10b981' : '#e84142', fontWeight: 500 }}>
          {license?.activated ? '已激活' : '未激活'}
        </span>
      </div>

      {msg && (
        <div className={`msg-box ${msg.includes('✅') ? 'msg-success' : 'msg-error'}`}>
          {msg}
        </div>
      )}

      {!license?.activated ? (
        <div className="license-activation-form">
          <FieldRow label="激活码">
            <input value={key} onChange={e => setKey(e.target.value)} placeholder="LOBSTER-XXXX-XXXX-XXXX"
              className="input" />
          </FieldRow>

          <div style={{ marginBottom: 12 }}>
            <label className="field-label">版本选择</label>
            <div className="edition-grid">
              {editions.filter((e: any) => e.id !== 'community').map((e: any) => (
                <button key={e.id} onClick={() => setEdition(e.id)}
                  className={`edition-card ${edition === e.id ? 'active' : ''}`}>
                  <div className="edition-name">{e.name}</div>
                  <div className="edition-price">{e.price}</div>
                  <div className="edition-features">{(e.features || []).slice(0, 3).join(' · ')}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleActivate} className="btn-primary license-activate-btn">
            🚀 激活授权
          </button>
        </div>
      ) : (
        <button onClick={handleDeactivate} className="btn-ghost license-deactivate-btn">
          🔓 解除激活，恢复社区版
        </button>
      )}
    </SectionCard>
  );
};

// ====== Translation (美化版) ======
const TranslationSectionCard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [bilingual, setBilingual] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [regionGroups, setRegionGroups] = useState<Record<string, any[]>>({});

  useEffect(() => {
    async function init() {
      const groups = await translate.regionGroup();
      setRegionGroups(groups);
      const savedLang = await db.getSetting('translationTargetLang');
      const savedRegion = await db.getSetting('translationTargetRegion');
      const savedBilingual = await db.getSetting('translationBilingual');
      const savedAuto = await db.getSetting('translationAuto');
      if (savedLang) setTargetLang(savedLang);
      if (savedRegion && groups[savedRegion]) setSelectedRegion(savedRegion);
      else if (Object.keys(groups).length > 0) setSelectedRegion(Object.keys(groups)[0]);
      if (savedBilingual === 'false') setBilingual(false);
      if (savedAuto === 'false') setAutoTranslate(false);
    }
    init();
  }, []);

  const saveLangSettings = async (lang: string, region: string, bil: boolean, auto: boolean) => {
    await Promise.all([
      db.setSetting('translationTargetLang', lang),
      db.setSetting('translationTargetRegion', region),
      db.setSetting('translationBilingual', bil ? 'true' : 'false'),
      db.setSetting('translationAuto', auto ? 'true' : 'false'),
    ]);
  };

  return (
    <SectionCard icon="🌐" title="多语言翻译" subtitle="设置目标语言，Pipeline 和 Publish 将自动翻译字幕和元数据">
      {/* Region tabs */}
      {Object.keys(regionGroups).length > 0 && (
        <div className="region-tabs">
          {Object.keys(regionGroups).map(r => (
            <button key={r} onClick={() => setSelectedRegion(r)}
              className={`region-tab ${selectedRegion === r ? 'active' : ''}`}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Language grid */}
      {selectedRegion && regionGroups[selectedRegion] && (
        <div className="lang-grid">
          {regionGroups[selectedRegion].map((lang: any) => (
            <button key={lang.code} onClick={() => { setTargetLang(lang.code); saveLangSettings(lang.code, selectedRegion, bilingual, autoTranslate); }}
              className={`lang-card ${targetLang === lang.code ? 'active' : ''}`}>
              <div className="lang-flag">{lang.flag || '🌍'}</div>
              <div className="lang-name">{lang.name}</div>
              <div className="lang-native">{lang.native || lang.name}</div>
              {lang.rtl && <div className="lang-rtl-badge">RTL</div>}
            </button>
          ))}
        </div>
      )}

      {/* Toggles */}
      <div className="translation-toggles">
        <Toggle checked={bilingual} onChange={setBilingual} label="双语字幕（原文 + 译文）" />
        <Toggle checked={autoTranslate} onChange={setAutoTranslate} label="发布时自动翻译（Pipeline / Publish）" />
      </div>
    </SectionCard>
  );
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle-row">
      <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-knob" />
      </div>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

// ====== Git (美化版) ======
const GitSectionCard: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [gitToken, setGitToken] = useState('');
  const [gitStatus, setGitStatus] = useState('');
  const [gitMsg, setGitMsg] = useState('');

  useEffect(() => {
    db.getSetting('gitRemoteUrl').then(v => { if (v) setRepoUrl(v); });
    db.getSetting('gitToken').then(v => { if (v) setGitToken(v); });
    ai.gitStatus().then((r: any) => {
      if (r.success) {
        const s = r.data;
        setGitStatus(`分支: ${s.branch} · 最新: ${s.commit?.substring(0, 8)} · ${s.ahead ? s.ahead + ' ahead' : '同步'}`);
      }
    }).catch(() => {});
  }, []);

  const handleGitPush = async () => {
    setGitMsg('⏳ 正在连接远端...');
    try {
      await db.setSetting('gitRemoteUrl', repoUrl);
      await db.setSetting('gitToken', gitToken);
      const r = await ai.gitPush(repoUrl, gitToken);
      setGitMsg(r.success ? '✅ 推送成功！' : '❌ ' + (r.error || '推送失败'));
    } catch (e: any) {
      setGitMsg('❌ ' + (e.message || '异常'));
    }
    setTimeout(() => setGitMsg(''), 5000);
  };

  return (
    <SectionCard icon="🔒" title="Git 远程备份" subtitle="将项目备份到 GitHub / Gitee，防止数据丢失">
      <FieldRow label="仓库地址" tip="https://github.com/用户名/仓库.git">
        <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/xxx/lobster-studio.git" className="input" />
      </FieldRow>

      <FieldRow label="Token / 密码">
        <input value={gitToken} onChange={e => setGitToken(e.target.value)} placeholder="ghp_..." type="password" className="input" />
      </FieldRow>

      {gitStatus && (
        <div className="git-status-bar">
          <span>📡 {gitStatus}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={handleGitPush} className="btn-primary" style={{ flex: 1 }}>
          📤 推送到远端
        </button>
        <button onClick={async () => { const r = await ai.gitStatus(); setGitStatus(r.success ? `分支: ${r.data.branch} · ${r.data.commit?.substring(0, 8)}` : '状态未知'); }}
          className="btn-secondary">
          🔄 刷新
        </button>
      </div>

      {gitMsg && (
        <div className={`msg-box ${gitMsg.includes('✅') ? 'msg-success' : gitMsg.includes('❌') ? 'msg-error' : ''}`} style={{ marginTop: 12 }}>
          {gitMsg}
        </div>
      )}
    </SectionCard>
  );
};

export default SettingsPage;
