import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors.js';
import { PLAY_GAMES } from '../../constants/games.js';
import { useApp } from '../../context/AppContext.jsx';
import ZoneHeader from '../../components/ZoneHeader.jsx';

const WC_FEED = [
  '🇧🇷 Brazil vs 🇩🇪 Germany tonight!',
  '🔮 1,247 predictions made today',
  '⚽ FK1 WC Champion: CloudChaser99',
  '🏆 Tournament Round of 16 LIVE',
  '🇫🇷 France vs 🇦🇷 Argentina — 38% say Draw!',
  '💨 4,200 WC puffs today',
  '🇺🇸🇲🇽🇨🇦 3 host nations, 16 cities',
];

const WC_LEADERBOARD = [
  { name:'CloudChaser99', emoji:'👑', stat:'23 wins', coins:8400, color:C.gold,   badge:'🏆 Champion' },
  { name:'VibeKing',      emoji:'😎', stat:'19 wins', coins:6200, color:C.cyan,   badge:'⚽ Striker' },
  { name:'NeonQueen',     emoji:'👸', stat:'17 wins', coins:5800, color:'#C084FC', badge:'🔮 Fortune' },
  { name:'Steve',         emoji:'🌟', stat:'14 wins', coins:3200, color:C.green,  badge:'🇧🇷 Fan', you:true },
  { name:'BlazedPanda',   emoji:'🐼', stat:'12 wins', coins:2900, color:C.orange, badge:'🎯 Sniper' },
  { name:'PuffDaddy',     emoji:'💨', stat:'10 wins', coins:2100, color:C.pink,   badge:'💨 Lungs' },
];

const WC_GROUPS = [
  { group:'A', teams:[{ flag:'🇺🇸',name:'USA',pts:7,gd:'+4' },{ flag:'🇲🇽',name:'Mexico',pts:6,gd:'+2' },{ flag:'🇪🇨',name:'Ecuador',pts:3,gd:'-1' },{ flag:'🇯🇲',name:'Jamaica',pts:1,gd:'-5' }] },
  { group:'B', teams:[{ flag:'🇧🇷',name:'Brazil',pts:9,gd:'+7' },{ flag:'🇩🇪',name:'Germany',pts:6,gd:'+3' },{ flag:'🇳🇬',name:'Nigeria',pts:3,gd:'-2' },{ flag:'🇳🇿',name:'NZ',pts:0,gd:'-8' }] },
  { group:'C', teams:[{ flag:'🇫🇷',name:'France',pts:7,gd:'+5' },{ flag:'🇦🇷',name:'Argentina',pts:7,gd:'+4' },{ flag:'🇸🇦',name:'Saudi Arabia',pts:3,gd:'-3' },{ flag:'🇦🇺',name:'Australia',pts:0,gd:'-6' }] },
];

const WC_MY_STATS = { team:'🇧🇷 Brazil', played:12, predictions:47, coins:3200 };

// Days until WC start (June 11 2026)
const wcStart = new Date('2026-06-11');
const wcDays = Math.max(0, Math.ceil((wcStart - new Date()) / (1000 * 60 * 60 * 24)));

