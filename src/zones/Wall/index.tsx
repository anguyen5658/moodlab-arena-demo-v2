import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ZoneHeader } from '@/components/ZoneHeader'
import { C } from '@/constants'

const WALL_CHAMPIONS = [
  { tournament: 'FK1 World Cup 2026', player: 'ChillMaster42', emoji: '👑', flag: '🇧🇷', prize: '50,000' },
  { tournament: 'The Outlaw Circuit',  player: 'NeonQueen',     emoji: '🤠', flag: '🇺🇸', prize: '25,000' },
  { tournament: 'Dojo Championship',   player: 'BlazedPanda',   emoji: '🐼', flag: '🇯🇵', prize: '15,000' },
]

const LEADERBOARD_ALL = [
  { name: 'ChillMaster42', emoji: '👑', coins: 84700, xp: 92450, badge: '🐐 GOAT',   rank: 1, tier: 'Diamond',  isYou: false },
  { name: 'VibeKing',      emoji: '😎', coins: 72300, xp: 81200, badge: '🧘 Zen',    rank: 2, tier: 'Diamond',  isYou: false },
  { name: 'NeonQueen',     emoji: '👸', coins: 61500, xp: 74800, badge: '👸 Queen',  rank: 3, tier: 'Diamond',  isYou: false },
  { name: 'Steve (You)',   emoji: '🌟', coins: 12580, xp:  7450, badge: '💨 Stoner', rank: 4, tier: 'Silver',   isYou: true  },
  { name: 'BlazedPanda',   emoji: '🐼', coins: 31800, xp: 38100, badge: '🎯 Try',   rank: 5, tier: 'Gold',     isYou: false },
  { name: 'PuffDaddy',     emoji: '💨', coins: 29000, xp: 32400, badge: '🫁 Lungs', rank: 6, tier: 'Gold',     isYou: false },
  { name: 'CloudNine99',   emoji: '☁️', coins: 24500, xp: 27800, badge: '💀 Blink', rank: 7, tier: 'Gold',     isYou: false },
  { name: 'TheLobster',    emoji: '🦞', coins: 19900, xp: 21500, badge: '⚖️ Bal',   rank: 8, tier: 'Bronze',   isYou: false },
]

const WALL_ACTIVITY = [
  '🔥 ChillMaster42 is on a 23-win streak!',
  '🏆 NeonQueen just won the FK1 World Cup!',
  '⚡ BlazedPanda hit rank #3 this week',
  '💰 VibeKing earned 5,000 coins in one session',
  '🎯 TheLobster completed all daily challenges',
]

const TIER_COLORS: Record<string, string> = {
  Diamond: C.cyan, Platinum: '#E5E4E2', Gold: C.gold, Silver: '#C0C0C0', Bronze: '#CD7F32',
}

