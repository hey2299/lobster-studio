import React, { useState, useEffect } from 'react';
import { ai, db, autodetect } from '../lib/bridge';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  authed: boolean;
  account: string;
}

interface PublishRecord {
  id: string;
  platform: string;
  platformName: string;
  videoName: string;
  timestamp: number;
  status: string;
  guideUrl?: string;
  manualStep?: string;
}

interface VideoOutput {
  name: string;
  path: string;
  size: number;
  createdAt: string;
}

const PublishPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [outputs, setOutputs] = useState<VideoOutput[]>([]);
  const [history, setHistory] = useState<PublishRecord[]>([]);
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ platform: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoAnalysis, setAutoAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [detectMode, setDetectMode] = useState<'domestic' | 'overseas'>('domestic');
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    tags: '',
    visibility: 'public',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [p, o, h] = await Promise.all([
      ai.getPlatforms(),
      ai.listOutputs(),
      ai.getPublishHistory(),
    ]);
    setPlatforms(p);
    setOutputs(o);
    setHistory(h);

    runAutoAnalysis();
  };

  const selectOutputFile = () => {
    // In Electron, this could open a file picker
    // For now, cycle through available outputs
    const current = outputs.find(o => o.path === selectedOutput);
    if (!current) return;
    setMetadata(prev => ({
      ...prev,
      title: prev.title || current.name.replace('.mp4', ''),
    }));
  };

  useEffect(() => {
    if (selectedOutput) selectOutputFile();
  }, [selectedOutput]);

  const handlePublish = async (platformId: string) => {
    if (!selectedOutput) {
      setResult({ platform: platformId, message: '请先选择一个输出视频', type: 'error' });
      return;
    }

    setPublishing(prev => ({ ...prev, [platformId]: true }));
    setResult(null);

    const res = await ai.publishVideo(platformId, selectedOutput, {
      title: metadata.title || outputs.find(o => o.path === selectedOutput)?.name || '未命名短剧',
      description: metadata.description,
      tags: metadata.tags.split(/[,，\s]+/).filter(Boolean),
      visibility: metadata.visibility,
    });

    setPublishing(prev => ({ ...prev, [platformId]: false }));

    if (res.success) {
      setResult({
        platform: platformId,
        message: res.data?.manualStep
          ? `✅ 已准备就绪！${res.data.manualStep}\n📋 文件：${res.data.fileName}\n🔗 ${res.data.guideUrl || ''}`
          : '✅ 发布成功！',
        type: 'success',
      });
      loadAll();
    } else {
      setResult({
        platform: platformId,
        message: `❌ 发布失败：${res.error}`,
        type: 'error',
      });
    }
  };

  const runAutoAnalysis = async (mode?: string) => {
    const targetMode = mode || detectMode;
    if (analyzing) return;
    setAnalyzing(true);
    try {
      // Try to load current script data from localStorage
      const saved = localStorage.getItem('lobster_pipeline_scenes');
      if (saved) {
        const data = JSON.parse(saved);
        const totalDuration = (data.scenes || []).reduce((sum: number, s: any) => sum + (s.duration || 4), 0);
        const analysis = await autodetect.analyze({
          title: data.projectName || '当前短剧'
        }, {
          totalDuration,
          sceneCount: (data.scenes || []).length,
          aspectRatio: '9:16',
          mode: targetMode,
        });
        setAutoAnalysis(analysis);
      } else {
        const analysis = await autodetect.analyze({ title: '默认' }, {
          totalDuration: targetMode === 'overseas' ? 45 : 120,
          sceneCount: targetMode === 'overseas' ? 6 : 8,
          aspectRatio: '9:16',
          mode: targetMode,
        });
        setAutoAnalysis(analysis);
      }
    } catch {}
    setAnalyzing(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
      {/* Main publish panel */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🚀 一键发布</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>将完成的短剧发布到各大平台</p>
        </div>

        {/* Video selection */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🎬 选择要发布的视频</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            从合成管线的输出中选择
          </p>

          {outputs.length === 0 ? (
            <div style={{
              padding: '24px', textAlign: 'center', borderRadius: 8,
              background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-muted)',
            }}>
              暂无合成输出。请先在 <strong>合成管线</strong> 页面合成一条短剧。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {outputs.map((o) => (
                <div key={o.path}
                  onClick={() => setSelectedOutput(o.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${selectedOutput === o.path ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedOutput === o.path ? 'var(--accent)16' : 'var(--bg-secondary)',
                  }}>
                  <div style={{ fontSize: 20 }}>🎞️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatSize(o.size)} · {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedOutput === o.path && (
                    <div style={{ color: 'var(--accent)', fontSize: 18 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata form */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📋 发布信息</div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>标题</label>
            <input value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="输入短剧标题..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>描述</label>
            <textarea value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="输入短剧描述..."
              rows={3}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, resize: 'vertical',
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>标签（逗号分隔）</label>
            <input value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              placeholder="短剧, AI创作, 霸道总裁..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>可见性</label>
            <select value={metadata.visibility}
              onChange={(e) => setMetadata({ ...metadata, visibility: e.target.value })}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}>
              <option value="public">公开</option>
              <option value="unlisted">不公开列出</option>
              <option value="private">私密</option>
            </select>
          </div>
        </div>

        {/* Auto-Detect Analysis */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>🔍 自动检测平台规则</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Mode switch */}
              <div style={{
                display: 'flex', background: 'var(--bg-secondary)', borderRadius: 6, padding: 2,
                border: '1px solid var(--border)',
              }}>
                <button onClick={() => { setDetectMode('domestic'); setAnalysisOpen(true); setAutoAnalysis(null); setTimeout(() => runAutoAnalysis('domestic'), 100); }}
                  style={{
                    padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                    background: detectMode === 'domestic' ? 'var(--accent)' : 'transparent',
                    color: detectMode === 'domestic' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: detectMode === 'domestic' ? 600 : 400,
                  }}>
                  🇨🇳 国内
                </button>
                <button onClick={() => { setDetectMode('overseas'); setAnalysisOpen(true); setAutoAnalysis(null); setTimeout(() => runAutoAnalysis('overseas'), 100); }}
                  style={{
                    padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                    background: detectMode === 'overseas' ? 'var(--accent)' : 'transparent',
                    color: detectMode === 'overseas' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: detectMode === 'overseas' ? 600 : 400,
                  }}>
                  🌍 海外
                </button>
              </div>
              <button onClick={() => setAnalysisOpen(!analysisOpen)}
                className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}>
                {analysisOpen ? '▲' : '▼'} {autoAnalysis ? `${Object.values(autoAnalysis).filter((a:any)=>a.recommended).length}/${Object.keys(autoAnalysis).length}` : ''}
              </button>
            </div>
          </div>

          {analysisOpen && (
            <>
              {analyzing ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <span className="animate-spin" style={{ fontSize: 24 }}>🔍</span>
                  <div style={{ marginTop: 8 }}>正在分析各平台规则...</div>
                </div>
              ) : autoAnalysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(autoAnalysis).sort(([,a]:any,[,b]:any)=>b.score-a.score).map(([id, data]: [string, any]) => (
                    <div key={id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${data.recommended ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                    }}>
                      <span style={{ fontSize: 20 }}>{data.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {data.platformName}
                          <span className={`badge ${data.score >= 60 ? 'badge-success' : data.score >= 30 ? 'badge-warning' : 'badge-error'}`}>
                            {data.score}分
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {data.warnings.length > 0 ? (
                            <span style={{ color: data.score >= 50 ? '#10b981' : '#f59e0b' }}>
                              {data.warnings.slice(0, 2).map((w: string) => '⚠️ ' + w).join(' · ')}
                            </span>
                          ) : (
                            <span style={{ color: '#10b981' }}>✅ 完全匹配平台要求</span>
                          )}
                        </div>
                        {data.passes && data.passes.length > 0 && (
                          <div style={{ fontSize: 10, color: '#10b981', marginTop: 1 }}>
                            {data.passes.slice(0, 2).map((p: string, i: number) => (
                              <div key={i}>✓ {p}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: data.recommended ? '#10b981' : '#f59e0b',
                      }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  无法加载平台规则分析
                </div>
              )}
            </>
          )}
        </div>

        {/* Platform grid */}
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📤 发布到平台</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            选择要发布的平台。需要先在平台开发者后台获取 API Token。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {platforms.map((p) => (
              <div key={p.id} style={{
                background: 'var(--bg-secondary)',
                border: `1px solid ${p.authed ? p.color + '44' : 'var(--border)'}`,
                borderRadius: 10, padding: 14, cursor: 'pointer',
                opacity: selectedOutput ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.authed ? `已绑定 ${p.account || ''}` : '未绑定'}
                    </div>
                  </div>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: p.authed ? '#10b981' : 'var(--text-muted)',
                    opacity: 0.6,
                  }} />
                </div>

                <button onClick={() => handlePublish(p.id)}
                  disabled={publishing[p.id] || !selectedOutput}
                  style={{
                    width: '100%', padding: '8px', borderRadius: 6, border: 'none',
                    background: publishing[p.id]
                      ? 'var(--border)'
                      : `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
                    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    opacity: (!selectedOutput || publishing[p.id]) ? 0.6 : 1,
                  }}>
                  {publishing[p.id] ? '⏳ 发布中...' : p.authed ? '一键发布' : '⌛ 需要绑定'}
                </button>

                {!p.authed && (
                  <div style={{
                    marginTop: 6, padding: '6px 8px', borderRadius: 6,
                    background: 'var(--bg-tertiary)', fontSize: 10,
                    color: 'var(--text-muted)', lineHeight: 1.5,
                  }}>
                    在每个平台的开发者后台创建应用以获得 API Token：
                    <br />·
                    <a href={`https://open.${p.id === 'weixin' ? 'weixin' : p.id}.com`}
                      style={{ color: p.color }} target="_blank" rel="noreferrer">
                      {p.id === 'weixin' ? '微信开放平台' : `${p.name}开放平台`}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 10,
            background: result.type === 'success' ? '#10b98122' : '#e8414222',
            border: `1px solid ${result.type === 'success' ? '#10b981' : '#e84142'}`,
            fontSize: 13, color: result.type === 'success' ? '#10b981' : '#ff6b6b',
            whiteSpace: 'pre-line',
          }}>
            {result.message}
          </div>
        )}
      </div>

      {/* Sidebar: publish history */}
      <div>
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, position: 'sticky', top: 80,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>📜 发布记录</span>
            {history.length > 0 && (
              <button onClick={async () => {
                await ai.clearPublishHistory();
                setHistory([]);
              }}
                style={{
                  fontSize: 11, color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline',
                }}>
                清空
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
              暂无发布记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.slice(0, 10).map((r) => (
                <div key={r.id} style={{
                  background: 'var(--bg-secondary)', borderRadius: 8,
                  padding: '10px 12px', fontSize: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{platforms.find(p => p.id === r.platform)?.icon || '📤'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.videoName}
                    </span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4,
                      background: r.status === 'published' ? '#10b98122' : '#f59e0b22',
                      color: r.status === 'published' ? '#10b981' : '#f59e0b',
                      fontSize: 10,
                    }}>
                      {r.status === 'published' ? '已发布' : '待手动上传'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {r.platformName} · {formatTime(r.timestamp)}
                  </div>
                  {r.guideUrl && r.status === 'manual' && (
                    <a href={r.guideUrl} target="_blank" rel="noreferrer"
                      style={{
                        display: 'block', marginTop: 4, fontSize: 11,
                        color: 'var(--accent)', textDecoration: 'none',
                      }}>
                      📎 前往上传 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishPage;
