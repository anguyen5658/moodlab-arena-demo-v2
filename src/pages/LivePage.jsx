import React, { useState, useEffect } from 'react';
import { C, GLASS_CARD } from '../constants/colors.js';
import { LIVE_STREAMS, LIVE_CATEGORIES, LIVE_CREATORS } from '../constants/live.js';
import { useApp } from '../context/AppContext.jsx';
import AppHeader from '../components/AppHeader.jsx';

const STREAMS = LIVE_STREAMS || [
  { id:1,  host:'CloudChaser99', avatar:'🐉', viewers:1247,  puffs:3420, category:'World Cup',   title:'🇧🇷 Brazil vs Argentina LIVE | WC2026 Watchparty!', badge:'vip' },
  { id:2,  host:'NeonQueen',     avatar:'👸', viewers:890,   puffs:2100, category:'Gaming',      title:'Puff Pong Championship — Let\'s get these coins!',  badge:'og' },
  { id:3,  host:'BlazedPanda',   avatar:'🐼', viewers:634,   puffs:1890, category:'Chill',       title:'Late night sesh 🌙 vibing with the community',      badge:'mod' },
  { id:4,  host:'VibeKing',      avatar:'😎', viewers:421,   puffs:980,  category:'Gaming',      title:'Wild West Duel — 1v1 me if you dare! 🤠',           badge:'vip' },
];

const CATEGORIES = LIVE_CATEGORIES || [
  { name:'All',       icon:'🎯', c:'#00E5FF' },
  { name:'World Cup', icon:'⚽', c:'#FFD93D' },
  { name:'Gaming',    icon:'🎮', c:'#00E5FF' },
  { name:'Chill',     icon:'😌', c:'#C084FC' },
  { name:'Following', icon:'⭐', c:'#FB923C' },
];

const CREATORS = LIVE_CREATORS || [
  { name:'CloudChaser99', avatar:'🐉', followers:'12.4K', schedule:'Daily 9PM',  badge:'vip' },
  { name:'NeonQueen',     avatar:'👸', followers:'8.1K',  schedule:'Tue/Thu/Sat',badge:'og'  },
  { name:'BlazedPanda',   avatar:'🐼', followers:'5.7K',  schedule:'Weekends',   badge:'mod' },
];

