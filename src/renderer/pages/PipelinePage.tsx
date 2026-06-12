import React, { useState, useEffect } from 'react';
import { ai, onAIProgress } from '../lib/bridge';
import type { Scene } from '../types';

interface PipelineScene {
  scene: Scene;
  imageDataUrl: string;
  audioDataUrl: string;
  duration: number;
}

type PipelineStep = 'preparing' | 'collecting' | 'composing' | 'done' | 'error';

const PipelinePage: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [scenes, setScenes] = useState<PipelineScene[]>([]);
  const [step, setStep] = useState<PipelineStep>('preparing');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [outputs, setOutputs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOutputs();
    return onAIProgress((data: any) => {
      setProgressMsg(data.message);
      if (data.step === 'video' && data.done) {
        setStep('done');
        loadOutputs();
      }
    });
  }, []);

  const loadOutputs = async () => {
    const list = await ai.listOutputs();
    setOutputs(list);
  };

  // Load from storyboard (in full app this would read from session state)
  const loadFromStoryboard = () => {
    // Check localStorage for last storyboard data
    try {
      const saved = localStorage.getItem('lobster_pipeline_scenes');
      if (saved) {
        const data = JSON.parse(saved);
        setScenes(data.scenes || []);
        setProjectName(data.projectName || '未命名短剧');
      }
    } catch {}
  };

  const startComposition = async () => {
    if (scenes.length === 0) {
      setError('请先从分镜板加载数据');
      return;
    }

    setStep('collecting');
    setProgress(0);
    setError('');
    setProgressMsg('🎬 开始合成...');

    // Filter scenes that have images
    const validScenes = scenes.filter(s => s.imageDataUrl);
    if (validScenes.length === 0) {
      setError('没有已生成画面的分镜，请先去分镜板生成画面');
      setStep('error');
      return;
    }

    setStep('composing');

    const result = await ai.composeVideo({
      scenes: validScenes.map(s => ({
        imageDataUrl: s.imageDataUrl,
        audioDataUrl: s.audioDataUrl || '',
        duration: s.duration || 4,
      })),
      outputName: `${projectName || 'output'}_${Date.now()}.mp4`,
    });

    if (result.success && result.data) {
      setOutputPath(result.data.outputPath);
      setStep('done');
      setProgress(100);
      setProgressMsg('✅ 短剧合成完成！');
    } else {
      setStep('error');
      setError(result.error || '合成失败');
      setProgressMsg('');
    }
  };

  // Demo: generate dummy scenes for testing
  const loadDemo = async () => {
    setProgressMsg('生成演示数据...');
    const demoScenes: Scene[] = [
      { id: 'd1', index: 0, location: '办公室·白天', description: '霸道总裁站在窗前', dialogue: [{ characterId: 'c1', characterName: '林总', line: '这份合同，我签了。', emotion: '冷峻' }], cameraAngle: '中景', mood: '紧张', imagePrompt: 'Boss in office', imageUrl: '', videoUrl: '' },
      { id: 'd2', index: 1, location: '咖啡厅·傍晚', description: '男女主第一次见面', dialogue: [{ characterId: 'c2', characterName: '小美', line: '你好，请问是林总吗？', emotion: '紧张' }], cameraAngle: '特写', mood: '浪漫', imagePrompt: 'Cafe date', imageUrl: '', videoUrl: '' },
      { id: 'd3', index: 2, location: '天台·夜晚', description: '浪漫表白的场景', dialogue: [{ characterId: 'c1', characterName: '林总', line: '我喜欢的，从始至终只有你。', emotion: '深情' }], cameraAngle: '全景', mood: '浪漫', imagePrompt: 'Rooftop romance', imageUrl: '', videoUrl: '' },
    ];

    // Generate placeholder images (colored blocks with text)
    const pipelineScenes: PipelineScene[] = demoScenes.map((scene, i) => {
      // Create a simple SVG-based data URL as placeholder image
      const colors = ['#e84142', '#4a6cf7', '#10b981'];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
        <rect width="1920" height="1080" fill="${colors[i]}"/>
        <text x="960" y="520" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">Scene ${i+1}: ${scene.location}</text>
        <text x="960" y="580" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="24">${scene.mood} · ${scene.cameraAngle}</text>
      </svg>`;
      const b64 = Buffer.from(svg).toString('base64');
      return {
        scene,
        imageDataUrl: 'data:image/svg+xml;base64,' + b64,
        audioDataUrl: '',
        duration: 4,
      };
    });

    setScenes(pipelineScenes);
    setProjectName('霸道总裁爱上我（演示）');
    setProgressMsg('✅ 加载了 ' + pipelineScenes.length + ' 个分镜（演示画面）');
    setTimeout(() => setProgressMsg(''), 3000);
  };

  const clearPipeline = () => {
    setScenes([]);
    setStep('preparing');
    setOutputPath('');
    setError('');
    setProgress(0);
    setProjectName('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>⚡ 合成管线</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            将分镜画面 + 配音合成为 MP4 视频
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {scenes.length === 0 && (
            <button onClick={loadDemo}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
              }}>
              🎲 加载演示
            </button>
          )}
          {scenes.length > 0 && (
            <button onClick={clearPipeline}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
              }}>
              🔄 重置
            </button>
          )}
        </div>
      </div>

      {progressMsg && (
        <div style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: progressMsg.includes('✅') ? '#10b98122' : progressMsg.includes('❌') ? '#e8414222' : 'var(--bg-tertiary)',
          border: `1px solid ${progressMsg.includes('✅') ? '#10b981' : progressMsg.includes('❌') ? '#e84142' : 'var(--border)'}`,
          fontSize: 13, color: progressMsg.includes('✅') ? '#10b981' : progressMsg.includes('❌') ? '#ff6b6b' : 'var(--text-secondary)',
        }}>
          {progressMsg}
        </div>
      )}

      {/* Pipeline visualization */}
      <div style={{
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, marginBottom: 20,
      }}>
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20,
        }}>
          {[
            { label: '分镜画面', icon: '🖼️', done: step !== 'preparing' },
            { label: '配音音频', icon: '🎙️', done: scenes.some(s => s.audioDataUrl) },
            { label: '合成编码', icon: '⚡', done: step === 'composing' || step === 'done' },
            { label: 'MP4 输出', icon: '🎬', done: step === 'done' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                flex: 1, padding: '8px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  background: item.done ? 'var(--accent)22' : 'var(--bg-secondary)',
                  border: `2px solid ${item.done ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  {item.done ? '✅' : item.icon}
                </div>
                <div style={{
                  fontSize: 11, color: item.done ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: item.done ? 600 : 400,
                }}>
                  {item.label}
                </div>
              </div>
              {i < 3 && (
                <div style={{
                  flex: 1, height: 2,
                  background: item.done ? 'var(--accent)' : 'var(--border)',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        {(step === 'composing') && (
          <div style={{
            width: '100%', height: 6, borderRadius: 3,
            background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: 16,
          }}>
            <div style={{
              width: `${progress || 30}%`, height: '100%',
              background: 'linear-gradient(90deg, #e84142, #ff6b6b)',
              borderRadius: 3, transition: 'width 1s ease',
            }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {scenes.length > 0 && (
            <button onClick={startComposition} disabled={step === 'composing'}
              style={{
                padding: '12px 32px', borderRadius: 10, border: 'none',
                background: step === 'composing' ? 'var(--border)' : 'linear-gradient(135deg, #e84142, #ff6b6b)',
                color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: step === 'composing' ? 'not-allowed' : 'pointer',
                opacity: step === 'composing' ? 0.6 : 1,
              }}>
              {step === 'composing' ? '⏳ 合成中...' : '🎬 一键合成成片'}
            </button>
          )}

          {step === 'done' && outputPath && (
            <button onClick={() => {
              const electron: any = (window as any).electronAPI;
              if (electron?.saveFile) electron.saveFile(outputPath.split('/').pop() || 'output.mp4');
            }}
              style={{
                padding: '12px 32px', borderRadius: 10, border: '1px solid var(--accent)',
                background: 'var(--accent)22', color: 'var(--accent)',
                fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>
              💾 保存到本地
            </button>
          )}
        </div>
      </div>

      {/* Scene list */}
      {scenes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {projectName} · {scenes.length} 个分镜
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenes.map((ps, i) => (
              <div key={ps.scene.id} style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 80, height: 45, borderRadius: 6, overflow: 'hidden',
                  background: 'var(--bg-secondary)', flexShrink: 0,
                }}>
                  {ps.imageDataUrl ? (
                    <img src={ps.imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                      无画面
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    #{i + 1} {ps.scene.location}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ps.audioDataUrl ? '🎙️ 有配音' : '🔇 无配音'} · {ps.duration}s
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: ps.imageDataUrl ? '#10b98122' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {ps.imageDataUrl ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 20, padding: 12, borderRadius: 8,
          background: '#e8414222', border: '1px solid #e84142',
          fontSize: 13, color: '#ff6b6b',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Previous outputs */}
      {outputs.length > 0 && (
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            📁 历史输出 ({outputs.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {outputs.map((o: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 6,
                background: 'var(--bg-secondary)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-primary)' }}>{o.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(o.size)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>📂</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
