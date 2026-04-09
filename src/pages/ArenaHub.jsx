import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, Z, GLASS_CARD, GLASS_CLEAR } from '../constants/colors.js';
import { ARENA_IMAGES, ARENA_VIDEOS } from '../constants/arena.js';
import { useApp } from '../context/AppContext.jsx';

const ZONES = [
  { key: 'arcade',   path: '/arcade',   label: 'Arcade',   emoji: '🎮', color: C.cyan,   sub: '18 Games · 8,400 playing' },
  { key: 'stage',    path: '/stage',    label: 'Stage',    emoji: '🎭', color: C.gold,   sub: '6 Live Shows · 1,247 watching' },
  { key: 'oracle',   path: '/oracle',   label: 'Oracle',   emoji: '🔮', color: '#C084FC', sub: '12 Fortune Games · 12.8K jackpot' },
  { key: 'wall',     path: '/wall',     label: 'Wall',     emoji: '🏆', color: C.orange, sub: 'Leaderboards · Your Legacy' },
  { key: 'worldcup', path: '/worldcup', label: 'World Cup',emoji: '⚽', color: C.green,  sub: 'FIFA 2026 · 48 Teams' },
];

const STAGE_DATA = [
  { tag: 'LIVE NOW', tagColor: C.red,    title: 'Final Kick World Cup 2026', sub: '312 players competing · Round of 16', cta: 'Play Now', ctaColor: C.cyan,   act: '/arcade/finalkick' },
  { tag: 'HOT',      tagColor: C.orange, title: 'Puff Derby — Grand National',  sub: '6 horses · 420 fans watching',       cta: 'Pick a Horse', ctaColor: C.gold, act: '/arcade/puffderby' },
  { tag: 'TONIGHT',  tagColor: C.purple, title: 'Survival Trivia Showdown',    sub: 'Starts in 22 min · 89 contestants',  cta: 'Join Now', ctaColor: '#C084FC', act: '/stage/survivaltrivia' },
];

export default function ArenaHub() {
  const navigate = useNavigate();
  const { playFx, coins, xp, notify, setShowBlePopup, bleConnected } = useApp();
  const [mainStage, setMainStage] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance stage card
  useEffect(() => {
    const id = setInterval(() => setMainStage(s => (s + 1) % STAGE_DATA.length), 5000);
    return () => clearInterval(id);
  }, []);

  const s = STAGE_DATA[mainStage];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5, overflow: 'hidden', background: C.bg }}>
      {/* Background video */}
      <div style={{ position: 'absolute', inset: '-2% -10%', width: '120%', height: '104%', zIndex: 0 }}>
        <video autoPlay loop muted playsInline poster={ARENA_IMAGES.hub} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
          <source src={ARENA_VIDEOS.hub} type="video/mp4" />
        </video>
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,5,16,0.3) 0%, rgba(5,5,16,0.5) 50%, rgba(5,5,16,0.8) 100%)' }} />
      </div>

      {/* Jumbotron card */}
      <div style={{ position: 'absolute', top: 72, left: 18, right: 18, zIndex: 10, animation: 'arenaFadeIn 0.6s ease 0.1s both' }}>
        <div onClick={() => { playFx('select'); navigate(s.act); }} style={{ borderRadius: 22, overflow: 'hidden', cursor: 'pointer', ...GLASS_CARD }}>
          <div style={{ position: 'relative', padding: '18px 18px 16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: `${s.tagColor}15`, marginBottom: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.tagColor, boxShadow: `0 0 6px ${s.tagColor}`, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 8, fontWeight: 800, color: s.tagColor, letterSpacing: 1.5 }}>{s.tag}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 5, fontWeight: 500 }}>{s.sub}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ padding: '7px 16px', borderRadius: 100, background: `${s.ctaColor}12`, border: `1px solid ${s.ctaColor}25`, fontSize: 11, fontWeight: 800, color: s.ctaColor }}>{s.cta}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} onClick={e => { e.stopPropagation(); setMainStage(i); }} style={{ width: i === mainStage ? 14 : 5, height: 4, borderRadius: 2, background: i === mainStage ? C.text : `${C.text3}30`, transition: 'all 0.4s', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            {/* Progress bar */}
            <div key={mainStage} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${s.ctaColor}50)`, animation: 'jumbotronProgress 5s linear forwards', transformOrigin: 'left' }} />
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6, animation: 'arenaFadeIn 0.6s ease 0.2s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, ...GLASS_CARD }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}60`, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>8,420</span>
              <span style={{ fontSize: 7, fontWeight: 600, color: C.text3 }}>in Arena</span>
            </div>
            <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>🪙 {coins.toLocaleString()}</span>
            </div>
            <span style={{ width: 1, height: 10, background: `${C.text3}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>⚡ {xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone grid */}
      <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {ZONES.map(zone => (
            <div
              key={zone.key}
              onClick={() => { playFx('nav'); navigate(zone.path); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', borderRadius: 14, cursor: 'pointer', background: `${zone.color}08`, border: `1px solid ${zone.color}20`, gap: 4 }}
            >
              <div style={{ fontSize: 22 }}>{zone.emoji}</div>
              <div style={{ fontSize: 8, fontWeight: 800, color: zone.color, textAlign: 'center', letterSpacing: 0.5 }}>{zone.label}</div>
            </div>
          ))}
        </div>

        {/* Connect device button */}
        <div
          onClick={() => setShowBlePopup(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 14, cursor: 'pointer', background: bleConnected ? `${C.green}10` : `${C.orange}10`, border: `1px solid ${bleConnected ? C.green : C.orange}25` }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: bleConnected ? C.green : C.orange, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
            {bleConnected ? '💨 Device Connected' : '💨 Connect Cali Clear'}
          </span>
        </div>
      </div>
    </div>
  );
}
