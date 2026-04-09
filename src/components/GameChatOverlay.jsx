import React from 'react';
import { C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

const GAME_CHAT_EMOJIS = ['😂', '🔥', '💀', '😤', '👏', '😎', '💨', '🏆'];

/**
 * GameChatOverlay — live-stream style chat shown in-game.
 * Props:
 *   controlsSlot — optional JSX rendered ALWAYS (regardless of chat toggle),
 *                  used for game-specific action buttons above the chat.
 *
 * Position: absolute bottom-0, so the parent game container must be position:relative.
 */
export default function GameChatOverlay({ controlsSlot }) {
  const {
    gameChatMsgs, setGameChatMsgs,
    gameChatInput, setGameChatInput,
    gameChatOpen, setGameChatOpen,
    playFx,
  } = useApp();

  const addChat = (name, msg, color) => {
    setGameChatMsgs(prev => [...prev.slice(-49), { name, msg, color, t: Date.now() }]);
  };

  const gameChatSend = () => {
    const t = gameChatInput.trim();
    if (!t) return;
    addChat('You', t, C.cyan);
    setGameChatInput('');
    playFx('tap');
  };

  const recent = gameChatMsgs.filter(m => Date.now() - m.t < 120000).slice(-10);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: (gameChatOpen || controlsSlot)
        ? 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.15) 85%, transparent 100%)'
        : 'none',
      padding: '0 10px 6px', pointerEvents: 'none',
    }}>
      {/* Controls slot — ALWAYS visible */}
      {controlsSlot && (
        <div style={{ pointerEvents: 'auto', marginBottom: gameChatOpen ? 4 : 0 }}>
          {controlsSlot}
        </div>
      )}
      {/* Messages */}
      {gameChatOpen && (
        <div style={{ marginBottom: 4, pointerEvents: 'none' }}>
          {recent.map((m, i) => (
            <div key={i} style={{ marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: m.color || '#ccc', flexShrink: 0 }}>{m.name}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{m.msg}</span>
            </div>
          ))}
        </div>
      )}
      {/* Text input row */}
      {gameChatOpen && (
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
          <input
            type="text"
            value={gameChatInput}
            onChange={e => setGameChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') gameChatSend(); }}
            onClick={e => e.stopPropagation()}
            placeholder="Say something..."
            style={{
              flex: 1, padding: '5px 10px', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              fontSize: 10, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div
            onClick={e => { e.stopPropagation(); gameChatSend(); }}
            style={{
              width: 22, height: 22, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
              fontSize: 9, color: C.cyan,
            }}
          >{'>'}</div>
        </div>
      )}
      {/* Emoji bar + toggle */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', pointerEvents: 'auto', paddingBottom: 2, alignItems: 'center' }}>
        <div
          onClick={e => { e.stopPropagation(); setGameChatOpen(o => !o); playFx('tap'); }}
          style={{
            width: 28, height: 28, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            background: gameChatOpen ? 'rgba(0,229,255,0.15)' : 'rgba(6,16,30,0.8)',
            border: `1px solid ${gameChatOpen ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <span style={{ fontSize: 10 }}>💬</span>
          {!gameChatOpen && recent.length > 0 && (
            <div style={{ position: 'absolute', top: -1, right: -1, width: 5, height: 5, borderRadius: 3, background: C.cyan, border: '1px solid rgba(6,16,30,0.9)' }} />
          )}
        </div>
        {gameChatOpen && GAME_CHAT_EMOJIS.map((e, i) => (
          <div
            key={i}
            onClick={ev => { ev.stopPropagation(); addChat('You', e, C.cyan); playFx('tap'); }}
            style={{
              width: 28, height: 28, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 13,
            }}
          >{e}</div>
        ))}
      </div>
    </div>
  );
}
