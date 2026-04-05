import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const ORACLE_WC_MATCHES = [
  { id: 1, home: 'USA', homeFlag: '🇺🇸', away: 'Mexico', awayFlag: '🇲🇽', time: 'Tonight 9PM', group: 'A', hot: true, predictions: { home: 45, draw: 28, away: 27 } },
  { id: 2, home: 'Brazil', homeFlag: '🇧🇷', away: 'Germany', awayFlag: '🇩🇪', time: 'Tomorrow 3AM', group: 'B', predictions: { home: 52, draw: 22, away: 26 } },
  { id: 3, home: 'France', homeFlag: '🇫🇷', away: 'Argentina', awayFlag: '🇦🇷', time: 'Tomorrow 9PM', group: 'C', hot: true, predictions: { home: 38, draw: 25, away: 37 } },
  { id: 4, home: 'England', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: 'Spain', awayFlag: '🇪🇸', time: 'Wed 6PM', group: 'D', predictions: { home: 35, draw: 30, away: 35 } },
  { id: 5, home: 'Japan', homeFlag: '🇯🇵', away: 'Netherlands', awayFlag: '🇳🇱', time: 'Wed 9PM', group: 'E', predictions: { home: 28, draw: 25, away: 47 } },
  { id: 6, home: 'Vietnam', homeFlag: '🇻🇳', away: 'Portugal', awayFlag: '🇵🇹', time: 'Thu 3AM', group: 'F', predictions: { home: 15, draw: 20, away: 65 } },
]

const ORACLE_WC_SPECIALS = [
  { id: 'winner', question: 'Who wins the World Cup?', emoji: '🏆', topPick: 'Brazil 🇧🇷', topPct: 24, total: 3847 },
  { id: 'scorer', question: 'Top Scorer?', emoji: '⚽', topPick: 'Mbappé 🇫🇷', topPct: 18, total: 2103 },
  { id: 'dark', question: 'Dark Horse Team?', emoji: '🐴', topPick: 'Japan 🇯🇵', topPct: 15, total: 1456 },
  { id: 'group_death', question: 'Group of Death?', emoji: '💀', topPick: 'Group C', topPct: 42, total: 890 },
]

const WC_FEED_ITEMS = [
  '🇧🇷 Brazil vs 🇩🇪 Germany tonight!',
  '🔮 1,247 predictions made today',
  '⚽ FK1 WC Champion: CloudChaser99',
  '🏆 Tournament Round of 16 LIVE',
  '🇫🇷 France vs 🇦🇷 Argentina — 38% say Draw!',
  '💨 4,200 WC puffs today',
  '🇺🇸🇲🇽🇨🇦 3 host nations, 16 cities',
]

const WC_MY_STATS = { team: '🇧🇷 Brazil', played: 12, predictions: 47, coins: 3200 }
const WC_DAYS = 400

const WC_LEADERBOARD = [
  { name: 'CloudChaser99', emoji: '👑', stat: '23 wins', coins: 8400, color: C.gold, badge: '🏆 Champion' },
  { name: 'VibeKing', emoji: '😎', stat: '19 wins', coins: 6200, color: C.cyan, badge: '⚽ Striker' },
  { name: 'NeonQueen', emoji: '👸', stat: '17 wins', coins: 5800, color: C.purple, badge: '🔮 Fortune' },
  { name: 'Steve', emoji: '🌟', stat: '14 wins', coins: 3200, color: C.green, badge: '🇧🇷 Fan', you: true },
  { name: 'BlazedPanda', emoji: '🐼', stat: '12 wins', coins: 2900, color: C.orange, badge: '🎯 Sniper' },
  { name: 'PuffDaddy', emoji: '💨', stat: '10 wins', coins: 2100, color: C.pink, badge: '💨 Lungs' },
]

