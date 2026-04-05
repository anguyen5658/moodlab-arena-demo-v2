import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const LIVE_MATCHES = [
  { home: '🇧🇷 Brazil', away: '🇩🇪 Germany', score: '2-1', min: 67, hot: true },
  { home: '🇫🇷 France', away: '🇦🇷 Argentina', score: '0-0', min: 45, hot: false },
  { home: '🇺🇸 USA', away: '🇲🇽 Mexico', score: '1-1', min: 88, hot: true },
]

const REACTIONS = ['🔥', '⚽', '👏', '😱', '🎉', '💨', '🤩', '💪']
const NAMES = ['ChillMaster', 'VibeKing', 'PuffPro', 'BlazedPanda', 'CloudSurfer', 'NeonNinja']

interface Reaction { id: number; emoji: string; name: string; x: number }

export default function SpectatorMode() {
  const navigate = useNavigate()
  const { playFx } = useArena()

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [watchingMatch, setWatchingMatch] = useState(0)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [spectators] = useState(842 + Math.floor(Math.random() * 300))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000)
    return () => clearInterval(t)
  }, [])

  // Spawn random reactions every few seconds
  useEffect(() => {
    const r: Reaction = {
      id: Date.now(),
      emoji: REACTIONS[Math.floor(Math.random() * REACTIONS.length)],
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      x: 10 + Math.random() * 80,
    }
    setReactions(prev => [...prev.slice(-8), r])
  }, [tick])

  const match = LIVE_MATCHES[watchingMatch]

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 50%), linear-gradient(180deg, #06101E 0%, #0c1a38 40%, #102240 70%, #081830 100%)' }} />

      {/* Floating reactions */}
      {reactions.map(r => (
        <div key={r.id} style={{ position: 'absolute', left: `${r.x}%`, bottom: '20%', zIndex: 5, pointerEvents: 'none', animation: 'bubbleFloat 3s ease-out forwards', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20 }}>{r.emoji}</span>
          <span style={{ fontSize: 8, color: C.text3, background: 'rgba(0,0,0,0.4)', padding: '1px 4px', borderRadius: 6 }}>{r.name}</span>
        </div>
      ))}

      <div data-back-btn onClick={() => navigate('/arcade')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', padding: '50px 14px 20px', gap: 12, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: 3, marginBottom: 4 }}>👀 SPECTATOR MODE</div>
          <div style={{ fontSize: 9, color: C.text3 }}>👁️ {spectators.toLocaleString()} watching live</div>
        </div>

        {/* Live match tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {LIVE_MATCHES.map((m, i) => (
            <div
              key={i}
              onClick={() => { setWatchingMatch(i); playFx('select') }}
              style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 10, cursor: 'pointer', background: watchingMatch === i ? `${C.cyan}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${watchingMatch === i ? C.cyan + '40' : C.border}`, transition: 'all 0.15s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.hot && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'pulse 1s infinite' }} />}
                <span style={{ fontSize: 9, color: C.text3 }}>{m.min}'</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: watchingMatch === i ? C.cyan : C.text2 }}>{m.home.split(' ')[0]} vs {m.away.split(' ')[0]}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.text, textAlign: 'center' }}>{m.score}</div>
            </div>
          ))}
        </div>

        {/* Match display */}
        <div style={{ padding: 20, borderRadius: 20, background: 'rgba(0,229,255,0.04)', border: `1px solid ${C.cyan}20`, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32 }}>{match.home.split(' ')[0]}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{match.home.split(' ').slice(1).join(' ')}</div>
            </div>
            <div>
              <div style={{ fontSize: 8, color: C.red, fontWeight: 700, animation: 'pulse 1s infinite' }}>🔴 LIVE {match.min}'</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.text, margin: '4px 0' }}>{match.score}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32 }}>{match.away.split(' ')[0]}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{match.away.split(' ').slice(1).join(' ')}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: C.text3 }}>📺 Live coverage · Tap a reaction below to cheer!</div>
        </div>

        {/* Team selection */}
        <div>
          <div style={{ fontSize: 9, color: C.text3, marginBottom: 8, fontWeight: 700 }}>SUPPORT A TEAM</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={() => { setSelectedTeam(match.home); playFx('select') }}
              style={{ flex: 1, padding: 12, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: selectedTeam === match.home ? `${C.cyan}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedTeam === match.home ? C.cyan + '50' : C.border}`, transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 24 }}>{match.home.split(' ')[0]}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: selectedTeam === match.home ? C.cyan : C.text2 }}>{match.home.split(' ').slice(1).join(' ')}</div>
            </div>
            <div
              onClick={() => { setSelectedTeam(match.away); playFx('select') }}
              style={{ flex: 1, padding: 12, borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: selectedTeam === match.away ? `${C.red}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedTeam === match.away ? C.red + '50' : C.border}`, transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 24 }}>{match.away.split(' ')[0]}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: selectedTeam === match.away ? C.red : C.text2 }}>{match.away.split(' ').slice(1).join(' ')}</div>
            </div>
          </div>
        </div>

        {/* Reaction buttons */}
        <div>
          <div style={{ fontSize: 9, color: C.text3, marginBottom: 8, fontWeight: 700 }}>REACTIONS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {REACTIONS.map(emoji => (
              <div
                key={emoji}
                onClick={() => {
                  playFx('tap')
                  const r: Reaction = { id: Date.now() + Math.random(), emoji, name: 'You', x: 40 + Math.random() * 20 }
                  setReactions(prev => [...prev.slice(-8), r])
                }}
                style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.1s' }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {selectedTeam && (
          <div style={{ padding: 12, borderRadius: 14, background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan }}>👀 Watching as {selectedTeam} fan</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>Reactions count toward crowd energy!</div>
          </div>
        )}

        <div onClick={() => navigate('/arcade')} style={{ padding: '12px 0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.text2 }}>← Back to Arcade</div>
      </div>
    </div>
  )
}