export default function WorldCupHub() {
  const navigate = useNavigate();
  const { playFx } = useApp();
  const [tab, setTab] = useState('games');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const feedItem = WC_FEED[Math.floor(tick / 3) % WC_FEED.length];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, paddingBottom: 80 }}>
      <ZoneHeader zoneKey="worldcup" />

      {/* Gold + green glow */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 180, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(to top, rgba(34,197,94,0.06), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero title */}
        <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: 3, marginBottom: 4 }}>🇺🇸 🇲🇽 🇨🇦</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: 4, textShadow: `0 0 20px ${C.gold}80, 0 0 40px ${C.gold}40`, animation: 'pulse 3s ease-in-out infinite' }}>WORLD CUP 2026</div>
          <div style={{ fontSize: 9, color: C.text2, marginTop: 4, fontWeight: 600 }}>June 11 — July 19 · 48 Teams · 104 Matches</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '4px 14px', borderRadius: 20, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{wcDays} DAYS TO GO</span>
            <span style={{ fontSize: 10, color: C.gold }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>2,847 FANS ONLINE</span>
            </div>
          </div>
        </div>

        {/* Feed bar */}
        <div style={{ padding: '0 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feedItem}</span>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ padding: '0 14px 8px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { v: WC_MY_STATS.team,        l: 'Your Team',   color: C.gold },
              { v: WC_MY_STATS.played,      l: 'Played',      color: C.green },
              { v: WC_MY_STATS.predictions, l: 'Predictions', color: '#C084FC' },
              { v: '+' + WC_MY_STATS.coins.toLocaleString(), l: 'Coins Won', color: C.cyan },
            ].map(s => (
              <div key={s.l} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: s.color }}>{s.v}</div>
                <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ padding: '0 14px' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.gold}15`, marginBottom: 10 }}>
            {['games', 'standings', 'predictions', 'leaderboard'].map(t => (
              <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.gold : C.text3, borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            ))}
          </div>

          {/* Games tab */}
          {tab === 'games' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { name: 'FK1 WC', emoji: '⚽', desc: 'Classic WC', color: C.gold, id: 'finalkick' },
                  { name: 'FK2 WC', emoji: '🏟️', desc: 'Curve Shots', color: C.green, id: 'finalkick2' },
                ].map((g, i) => (
                  <div key={i} onClick={() => { playFx('select'); navigate(`/arcade/${g.id}`); }} style={{ padding: '14px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${g.color}12, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18` }}>
                    <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 6, fontWeight: 900, color: '#fff', padding: '1px 5px', borderRadius: 3, background: C.gold }}>WC</div>
                    <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: g.color }}>{g.name}</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{g.desc}</div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: C.lime, marginTop: 4 }}>PLAY NOW</div>
                  </div>
                ))}
              </div>
              {/* Tournament bracket */}
              <div style={{ padding: '12px 14px', borderRadius: 14, background: `${C.gold}04`, border: `1px solid ${C.gold}12` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>🏆</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>FK1 WORLD CUP TOURNAMENT</span>
                  <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', padding: '2px 6px', borderRadius: 4, background: C.red, animation: 'pulse 1.5s infinite' }}>LIVE</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ r: 'R16', c: C.gold }, { r: 'QF', c: C.cyan }, { r: 'SF', c: C.gold }, { r: 'F', c: C.gold }].map((round, ri) => (
                    <div key={ri} style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, background: ri === 0 ? `${C.gold}12` : `${round.c}06`, border: `1px solid ${ri === 0 ? C.gold : round.c}15` }}>
                      <div style={{ fontSize: 8, fontWeight: 800, color: ri === 0 ? C.gold : round.c }}>{round.r}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 8, color: C.text2, marginTop: 6 }}>312 players competing · Your status: <span style={{ color: C.green, fontWeight: 700 }}>Round of 16</span></div>
              </div>
            </div>
          )}

          {/* Standings tab */}
          {tab === 'standings' && (
            <div style={{ marginBottom: 14 }}>
              {WC_GROUPS.map(group => (
                <div key={group.group} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1, marginBottom: 6 }}>GROUP {group.group}</div>
                  {group.teams.map((team, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, marginBottom: 3, background: i < 2 ? `${C.green}06` : 'rgba(255,255,255,0.02)', border: `1px solid ${i < 2 ? C.green + '15' : 'rgba(255,255,255,0.04)'}` }}>
                      <span style={{ fontSize: 14 }}>{team.flag}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.text, flex: 1 }}>{team.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.gold }}>{team.pts} pts</span>
                      <span style={{ fontSize: 8, color: team.gd.startsWith('+') ? C.green : C.red, fontFamily: 'monospace' }}>{team.gd}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Predictions tab */}
          {tab === 'predictions' && (
            <div style={{ marginBottom: 14, textAlign: 'center', color: C.text3, padding: '40px 0', fontSize: 13 }}>
              Match predictions coming soon
            </div>
          )}

          {/* Leaderboard tab */}
          {tab === 'leaderboard' && (
            <div style={{ marginBottom: 14 }}>
              {WC_LEADERBOARD.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: p.you ? `${C.gold}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${p.you ? C.gold + '30' : 'rgba(255,255,255,0.05)'}` }}>
                  <div style={{ fontSize: 14, width: 24, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</div>
                  <div style={{ fontSize: 18 }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: p.you ? 800 : 600, color: p.you ? C.gold : C.text }}>{p.name}</div>
                    <div style={{ fontSize: 8, color: C.text3 }}>{p.badge}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>{p.coins.toLocaleString()}</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>coins</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
