import React, { useState, useEffect } from 'react';
import { ai, db, onAIProgress } from '../lib/bridge';
import type { Scene, Script } from '../types';

interface StoryboardCell {
  scene: Scene;
  imageUrl: string;
  audioUrl: string;
  status: 'pending' | 'generating' | 'done' | 'error';
}

const StoryboardPage: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<string>('');
  const [scenes, setScenes] = useState<StoryboardCell[]>([]);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  useEffect(() => {
    return onAIProgress((data: any) => {
      setProgressMsg(data.message);
      if (data.done) setTimeout(() => setProgressMsg(''), 2000);
    });
  }, []);

  const loadProjectScenes = () => {
    // Placeholder: In full app, this loads from the last generated script
    // For now, demo with empty state
  };

  // Pick script from session history (stored in recent projects)
  const pickScript = async (scriptData: Script) => {
    setScenes(scriptData.scenes.map((s) => ({
      scene: s,
      imageUrl: s.imageUrl || '',
      audioUrl: '',
      status: 'pending' as const,
    })));
  };

  const generateOneImage = async (index: number) => {
    const updated = [...scenes];
    updated[index].status = 'generating';
    setScenes(updated);

    const result = await ai.generateImage(updated[index].scene);
    if (result.success && result.data) {
      updated[index].imageUrl = result.data.imageUrl;
      updated[index].status = result.data.imageUrl ? 'done' : 'error';
    } else {
      // Generate placeholder image URL with the prompt info
      updated[index].imageUrl = '';
      updated[index].status = 'error';
    }
    setScenes([...updated]);
  };

  const generateAllImages = async () => {
    setIsBatchGenerating(true);
    setProgressMsg('AI 正在逐帧生成画面...');

    const updated = scenes.map((s) => ({ ...s, status: 'generating' as const }));
    setScenes(updated);

    const result = await ai.generateAllImages(updated.map((s) => s.scene));
    if (result.success && result.data) {
      result.data.forEach((r) => {
        if (updated[r.sceneIndex]) {
          updated[r.sceneIndex].imageUrl = r.imageUrl;
          updated[r.sceneIndex].status = r.imageUrl ? 'done' : 'error';
        }
      });
    }
    setScenes(updated);
    setIsBatchGenerating(false);
    setProgressMsg(result.success ? '✅ 所有画面生成完毕' : '⚠️ 部分画面生成失败（未配置图像 API）');
    setTimeout(() => setProgressMsg(''), 3000);
  };

  const generateSceneAudio = async (index: number) => {
    const cell = scenes[index];
    if (!cell.scene.dialogue || cell.scene.dialogue.length === 0) return;

    const dialogueText = cell.scene.dialogue
      .map((d) => `${d.characterName}（${d.emotion}）：${d.line}`)
      .join('\n');

    setProgressMsg(`🎙️ 正在生成第 ${index + 1} 场配音...`);
    const result = await ai.generateTTS(dialogueText, 'default');
    if (result.success && result.data?.audioUrl) {
      const updated = [...scenes];
      updated[index].audioUrl = result.data.audioUrl;
      setScenes(updated);
      setCurrentAudio(result.data.audioUrl);
      setProgressMsg('✅ 配音已生成');
    } else {
      setProgressMsg('⚠️ 配音生成失败（未配置 TTS API）');
    }
    setTimeout(() => setProgressMsg(''), 3000);
  };

  const playTTS = (audioUrl: string) => {
    if (audioUrl) setCurrentAudio(audioUrl);
  };

  // Image placeholder for when API key is not configured
  const placeholderImage = (scene: Scene, index: number) => (
    <div style={{
      width: '100%', aspectRatio: '16/9', borderRadius: 8,
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 36, opacity: 0.5 }}>🎬</div>
      <div style={{ fontSize: 11, textAlign: 'center', padding: '0 12px', maxWidth: '80%' }}>
        #{index + 1} {scene.location}
      </div>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{scene.mood} · {scene.cameraAngle}</div>
    </div>
  );

  // Generate dummy scenes for initial demo
  const generateDemoScenes = () => {
    const demoScenes: Scene[] = [
      { id: 'demo_1', index: 0, location: '高档写字楼·董事长办公室', description: '西装革履的男人站在落地窗前，俯瞰城市天际线', dialogue: [{ characterId: 'c1', characterName: '林峰', line: '这份合同，我不签。', emotion: '冷峻' }, { characterId: 'c2', characterName: '王总', line: '你可想好了？签了它，你就是林氏集团的主人。', emotion: '威胁' }], cameraAngle: '背光剪影', mood: '紧张压迫', imagePrompt: 'A tall man in a luxury office, backlit by floor-to-ceiling windows overlooking a modern city skyline, dramatic lighting, cinematic, 16:9', imageUrl: '', videoUrl: '' },
      { id: 'demo_2', index: 1, location: '下班后·小胡同', description: '男人穿着破旧外套，在小摊前吃着6块钱一碗的面', dialogue: [{ characterId: 'c1', characterName: '林峰', line: '老板，再来一碗。', emotion: '平静' }, { characterId: 'c3', characterName: '面摊老板', line: '小伙子，干了一天活了吧？慢慢吃。', emotion: '慈祥' }], cameraAngle: '特写', mood: '温暖对比', imagePrompt: 'A young man eating noodles at a street stall at night, warm lamp light, shallow depth of field, cinematic', imageUrl: '', videoUrl: '' },
      { id: 'demo_3', index: 2, location: '地下室·秘密房间', description: '墙上贴满照片和图纸，男人盯着一个神秘符号', dialogue: [{ characterId: 'c1', characterName: '林峰', line: '原来，我爸的死不是意外。', emotion: '压抑愤怒' }], cameraAngle: '手持镜头', mood: '悬疑', imagePrompt: 'A dark basement room covered in photos and maps, red string connecting evidence, mysterious symbols, thriller atmosphere', imageUrl: '', videoUrl: '' },
    ];
    setScenes(demoScenes.map((s) => ({ scene: s, imageUrl: '', audioUrl: '', status: 'pending' })));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🎬 分镜导演板</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {scenes.length} 个分镜 · 点击生成画面和配音
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {scenes.length === 0 && (
            <button onClick={generateDemoScenes}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
              }}>
              🎲 加载演示剧本
            </button>
          )}
          {scenes.length > 0 && (
            <>
              <button onClick={() => {
                const updated = scenes.map((s) => ({ ...s, imageUrl: '', audioUrl: '', status: 'pending' }));
                setScenes(updated);
                setCurrentAudio(null);
              }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                }}>
                🔄 重置
              </button>
              <button onClick={generateAllImages} disabled={isBatchGenerating}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: isBatchGenerating ? 'var(--border)' : 'linear-gradient(135deg, #4a6cf7, #7c3aed)',
                  color: '#fff', fontWeight: 600, cursor: isBatchGenerating ? 'not-allowed' : 'pointer',
                  fontSize: 13, opacity: isBatchGenerating ? 0.6 : 1,
                }}>
                {isBatchGenerating ? '⏳ 生成中...' : '🎨 一键生成全部画面'}
              </button>
            </>
          )}
        </div>
      </div>

      {progressMsg && (
        <div style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: progressMsg.includes('✅') ? '#10b98122' : progressMsg.includes('⚠️') ? '#f59e0b22' : 'var(--bg-tertiary)',
          border: `1px solid ${
            progressMsg.includes('✅') ? '#10b981' : progressMsg.includes('⚠️') ? '#f59e0b' : 'var(--border)'
          }`,
          fontSize: 13, color: progressMsg.includes('✅') ? '#10b981' : progressMsg.includes('⚠️') ? '#f59e0b' : 'var(--text-secondary)',
        }}>
          {progressMsg}
        </div>
      )}

      {scenes.length === 0 ? (
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px dashed var(--border)',
          borderRadius: 12, padding: 48, textAlign: 'center',
          color: 'var(--text-muted)', minHeight: 300,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 56 }}>🎪</div>
          <p style={{ fontSize: 15 }}>还没有分镜</p>
          <p style={{ fontSize: 13 }}>先在「剧本工厂」生成剧本，或加载演示数据</p>
          <button onClick={generateDemoScenes}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid var(--accent)',
              background: 'var(--accent)22', color: 'var(--accent)', cursor: 'pointer', fontSize: 14,
              marginTop: 8,
            }}>
            🎲 加载演示剧本
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scenes.map((cell, i) => (
            <div key={cell.scene.id} className="animate-fade-in"
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
                transition: 'all 0.2s',
              }}>
              <div style={{ display: 'flex', gap: 16, padding: 16 }}>
                {/* Scene image */}
                <div style={{ width: 280, flexShrink: 0 }}>
                  {cell.imageUrl ? (
                    <img src={cell.imageUrl} alt={`Scene ${i + 1}`}
                      style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, objectFit: 'cover' }}
                      onError={() => {
                        const updated = [...scenes];
                        updated[i].imageUrl = '';
                        updated[i].status = 'error';
                        setScenes(updated);
                      }}
                    />
                  ) : (
                    placeholderImage(cell.scene, i)
                  )}
                </div>

                {/* Scene info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                        background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700,
                        marginRight: 8,
                      }}>
                        #{i + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{cell.scene.location}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cell.scene.mood}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cell.scene.cameraAngle}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                    {cell.scene.description}
                  </p>

                  {/* Dialogue preview */}
                  {cell.scene.dialogue && cell.scene.dialogue.length > 0 && (
                    <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 10, marginBottom: 8 }}>
                      {cell.scene.dialogue.slice(0, 2).map((d, j) => (
                        <div key={j} style={{ fontSize: 12, marginBottom: 2, color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.characterName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>（{d.emotion}）</span>：{d.line}
                        </div>
                      ))}
                      {cell.scene.dialogue.length > 2 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{cell.scene.dialogue.length - 2} 句对话...</div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => generateOneImage(i)}
                      disabled={cell.status === 'generating'}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                        background: cell.status === 'generating' ? 'var(--border)' : 'transparent',
                        color: cell.status === 'generating' ? 'var(--text-muted)' : 'var(--text-secondary)',
                        cursor: cell.status === 'generating' ? 'not-allowed' : 'pointer',
                        fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      {cell.status === 'generating' ? '⏳' : '🎨'} 生图
                    </button>
                    <button onClick={() => generateSceneAudio(i)}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      🎙️ 配音
                    </button>
                    {cell.audioUrl && (
                      <button onClick={() => playTTS(cell.audioUrl)}
                        style={{
                          padding: '5px 12px', borderRadius: 6, border: '1px solid #10b981',
                          background: '#10b98122', color: '#10b981',
                          cursor: 'pointer', fontSize: 11,
                        }}>
                        ▶️ 试听
                      </button>
                    )}
                    <button onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 11,
                      }}>
                      {expandedScene === i ? '收起' : '更多'} {cell.status === 'done' ? '👁️' : ''}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded section with image prompt */}
              {expandedScene === i && (
                <div style={{
                  borderTop: '1px solid var(--border)', padding: 16,
                  background: 'var(--bg-secondary)',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>图像提示词</div>
                  <pre style={{
                    fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    margin: 0, fontFamily: 'monospace',
                  }}>
                    {cell.scene.imagePrompt}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio player */}
      {currentAudio && (
        <div style={{
          position: 'fixed', bottom: 0, left: 240, right: 0,
          background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)',
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🔊 配音预览</span>
          <audio controls src={currentAudio} style={{ flex: 1, height: 36 }} autoPlay />
          <button onClick={() => setCurrentAudio(null)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16,
            }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryboardPage;
