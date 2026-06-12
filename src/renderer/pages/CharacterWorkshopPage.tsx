import React, { useState, useEffect } from 'react';
import { db, ai, memory, onAIProgress } from '../lib/bridge';
import type { Character } from '../types';

const roleTypes = ['主角', '反派', '配角', '客串'] as const;
const voiceTypes = ['霸道总裁音', '甜美少女音', '沉稳大叔音', '清冷御姐音', '阳光少年音', '阴柔反派音', '憨厚老实音'];

const CharacterWorkshopPage: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newChar, setNewChar] = useState({
    name: '', role: '主角' as Character['role'],
    personality: '', appearance: '', voiceType: '阳光少年音',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [similarChars, setSimilarChars] = useState<any[]>([]);
  const [stats, setStats] = useState({ characters: 0, aliases: 0 });

  useEffect(() => {
    loadCharacters();
    loadStats();
    return onAIProgress((data: any) => {
      if (data.step === 'portrait') setProgressMsg(data.message);
    });
  }, []);

  const loadCharacters = async () => {
    const chars = await db.getCharacters();
    setCharacters(chars as Character[]);
  };

  const loadStats = async () => {
    const s = await memory.getStats();
    setStats(s);
  };

  const checkSimilarChars = async (partial: typeof newChar) => {
    const query = {
      name: partial.name,
      role: partial.role,
      personality: partial.personality,
      appearance: partial.appearance,
      voiceType: partial.voiceType,
    };
    const results = await memory.search(query, 0.35);
    setSimilarChars(results);
  };

  const createCharacter = async () => {
    if (!newChar.name.trim()) return;
    setIsGenerating(true);
    setProgressMsg('AI 正在设计角色形象...');

    const char: Character = {
      id: `char_${Date.now()}`,
      name: newChar.name,
      role: newChar.role,
      personality: newChar.personality,
      appearance: newChar.appearance || `${newChar.name}的外貌`,
      voiceType: newChar.voiceType,
      avatarUrl: '',
      portraitPrompt: `${newChar.name}, ${newChar.role}, ${newChar.personality}`,
      scriptsUsed: [],
      createdAt: Date.now(),
    };

    // Generate portrait prompt via AI
    const result = await ai.generateCharacterPrompt(char);
    if (result.success && result.data) {
      char.portraitPrompt = result.data;
    }

    // Save to main database
    await db.saveCharacter(char);

    // Save to vector memory for cross-drama search
    await memory.store(char);

    await loadCharacters();
    await loadStats();

    setNewChar({ name: '', role: '主角', personality: '', appearance: '', voiceType: '阳光少年音' });
    setSimilarChars([]);
    setShowCreate(false);
    setIsGenerating(false);
    setProgressMsg(`✅ 角色「${char.name}」已创建，已加入跨剧记忆库`);
    setTimeout(() => setProgressMsg(''), 3000);
  };

  const deleteChar = async (id: string) => {
    await db.deleteCharacter(id);
    await loadCharacters();
    await loadStats();
  };

  const filtered = characters.filter((c) =>
    c.name.includes(searchTerm) || c.role.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="搜索角色..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              fontSize: 14, outline: 'none', width: 220,
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {characters.length} 个角色 · 🧠 {stats.characters} 个记忆条目
          </span>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
          }}>
          + 新建角色
        </button>
      </div>

      {progressMsg && (
        <div style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: progressMsg.includes('✅') ? '#10b98122' : 'var(--bg-tertiary)',
          border: `1px solid ${progressMsg.includes('✅') ? '#10b981' : 'var(--border)'}`,
          fontSize: 13, color: progressMsg.includes('✅') ? '#10b981' : 'var(--text-secondary)',
        }}>
          {progressMsg}
        </div>
      )}

      {showCreate && (
        <div className="animate-fade-in" style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>新建角色</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>角色名称</label>
              <input value={newChar.name} onChange={(e) => {
                setNewChar({ ...newChar, name: e.target.value });
                if (e.target.value.length >= 2) checkSimilarChars({ ...newChar, name: e.target.value });
              }}
                placeholder="如：李天宇"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>角色定位</label>
              <select value={newChar.role} onChange={(e) => setNewChar({ ...newChar, role: e.target.value as Character['role'] })}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}>
                {roleTypes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>性格描述</label>
              <textarea value={newChar.personality} onChange={(e) => {
                setNewChar({ ...newChar, personality: e.target.value });
                if (e.target.value.length >= 4) checkSimilarChars({ ...newChar, personality: e.target.value });
              }}
                placeholder="如：表面冷酷无情，内心温柔细腻..."
                style={{
                  width: '100%', minHeight: 55, padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit',
                }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>配音音色</label>
              <select value={newChar.voiceType} onChange={(e) => setNewChar({ ...newChar, voiceType: e.target.value })}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}>
                {voiceTypes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Similar characters alert */}
          {similarChars.length > 0 && (
            <div style={{
              marginBottom: 16, padding: 12, borderRadius: 8,
              background: '#f59e0b22', border: '1px solid #f59e0b',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>
                🧠 记忆库发现相似角色
              </div>
              {similarChars.map((s, i) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4,
                  display: 'flex', gap: 8,
                }}>
                  <span style={{ fontWeight: 600 }}>{s.character.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    匹配度 {(s.score * 100).toFixed(0)}% · {s.character.role} · {s.character.voiceType}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                💡 如果这是同一角色，建议复用已有角色以保持跨剧一致性
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowCreate(false); setSimilarChars([]); }}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
              }}>
              取消
            </button>
            <button onClick={createCharacter} disabled={isGenerating || !newChar.name.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: isGenerating ? 'var(--border)' : 'var(--accent)',
                color: '#fff', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: 14, opacity: isGenerating ? 0.6 : 1,
              }}>
              {isGenerating ? '⏳ AI 生成中...' : '✨ 创建角色 + 存入记忆'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
          <p style={{ fontSize: 15 }}>
            {characters.length === 0 ? '还没有角色，点击「新建角色」开始创建' : '没有匹配的角色'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map((char) => (
            <div key={char.id} className="animate-fade-in" style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, transition: 'all 0.2s', position: 'relative',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e84142, #ff6b6b)',
                marginBottom: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff',
              }}>
                {char.name[0]}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{char.name}</div>
              <div style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                background: 'var(--accent)22', color: 'var(--accent)', fontSize: 11, fontWeight: 600, marginBottom: 6,
              }}>
                {char.role}
              </div>
              {char.personality && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                  {char.personality}
                </p>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🎙️ {char.voiceType}</div>
              {char.scriptsUsed.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  📖 参演 {char.scriptsUsed.length} 部短剧 · 🧠 跨剧记忆
                </div>
              )}

              <button onClick={() => deleteChar(char.id)}
                style={{
                  position: 'absolute', top: 8, right: 8, background: 'transparent',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: 16, padding: '2px 6px', borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent)22'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterWorkshopPage;
