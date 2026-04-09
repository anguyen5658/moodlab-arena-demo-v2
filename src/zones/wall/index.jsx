import React from 'react';
import { C } from '../../constants/colors.js';
import { LEADERBOARD } from '../../constants/loyalty.js';
import { useApp } from '../../context/AppContext.jsx';
import ZoneHeader from '../../components/ZoneHeader.jsx';

export default function WallZone() {
  const { coins, xp, currentWinStreak, bestWinStreak } = useApp();

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, paddingBottom: 80 }}>
      <ZoneHeader zoneKey="wall" />

      <div style={{ padding: '12px 14px' }}>
        {/* My stats card */}
        <div style={{ padding: '14px 16px', borderRadius: 16, marginBottom: 16, background: `linear-gradient(135deg, ${C.orange}12, ${C.gold}06)`, border: `1px solid ${C.orange}20` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 2, marginBottom: 8 }}>YOUR LEGACY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { v: coins.toLocaleString(), l: 'Coins', color: C.gold },
              { v: xp.toLocaleString(), l: 'XP', color: C.cyan },
              { v: bestWinStreak, l: 'Best Streak', color: C.orange },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.v}</div>
                <div style={{ fontSize: 8, color: C.text3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5, marginBottom: 10 }}>🏆 LEADERBOARD</div>
        {(LEADERBOARD || []).map((p, i) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: p.you ? `${C.cyan}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${p.you ? C.cyan + '30' : 'rgba(255,255,255,0.05)'}` }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: i === 0 ? `${C.gold}20` : i === 1 ? 'rgba(192,192,192,0.15)' : i === 2 ? 'rgba(205,127,50,0.15)' : 'rgba(255,255,255,0.04)', fontWeight: 900, color: i === 0 ? C.gold : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : C.text3 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </div>
            <div style={{ fontSize: 18, flexShrink: 0 }}>{p.emoji || '😎'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: p.you ? 800 : 600, color: p.you ? C.cyan : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}{p.you ? ' (You)' : ''}</div>
              <div style={{ fontSize: 8, color: C.text3 }}>{p.badge || p.stat || ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>{(p.coins || p.xp || 0).toLocaleString()}</div>
              <div style={{ fontSize: 7, color: C.text3 }}>coins</div>
            </div>
          </div>
        ))}
        {(!LEADERBOARD || LEADERBOARD.length === 0) && (
          <div style={{ textAlign: 'center', color: C.text3, fontSize: 13, padding: '40px 0' }}>Leaderboard coming soon</div>
        )}
      </div>
    </div>
  );
}