export default function Wall() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('rankings')
  const [lbTab, setLbTab] = useState('all')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const activityIdx = Math.floor(tick / 3) % WALL_ACTIVITY.length
  const youEntry = LEADERBOARD_ALL.find(p => p.isYou)
  const podiumOrder = [WALL_CHAMPIONS[1], WALL_CHAMPIONS[0], WALL_CHAMPIONS[2]]
  const podiumColors = [C.gold, C.gold, '#CD7F32']
  const podiumMedals = ['🥈', '🥇', '🥉']

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, position: 'relative' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 350, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}12, transparent 65%)` }} />
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: C.gold, opacity: 0.15, left: `${8 + i * 7.5}%`, top: `${20 + Math.sin(i * 1.2) * 60}px`, animation: `pulse ${3 + i * 0.4}s ease-in-out infinite` }} />
        ))}
        <div style={{ position: 'absolute', top: 10, left: 15, fontSize: 50, opacity: 0.03, transform: 'rotate(-12deg)' }}>🏆</div>
        <div style={{ position: 'absolute', top: 30, right: 20, fontSize: 40, opacity: 0.03, transform: 'rotate(8deg)' }}>🥇</div>
      </div>

      <ZoneHeader zoneId="wall" />

      {/* Activity feed bar */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600 }}>{WALL_ACTIVITY[activityIdx]}</span>
        </div>
      </div>

      {/* Champion Spotlight */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ borderRadius: 16, padding: '14px 10px 10px', background: `linear-gradient(135deg, ${C.gold}0A, rgba(255,180,0,0.04), ${C.gold}06)`, border: `1px solid ${C.gold}20`, boxShadow: `0 0 30px ${C.gold}08` }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: 3, textShadow: `0 0 12px ${C.gold}40` }}>CHAMPION SPOTLIGHT</div>
            <div style={{ fontSize: 7, color: C.text3, letterSpacing: 1, marginTop: 2 }}>Latest Tournament Winners</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, justifyContent: 'center' }}>
            {[1, 0, 2].map((idx, pos) => {
              const ch = WALL_CHAMPIONS[idx]
              const isFirst = idx === 0
              const pColor = [C.gold, '#C0C0C0', '#CD7F32'][idx]
              const podH = isFirst ? 130 : pos === 0 ? 110 : 100
              return (
                <div key={idx} style={{ flex: 1, maxWidth: isFirst ? 120 : 100, height: podH, borderRadius: 12, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: isFirst ? `linear-gradient(180deg, ${C.gold}18, ${C.gold}08)` : `linear-gradient(180deg, ${pColor}10, ${pColor}06)`, border: `1.5px solid ${pColor}${isFirst ? '40' : '20'}`, boxShadow: isFirst ? `0 0 20px ${C.gold}15, inset 0 0 15px ${C.gold}08` : 'none', position: 'relative', overflow: 'hidden' }}>
                  {isFirst && <div style={{ position: 'absolute', top: -2, fontSize: 16, filter: `drop-shadow(0 0 6px ${C.gold}60)` }}>👑</div>}
                  <div style={{ fontSize: isFirst ? 18 : 14, marginTop: isFirst ? 14 : 0 }}>{['🥇', '🥈', '🥉'][idx]}</div>
                  <div style={{ width: isFirst ? 32 : 26, height: isFirst ? 32 : 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isFirst ? 18 : 14, background: `${pColor}12`, border: `2px solid ${pColor}${isFirst ? '50' : '30'}`, boxShadow: isFirst ? `0 0 10px ${C.gold}25` : 'none' }}>{ch.emoji}</div>
                  <div style={{ fontSize: 6, fontWeight: 800, color: pColor, textAlign: 'center', lineHeight: 1.2, marginTop: 1 }}>{ch.tournament.length > 14 ? ch.tournament.slice(0, 13) + '...' : ch.tournament}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.text, textAlign: 'center' }}>{ch.player}</div>
                  <div style={{ fontSize: 10 }}>{ch.flag}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { val: '#3', label: 'Your Rank', color: C.cyan },
            { val: '8', label: 'Records', color: C.gold },
            { val: '7/12', label: 'Achievements', color: C.green },
            { val: '4,200', label: 'Season Pts', color: C.orange },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px', position: 'relative', zIndex: 1 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.gold}15`, marginBottom: 10 }}>
          {['rankings', 'records', 'achievements'].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.gold : C.text3, borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Rankings tab */}
        {tab === 'rankings' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>📊</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>MEGA LEADERBOARD</div>
                <div style={{ fontSize: 8, color: C.text3, letterSpacing: 1 }}>THE RANKINGS</div>
              </div>
            </div>
            {/* Zone filter tabs */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {[{ id: 'all', l: 'All', e: '🌐' }, { id: 'arcade', l: 'Arcade', e: '🎮' }, { id: 'stage', l: 'Stage', e: '🎪' }, { id: 'oracle', l: 'Fortune', e: '🔮' }, { id: 'tournament', l: 'Tournament', e: '🏆' }].map(t => {
                const tc = t.id === 'arcade' ? C.cyan : t.id === 'tournament' ? C.orange : C.gold
                const sel = lbTab === t.id
                return (
                  <div key={t.id} onClick={() => setLbTab(t.id)} style={{ padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, background: sel ? `${tc}18` : `${C.text3}06`, color: sel ? tc : C.text3, border: `1px solid ${sel ? tc + '35' : C.border}`, boxShadow: sel ? `0 0 12px ${tc}15` : 'none', transition: 'all 0.25s' }}>
                    <span style={{ fontSize: 11 }}>{t.e}</span>{t.l}
                  </div>
                )
              })}
            </div>
            {/* Leaderboard entries */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.gold}15` }}>
              {LEADERBOARD_ALL.map((p, i) => {
                const tierColor = TIER_COLORS[p.tier] || C.text3
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: p.isYou ? `${C.cyan}06` : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: i < LEADERBOARD_ALL.length - 1 ? `1px solid ${C.border}` : 'none', border: p.isYou ? `1px solid ${C.cyan}20` : undefined }}>
                    <div style={{ width: 22, textAlign: 'center', fontSize: p.rank <= 3 ? 16 : 10, fontWeight: 900, color: p.rank <= 3 ? C.gold : C.text3, flexShrink: 0 }}>
                      {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                    </div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `${tierColor}12`, border: `2px solid ${tierColor}30`, flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: p.isYou ? C.cyan : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <span style={{ fontSize: 6, color: tierColor, padding: '1px 4px', borderRadius: 3, background: `${tierColor}10`, border: `1px solid ${tierColor}20`, flexShrink: 0 }}>{p.tier}</span>
                      </div>
                      <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>{p.badge}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>{p.coins.toLocaleString()}</div>
                      <div style={{ fontSize: 7, color: C.text3 }}>coins</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {youEntry && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12 }}>📍</span>
                <span style={{ fontSize: 10, color: C.cyan, fontWeight: 700 }}>Your Position: #{youEntry.rank} · {youEntry.coins.toLocaleString()} coins</span>
              </div>
            )}
          </div>
        )}

        {/* Records tab */}
        {tab === 'records' && (
          <div style={{ marginBottom: 14 }}>
            {[
              { label: 'Longest Puff', value: '4.8s', holder: 'NeonQueen', emoji: '💨', color: C.cyan },
              { label: 'Fastest Goal', value: '0.12s', holder: 'ChillMaster42', emoji: '⚽', color: C.gold },
              { label: 'Perfect Puffs', value: '23 in a row', holder: 'VibeKing', emoji: '🎯', color: C.green },
              { label: 'Biggest Win', value: '10,000 coins', holder: 'BlazedPanda', emoji: '🏆', color: C.orange },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: `${r.color}06`, border: `1px solid ${r.color}12` }}>
                <div style={{ fontSize: 24 }}>{r.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: C.text3, fontWeight: 600, letterSpacing: 1 }}>{r.label.toUpperCase()}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: r.color }}>{r.value}</div>
                  <div style={{ fontSize: 8, color: C.text2 }}>by {r.holder}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements tab */}
        {tab === 'achievements' && (
          <div style={{ marginBottom: 14 }}>
            {[
              { icon: '💨', name: 'First Puff', desc: 'Complete your first game', done: true },
              { icon: '🔥', name: 'Streak Fire', desc: '5 win streak', done: true },
              { icon: '💎', name: 'Diamond Tier', desc: 'Reach Diamond tier', done: false },
              { icon: '🏆', name: 'Tournament Win', desc: 'Win a tournament', done: false },
              { icon: '👑', name: 'Legend', desc: 'Reach Legend tier', done: false },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: a.done ? `${C.gold}06` : 'rgba(255,255,255,0.02)', border: `1px solid ${a.done ? C.gold + '20' : C.border}`, opacity: a.done ? 1 : 0.5 }}>
                <div style={{ fontSize: 28, filter: a.done ? `drop-shadow(0 0 8px ${C.gold}40)` : 'grayscale(1)' }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: a.done ? C.gold : C.text2 }}>{a.name}</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>{a.desc}</div>
                </div>
                <div style={{ fontSize: 16 }}>{a.done ? '✅' : '🔒'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