const WC_GROUP_STANDINGS = [
  { group: 'A', teams: [{ flag: '🇺🇸', name: 'USA', pts: 7, gd: '+4' }, { flag: '🇲🇽', name: 'Mexico', pts: 6, gd: '+2' }, { flag: '🇪🇨', name: 'Ecuador', pts: 3, gd: '-1' }, { flag: '🇯🇲', name: 'Jamaica', pts: 1, gd: '-5' }] },
  { group: 'B', teams: [{ flag: '🇧🇷', name: 'Brazil', pts: 9, gd: '+7' }, { flag: '🇩🇪', name: 'Germany', pts: 6, gd: '+3' }, { flag: '🇳🇬', name: 'Nigeria', pts: 3, gd: '-2' }, { flag: '🇳🇿', name: 'New Zealand', pts: 0, gd: '-8' }] },
  { group: 'C', teams: [{ flag: '🇫🇷', name: 'France', pts: 7, gd: '+5' }, { flag: '🇦🇷', name: 'Argentina', pts: 7, gd: '+4' }, { flag: '🇸🇦', name: 'Saudi Arabia', pts: 3, gd: '-3' }, { flag: '🇦🇺', name: 'Australia', pts: 0, gd: '-6' }] },
]

type Tab = 'games' | 'schedule' | 'predictions' | 'leaderboard'

