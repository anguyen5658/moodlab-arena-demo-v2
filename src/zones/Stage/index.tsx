import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { SHOW_GAMES } from '@/constants/games'
import { C } from '@/constants/theme'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'
import GameDetailSheet from '@/components/GameDetailSheet'
import type { GameDefinition } from '@/types'

const INFO_ITEMS = [
  { text: 'Tonight: 12,500 coins up for grabs!', color: C.gold },
  { text: 'Next: Simon Puffs in 8m', color: C.cyan },
  { text: 'Your Best: Survival Trivia Round 12', color: C.green },
  { text: 'Highlight: JACKPOT on Spin & Win!', color: C.pink },
]

export default function StageZone() {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const [tick, setTick] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const showIdx = Math.floor(tick / 8) % SHOW_GAMES.length
  const liveShow = SHOW_GAMES[showIdx]
  const liveShow2 = SHOW_GAMES[(showIdx + 4) % SHOW_GAMES.length]
  const liveShow3 = SHOW_GAMES[(showIdx + 7) % SHOW_GAMES.length]
  const liveIds = new Set([liveShow.id, liveShow2.id, liveShow3.id])

  const stageSlides = [
    { emoji: liveShow.emoji, title: liveShow.name, sub: `${liveShow.type} · 1,247 watching`, color: C.red, badge: 'LIVE' },
    { emoji: liveShow2.emoji, title: liveShow2.name, sub: `${liveShow2.type} · NOW SHOWING`, color: C.pink, badge: 'LIVE' },
    { emoji: '🏆', title: 'Tonight: 12,500 coins', sub: 'Prize pool across all shows tonight!', color: C.gold, badge: 'PRIZES' },
    { emoji: '🎭', title: 'Next: Simon Puffs', sub: 'Starting in 8 minutes · Memory challenge', color: C.purple, badge: 'SOON' },
    { emoji: '💀', title: 'Survival Trivia Record', sub: 'CloudChaser survived to Round 15!', color: C.red, badge: 'NEW' },
  ]
  const slideIdx = Math.floor(tick / 4) % stageSlides.length
  const slide = stageSlides[slideIdx]
  const infoIdx = Math.floor(tick / 3) % INFO_ITEMS.length
  const info = INFO_ITEMS[infoIdx]

  return (
    <>
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, position: 'relative' }}>
      {/* Theater lighting */}
      <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 350, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 0%, ${C.gold}14, transparent 50%), radial-gradient(ellipse at 30% 10%, ${C.orange}08, transparent 40%), radial-gradient(ellipse at 70% 10%, ${C.orange}08, transparent 40%)` }} />

      <ZoneHeader zoneId="stage" />
      <div style={{ padding: '0 14px', position: 'relative', zIndex: 1 }}>

        {/* Hero slider */}
        <div style={{ marginBottom: 8 }}>
          <div
            onClick={() => { playFx('select'); navigate(`/stage/${liveShow.id}`) }}
            style={{ padding: '14px 16px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20`, cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                  {slide.badge && (
                    <span style={{ fontSize: 6, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: slide.badge === 'LIVE' ? `${C.red}18` : `${slide.color}12`, color: slide.badge === 'LIVE' ? C.red : slide.color, border: `1px solid ${slide.badge === 'LIVE' ? C.red : slide.color}25` }}>{slide.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
              {stageSlides.map((_, i) => (
                <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick feed bar */}
        <div style={{ padding: '6px 12px', borderRadius: 100, marginBottom: 8, background: `${info.color}06`, border: `1px solid ${info.color}10`, transition: 'all 0.5s ease', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: info.color }}>{info.text}</span>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { val: '23', label: 'Shows', color: C.gold },
            { val: '12', label: 'Wins', color: C.green },
            { val: '3,200', label: 'Coins', color: C.cyan },
            { val: '4x', label: 'Roles', color: C.red },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* All shows grid */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {SHOW_GAMES.map((g, i) => {
              const isLive = liveIds.has(g.id)
              return (
                <div
                  key={g.id}
                  onClick={() => { playFx('select'); setSelectedGame(g) }}
                  style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', position: 'relative', background: isLive ? 'rgba(255,50,50,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLive ? 'rgba(255,50,50,0.2)' : C.border}` }}
                >
                  {isLive && (
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.red, animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 6, fontWeight: 900, color: C.red }}>LIVE</span>
                    </div>
                  )}
                  {g.id === 'vibecheck' && (
                    <div style={{ position: 'absolute', top: 4, left: 4, fontSize: 6, fontWeight: 900, color: '#fff', padding: '1px 5px', borderRadius: 3, background: C.gold }}>WC Edition</div>
                  )}
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{g.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: isLive ? C.text : C.text2 }}>{g.name}</div>
                  <div style={{ fontSize: 7, color: g.color, fontWeight: 700, marginTop: 1 }}>{g.type}</div>
                  {!isLive && <div style={{ fontSize: 6, color: C.text3, marginTop: 1 }}>in {8 + i * 4}m</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>

    {selectedGame && (
      <GameDetailSheet
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        zoneRoute="/stage"
      />
    )}
    </>
  )
}
