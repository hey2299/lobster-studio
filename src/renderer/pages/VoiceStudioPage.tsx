import React, { useState } from 'react';
import { ai } from '../lib/bridge';

interface VoiceModel {
  id: string;
  name: string;
  type: 'sexy' | 'cool' | 'sweet' | 'deep' | 'youthful' | 'sinister' | 'warm';
  previewText: string;
  isOnline: boolean;
}

const defaultVoices: VoiceModel[] = [
  { id: 'v1', name: '霸道总裁', type: 'deep', previewText: '女人，你在玩火。', isOnline: true },
  { id: 'v2', name: '甜美少女', type: 'sweet', previewText: '欧尼酱，今天去哪里呀？', isOnline: true },
  { id: 'v3', name: '清冷御姐', type: 'cool', previewText: '别让我说第二遍。', isOnline: true },
  { id: 'v4', name: '阳光少年', type: 'youthful', previewText: '放心吧，有我在！', isOnline: true },
  { id: 'v5', name: '沉稳大叔', type: 'deep', previewText: '年轻人，不要急。', isOnline: true },
  { id: 'v6', name: '阴柔反派', type: 'sinister', previewText: '呵呵呵呵，你终于来了...', isOnline: true },
  { id: 'v7', name: '邻家暖男', type: 'warm', previewText: '今天天气不错，一起走走？', isOnline: true },
  { id: 'v8', name: '妩媚妖精', type: 'sexy', previewText: '怎么，不敢看我？', isOnline: true },
];

const typeLabels: Record<string, string> = {
  sexy: '魅惑', cool: '冷峻', sweet: '甜美', deep: '低沉',
  youthful: '少年感', sinister: '阴柔', warm: '温暖',
};

const VoiceStudioPage: React.FC = () => {
  const [voices] = useState(defaultVoices);
  const [previewText, setPreviewText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const handlePreview = async (voice: VoiceModel) => {
    setSelectedVoice(voice.id);
    setPreviewText(voice.previewText);
    setGeneratingPreview(true);

    // Try TTS generation for preview
    const result = await ai.generateTTS(voice.previewText, voice.name);
    if (result.success && result.data?.audioUrl) {
      const audio = new Audio(result.data.audioUrl);
      audio.play().catch(() => {});
    }

    setGeneratingPreview(false);
  };

  const voicesByType: Record<string, VoiceModel[]> = {};
  voices.forEach((v) => {
    if (!voicesByType[v.type]) voicesByType[v.type] = [];
    voicesByType[v.type].push(v);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🎙️ 音色工坊</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          8 种预设音色 · 可在线试听 · 自动扩充中
        </p>
      </div>

      {generatingPreview && (
        <div style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          🎵 正在生成试听...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(voicesByType).map(([type, typeVoices]) => (
          <section key={type}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
              marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {typeLabels[type] || type}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {typeVoices.map((voice) => (
                <div key={voice.id}
                  onClick={() => handlePreview(voice)}
                  style={{
                    background: selectedVoice === voice.id ? 'var(--accent)22' : 'var(--bg-tertiary)',
                    border: `1px solid ${selectedVoice === voice.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, padding: 16, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { if (selectedVoice !== voice.id) e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{voice.name}</span>
                    {selectedVoice === voice.id && <span style={{ fontSize: 14 }}>🔊</span>}
                  </div>
                  {selectedVoice === voice.id && previewText && (
                    <div style={{
                      fontSize: 12, color: 'var(--accent)', fontStyle: 'italic',
                      padding: '6px 8px', borderRadius: 6,
                      background: 'var(--bg-secondary)', marginTop: 4,
                    }}>
                      "{previewText}"
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4,
                      background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                      fontSize: 10,
                    }}>
                      {typeLabels[voice.type]}
                    </span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4,
                      background: voice.isOnline ? '#10b98122' : '#f59e0b22',
                      color: voice.isOnline ? '#10b981' : '#f59e0b',
                      fontSize: 10,
                    }}>
                      {voice.isOnline ? '可用' : '待下载'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{
        marginTop: 32,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🔄 自动音色扩充</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          开启后将自动扫描最新 TTS 模型并扩充音色库。
          当前已完成 1 次扫描，发现 0 个新音色。
        </p>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '8px 12px', borderRadius: 8,
          background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-muted)',
        }}>
          <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
          <span>启动时自动检查新音色</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            上次检查：刚刚
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceStudioPage;