export default function LivePage() {
  const { notify, playFx, liveChatMsgs, liveChatInput, setLiveChatInput, setLiveChatMsgs, coins, setCoins } = useApp();
  const [category, setCategory] = useState('All');
  const [watchStream, setWatchStream] = useState(null);
  const [followed, setFollowed] = useState({});
  const [showTip, setShowTip] = useState(false);

  const filtered = category === 'All' ? STREAMS : STREAMS.filter(s => s.category === category);

  if (watchStream) {
    const s = watchStream;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: C.bg, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '44px 14px 8px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => setWatchStream(null)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', color: C.text }}>←</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: C.red, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} /> LIVE
            </div>
            <span style={{ fontSize: 11, color: C.text2 }}>👁 {s.viewers.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: C.text2 }}>💨 {s.puffs.toLocaleString()}</span>
          </div>
          <div onClick={() => notify('⚡ Raid coming soon!', C.gold)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>⚡</div>
        </div>

        {/* Host info */}
        <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.host}</div>
            <div style={{ fontSize: 10, color: C.text3 }}>{s.title}</div>
          </div>
          <div onClick={() => { setFollowed(p => ({ ...p, [s.host]: !p[s.host] })); playFx('coin'); }} style={{ padding: '7px 16px', borderRadius: 10, border: followed[s.host] ? `1px solid ${C.orange}` : 'none', background: followed[s.host] ? 'transparent' : `linear-gradient(135deg, ${C.orange}, ${C.pink})`, fontSize: 11, fontWeight: 800, color: followed[s.host] ? C.orange : '#fff', cursor: 'pointer' }}>
            {followed[s.host] ? '✓ Following' : 'Follow'}
          </div>
        </div>

        {/* Stream visual */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, animation: 'float 3s ease-in-out infinite' }}>{s.avatar}</div>
        </div>

        {/* Chat + actions */}
        <div style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)', padding: '20px 12px 16px' }}>
          {/* Messages */}
          <div style={{ maxHeight: 100, overflow: 'hidden', marginBottom: 8 }}>
            {(liveChatMsgs || []).slice(-4).map((m, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 4, display: 'flex', gap: 6 }}>
                <span style={{ fontWeight: 700, color: m.c || C.cyan }}>{m.user || m.name}</span>
                <span style={{ color: C.text2 }}>{m.msg}</span>
              </div>
            ))}
          </div>
          {/* Reactions */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
            {['💨', '🔥', '💀', '😤', '👏', '😎', '🏆'].map((e, i) => (
              <div key={i} onClick={() => { notify(e, C.cyan); playFx('tap'); }} style={{ width: 38, height: 38, borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>{e}</div>
            ))}
          </div>
          {/* Puff + Wave */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div onClick={() => { playFx('puff'); notify('💨 PUFF!', C.pink); }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.blue})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}>💨 PUFF</div>
            <div onClick={() => { notify('🌊 WAVE!', C.gold); playFx('win'); }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.gold})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}>🌊 WAVE!</div>
            <div onClick={() => setShowTip(v => !v)} style={{ width: 46, height: 46, borderRadius: 12, border: `1px solid ${C.gold}30`, background: `${C.gold}08`, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🪙</div>
          </div>
          {showTip && (
            <div style={{ padding: '10px 0', marginBottom: 8, display: 'flex', gap: 8 }}>
              {[10, 50, 100, 500].map(a => (
                <div key={a} onClick={() => { setCoins(p => Math.max(0, p - a)); setShowTip(false); notify(`Tipped ${a} coins!`, C.gold); playFx('coin'); }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${C.gold}20`, background: `${C.gold}08`, fontSize: 13, fontWeight: 700, color: C.gold, cursor: 'pointer', textAlign: 'center' }}>{a}</div>
              ))}
            </div>
          )}
          {/* Chat input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={liveChatInput || ''}
              onChange={e => setLiveChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && liveChatInput?.trim()) { setLiveChatMsgs(p => [...p, { user: 'You', msg: liveChatInput, c: C.cyan }]); setLiveChatInput(''); } }}
              placeholder="Say something..."
              style={{ flex: 1, padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <div onClick={() => { if (liveChatInput?.trim()) { setLiveChatMsgs(p => [...p, { user: 'You', msg: liveChatInput, c: C.cyan }]); setLiveChatInput(''); } }} style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</div>
          </div>
        </div>
      </div>
    );
  }

  // Explore view
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, paddingBottom: 100 }}>
      <AppHeader />
      {/* Live page header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(135deg, #FF4D8D, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, animation: 'pulse 1.2s infinite', boxShadow: `0 0 8px ${C.red}` }} />
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>Watch · Stream · Puff Together</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🔔', '🔍'].map((e, i) => <div key={i} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{e}</div>)}
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 14px 12px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <div key={cat.name} onClick={() => setCategory(cat.name)} style={{ padding: '6px 14px', borderRadius: 20, border: category === cat.name ? `1.5px solid ${cat.c}` : '1px solid rgba(255,255,255,0.08)', background: category === cat.name ? `${cat.c}12` : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600, color: category === cat.name ? cat.c : C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{cat.icon}</span> {cat.name}
          </div>
        ))}
      </div>

      {/* Live Now */}
      <div style={{ padding: '0 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.red, animation: 'pulse 1.2s infinite' }}>●</span>
          Live Now
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 400, marginLeft: 'auto' }}>{filtered.length} streams</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setWatchStream(s)} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
              <div style={{ width: 76, height: 76, borderRadius: 14, background: 'rgba(192,132,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, position: 'relative', flexShrink: 0, border: '1px solid rgba(192,132,252,0.15)' }}>
                {s.avatar}
                <div style={{ position: 'absolute', top: 5, right: 5, background: C.red, borderRadius: 4, padding: '1px 5px', fontSize: 8, fontWeight: 800, color: '#fff' }}>LIVE</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{s.host}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.text3 }}>
                  <span><span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.green, marginRight: 3, verticalAlign: 'middle', animation: 'pulse 1.5s infinite' }} />{s.viewers.toLocaleString()} watching</span>
                  <span>💨 {s.puffs.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Creators */}
      <div style={{ padding: '20px 14px 4px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⭐ Featured Creators</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {CREATORS.map(cr => (
            <div key={cr.name} style={{ minWidth: 130, padding: 14, textAlign: 'center', flexShrink: 0, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 8px', background: 'rgba(192,132,252,0.2)', border: '2px solid rgba(192,132,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{cr.avatar}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cr.name}</div>
              <div style={{ fontSize: 10, color: C.text3 }}>{cr.followers} followers</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>🕐 {cr.schedule}</div>
              <div onClick={() => { setFollowed(p => ({ ...p, [cr.name]: !p[cr.name] })); playFx('coin'); }} style={{ width: '100%', padding: '6px 0', borderRadius: 10, border: followed[cr.name] ? `1px solid ${C.orange}` : 'none', background: followed[cr.name] ? 'transparent' : `linear-gradient(135deg, ${C.orange}, ${C.pink})`, fontSize: 10, fontWeight: 700, color: followed[cr.name] ? C.orange : '#fff', cursor: 'pointer', marginTop: 8, textAlign: 'center' }}>
                {followed[cr.name] ? '✓ Following' : 'Follow'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Go Live FAB */}
      <div style={{ position: 'fixed', bottom: 88, right: 'calc(50% - 195px)', zIndex: 40 }}>
        <div onClick={() => notify('Go Live — Coming soon!', C.pink)} style={{ width: 62, height: 62, borderRadius: 18, background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px rgba(236,72,153,0.4)`, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          📡
        </div>
      </div>
    </div>
  );
}
