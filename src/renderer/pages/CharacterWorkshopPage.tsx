import React, { useState } from 'react';

interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  voiceType: string;
  avatarUrl: string;
  createdAt: number;
}

const demoCharacters: Character[] = [];

const roleTypes = ['主角', '反派', '配角', '客串'];
const voiceTypes = ['霸道总裁音', '甜美少女音', '沉稳大叔音', '清冷御姐音', '阳光少年音', '阴柔反派音', '憨厚老实音'];

const CharacterWorkshopPage: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(demoCharacters);
  const [showCreate, setShowCreate] = useState(false);
  const [newChar, setNewChar] = useState({ name: '', role: '主角', personality: '', voiceType: '阳光少年音' });
  const [searchTerm, setSearchTerm] = useState('');

  const createCharacter = () => {
    if (!newChar.name.trim()) return;
    const char: Character = {
      id: Date.now().toString(),
      name: newChar.name,
      role: newChar.role,
      personality: newChar.personality,
      voiceType: newChar.voiceType,
      avatarUrl: '',
      createdAt: Date.now(),
    };
    setCharacters([char, ...characters]);
    setNewChar({ name: '', role: '主角', personality: '', voiceType: '阳光少年音' });
    setShowCreate(false);
  };

  const filtered = characters.filter((c) =>
    c.name.includes(searchTerm) || c.role.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              width: 240,
            }}
          />
          <span style={{ color: 'var(--text-muted)', alignSelf: 'center', fontSize: 13 }}>
            {characters.length} 个角色
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + 新建角色
        </button>
      </div>

      {/* Create panel */}
      {showCreate && (
        <div className="animate-fade-in" style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>新建角色</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>角色名称</label>
              <input
                value={newChar.name}
                onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                placeholder="如：李天宇"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>角色定位</label>
              <select
                value={newChar.role}
                onChange={(e) => setNewChar({ ...newChar, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {roleTypes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>性格描述</label>
              <textarea
                value={newChar.personality}
                onChange={(e) => setNewChar({ ...newChar, personality: e.target.value })}
                placeholder="如：表面冷酷无情，内心温柔细腻，商业奇才但不善表达..."
                style={{
                  width: '100%',
                  minHeight: 60,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>配音音色</label>
              <select
                value={newChar.voiceType}
                onChange={(e) => setNewChar({ ...newChar, voiceType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {voiceTypes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              取消
            </button>
            <button
              onClick={createCharacter}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ✨ AI 生成角色形象
            </button>
          </div>
        </div>
      )}

      {/* Character grid */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
          <p style={{ fontSize: 15 }}>{characters.length === 0 ? '还没有角色，点击「新建角色」开始创建' : '没有匹配的角色'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {filtered.map((char) => (
            <div key={char.id} className="animate-fade-in" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e84142, #ff6b6b)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: '#fff',
              }}>
                {char.name[0]}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{char.name}</div>
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 10,
                background: 'var(--accent)22',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                {char.role}
              </div>
              {char.personality && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                  {char.personality}
                </p>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                🎙️ {char.voiceType}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterWorkshopPage;