export default function WorldCup() {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const [wcHubTab, setWcHubTab] = useState<Tab>('games')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const feedIdx = Math.floor(tick / 3) % WC_FEED_ITEMS.length

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, position: 'relative' }}>
      {/* Stadium field gradient at bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 180, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(to top, rgba(34,197,94,0.06), transparent)' }} />
      {/* Gold glow at top */}
      <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 350, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 0%, ${C.gold}18, transparent 50%), radial-gradient(ellipse at 30% 10%, ${C.green}08, transparent 40%), radial-gradient(ellipse at 70% 10%, ${C.green}08, transparent 40%)` }} />

      <ZoneHeader zoneId="worldcup" onBack={() => navigate('/')} />

      {/* HERO */}
      <div style={{ padding: '0 14px', marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: 3, marginBottom: 4 }}>🇺🇸 🇲🇽 🇨🇦</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: 4, textShadow: `0 0 20px ${C.gold}80, 0 0 40px ${C.gold}40, 0 0 60px ${C.gold}20`, animation: 'pulse 3s ease-in-out infinite' }}>WORLD CUP 2026</div>
        <div style={{ fontSize: 9, color: C.text2, marginTop: 4, fontWeight: 600 }}>June 11 — July 19 · 48 Teams · 104 Matches</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '4px 14px', borderRadius: 20, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>{WC_DAYS} DAYS TO GO</span>
          <span style={{ fontSize: 10, color: C.gold }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>2,847 FANS ONLINE</span>
          </div>
        </div>
      </div>

      {/* FEED BAR */}
      <div style={{ padding: '0 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10`, transition: 'all 0.5s ease' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{WC_FEED_ITEMS[feedIdx]}</span>
        </div>
      </div>

      {/* STAT STRIP */}
      <div style={{ padding: '0 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${C.gold}06`, border: `1px solid ${C.gold}12` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{WC_MY_STATS.team}</div>
            <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>Your Team</div>
          </div>
          <div style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${C.green}06`, border: `1px solid ${C.green}12` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>{WC_MY_STATS.played}</div>
            <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>Played</div>
          </div>
          <div style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${C.purple}06`, border: `1px solid ${C.purple}12` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.purple }}>{WC_MY_STATS.predictions}</div>
            <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>Predictions</div>
          </div>
          <div style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${C.cyan}06`, border: `1px solid ${C.cyan}12` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>+{WC_MY_STATS.coins.toLocaleString()}</div>
            <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>Coins Won</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px', position: 'relative', zIndex: 1 }}>
        {/* TAB BAR */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.gold}15`, marginBottom: 10 }}>
          {(['games', 'schedule', 'predictions', 'leaderboard'] as Tab[]).map(t => (
            <div key={t} onClick={() => setWcHubTab(t)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: wcHubTab === t ? 800 : 600, color: wcHubTab === t ? C.gold : C.text3, borderBottom: wcHubTab === t ? `2px solid ${C.gold}` : '2px solid transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* GAMES TAB */}
        {wcHubTab === 'games' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>⚽</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>WC TOURNAMENT GAMES</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { name: 'FK1 WC', emoji: '⚽', desc: 'Classic WC', color: C.gold, path: '/arcade/finalkick' },
                { name: 'FK2 WC', emoji: '🏟️', desc: 'Curve Shots', color: C.green, path: '/arcade/finalkick2' },
                { name: 'FK3 WC', emoji: '🌟', desc: 'Free Kicks', color: C.cyan, path: '/arcade/finalkick3' },
              ].map((g, i) => (
                <div key={i} onClick={() => { playFx('select'); navigate(g.path) }} style={{ padding: '14px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${g.color}12, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18`, transition: 'all 0.3s', animation: `fadeIn 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 6, fontWeight: 900, color: '#fff', padding: '1px 5px', borderRadius: 3, background: C.gold }}>WC</div>
                  <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: g.color }}>{g.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{g.desc}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: C.lime, marginTop: 4 }}>PLAY NOW</div>
                </div>
              ))}
            </div>
            {/* Quick Match */}
            <div onClick={() => { playFx('select'); navigate('/arcade/finalkick') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: `linear-gradient(135deg, ${C.green}08, ${C.gold}06)`, border: `1px solid ${C.green}15`, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>Quick Match — Play a Friendly</div>
                <div style={{ fontSize: 8, color: C.text3 }}>No stakes, just fun. Practice your skills!</div>
              </div>
              <span style={{ fontSize: 12, color: C.green }}>→</span>
            </div>
            {/* WC Tournament bracket preview */}
            <div style={{ padding: '12px 14px', borderRadius: 14, background: `${C.gold}04`, border: `1px solid ${C.gold}12`, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>FK1 WORLD CUP TOURNAMENT</span>
                <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', padding: '2px 6px', borderRadius: 4, background: C.red, animation: 'pulse 1.5s infinite' }}>LIVE</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {[{ r: 'R16', n: 16, c: C.text3 }, { r: 'QF', n: 8, c: C.cyan }, { r: 'SF', n: 4, c: C.gold }, { r: 'F', n: 2, c: C.gold }].map((round, ri) => (
                  <div key={ri} style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, background: ri === 0 ? `${C.gold}12` : `${round.c}06`, border: `1px solid ${ri === 0 ? C.gold : round.c}15` }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: ri === 0 ? C.gold : round.c }}>{round.r}</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>{round.n} teams</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, color: C.text2 }}>312 players competing · Your status: <span style={{ color: C.green, fontWeight: 700 }}>Round of 16</span></div>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {wcHubTab === 'schedule' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>⚽ TODAY'S MATCHES</div>
            {ORACLE_WC_MATCHES.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: `${C.green}04`, border: `1px solid ${C.green}12` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{m.homeFlag}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.home}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}>vs</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.away}</span>
                    <span style={{ fontSize: 14 }}>{m.awayFlag}</span>
                    {m.hot && <span style={{ fontSize: 6, fontWeight: 900, color: C.red, padding: '1px 4px', borderRadius: 3, background: `${C.red}15` }}>HOT</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 8, color: C.cyan, fontWeight: 700 }}>Group {m.group}</span>
                    <span style={{ fontSize: 8, color: C.text3 }}>{m.time}</span>
                  </div>
                </div>
                <div onClick={() => { playFx('tap'); navigate('/fortune/matchpredictor') }} style={{ padding: '4px 10px', borderRadius: 8, cursor: 'pointer', background: `${C.purple}12`, border: `1px solid ${C.purple}20` }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: C.purple }}>Predict</span>
                </div>
              </div>
            ))}
            {/* Group Standings Preview */}
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginTop: 12, marginBottom: 8 }}>📊 GROUP STANDINGS</div>
            {WC_GROUP_STANDINGS.map((grp, gi) => (
              <div key={gi} style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 12, background: `${C.gold}04`, border: `1px solid ${C.gold}10` }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.gold, marginBottom: 6 }}>GROUP {grp.group}</div>
                {grp.teams.map((t, ti) => (
                  <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: ti < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: ti < 2 ? C.green : C.text3, width: 10 }}>{ti + 1}</span>
                    <span style={{ fontSize: 12 }}>{t.flag}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.text, flex: 1 }}>{t.name}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.cyan, width: 30, textAlign: 'right' }}>{t.pts} pts</span>
                    <span style={{ fontSize: 8, color: C.text3, width: 24, textAlign: 'right' }}>{t.gd}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* PREDICTIONS TAB */}
        {wcHubTab === 'predictions' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>🔮 MATCH PREDICTIONS</div>
            {ORACLE_WC_MATCHES.slice(0, 4).map(m => (
              <div key={m.id} onClick={() => { playFx('tap'); navigate('/fortune/matchpredictor') }} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 12, marginBottom: 6, cursor: 'pointer', background: `${C.purple}04`, border: `1px solid ${C.purple}12` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{m.homeFlag}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{m.home}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}>vs</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{m.away}</span>
                    <span style={{ fontSize: 14 }}>{m.awayFlag}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.cyan }}>{m.predictions.home}%</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: `${C.text3}15`, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', height: '100%' }}>
                        <div style={{ width: `${m.predictions.home}%`, background: C.cyan }} />
                        <div style={{ width: `${m.predictions.draw}%`, background: C.gold }} />
                        <div style={{ width: `${m.predictions.away}%`, background: C.pink }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.pink }}>{m.predictions.away}%</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Tournament specials */}
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, marginTop: 12, marginBottom: 8 }}>🏆 TOURNAMENT SPECIALS</div>
            {ORACLE_WC_SPECIALS.map(s => (
              <div key={s.id} onClick={() => { playFx('tap'); navigate('/fortune/crystalball') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, cursor: 'pointer', background: `${C.gold}04`, border: `1px solid ${C.gold}12` }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{s.question}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>{s.topPick}</span>
                    <span style={{ fontSize: 7, color: C.text3 }}>({s.topPct}%)</span>
                    <span style={{ fontSize: 7, color: C.text3 }}>·</span>
                    <span style={{ fontSize: 7, color: C.text3 }}>{s.total.toLocaleString()} votes</span>
                  </div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.purple, padding: '3px 8px', borderRadius: 6, background: `${C.purple}12` }}>Vote</span>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {wcHubTab === 'leaderboard' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>🏆</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>WC LEADERBOARD</span>
            </div>
            {WC_LEADERBOARD.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: p.you ? `${p.color}10` : `${C.text3}04`, border: p.you ? `1px solid ${p.color}30` : `1px solid ${C.border}`, position: 'relative' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? C.gold : C.text3, width: 18, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</div>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.name}</span>
                    {p.you && <span style={{ fontSize: 7, fontWeight: 800, color: C.lime, padding: '1px 5px', borderRadius: 3, background: `${C.lime}15` }}>YOU</span>}
                    <span style={{ fontSize: 7, fontWeight: 700, color: p.color, padding: '1px 5px', borderRadius: 3, background: `${p.color}12` }}>{p.badge}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: C.text2, fontWeight: 600 }}>{p.stat}</span>
                    <span style={{ fontSize: 8, color: C.gold, fontWeight: 700 }}>🪙 {p.coins.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Cross-zone link to Wall */}
            <div onClick={() => { playFx('nav'); navigate('/wall') }} style={{ marginTop: 12, padding: '10px 14px', borderRadius: 14, background: `${C.cyan}04`, border: `1px solid ${C.cyan}12`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🧱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan }}>View Full Arena Leaderboard</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>See all-time rankings on The Wall</div>
                </div>
                <span style={{ fontSize: 12, color: C.cyan }}>→</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
