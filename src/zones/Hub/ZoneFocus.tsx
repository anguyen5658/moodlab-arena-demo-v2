import { useNavigate, useParams } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C, GLASS_CARD, GLASS_CLEAR } from '@/constants'
import { ARENA_IMAGES, ARENA_VIDEOS, Z } from '@/constants/arena'
import { PLAY_GAMES } from '@/constants/games'

const ZONE_ROUTES: Record<string, string> = {
  arcade:   '/arcade',
  stage:    '/stage',
  oracle:   '/fortune',
  wall:     '/wall',
  worldcup: '/worldcup',
}

const WC_DAYS = (() => {
  const wc = new Date('2026-06-11')
  const now = new Date()
  return Math.max(0, Math.ceil((wc.getTime() - now.getTime()) / 86400000))
})()

function FocusContent({ zoneId }: { zoneId: string }) {
  const navigate = useNavigate()
  const { playFx } = useArena()

  const pill = (color: string, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 100, background: `${color}08`, border: `1px solid ${color}15`, fontSize: 10, fontWeight: 600, color, whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  )

  if (zoneId === 'arcade') return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {pill(C.cyan, '856 playing')}
        {pill(C.red, '5 HOT games')}
        {pill(C.lime, '3 tournaments live')}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {PLAY_GAMES.filter(g => g.hot).slice(0, 3).map(g => (
          <div key={g.id} onClick={() => { playFx('select'); navigate(`/arcade/${g.id}`) }} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${g.color}08`, border: `1px solid ${g.color}15` }}>
            <div style={{ fontSize: 20 }}>{g.emoji}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: g.color, marginTop: 2 }}>{g.name.split(' ')[0]}</div>
            <div style={{ fontSize: 7, color: C.text3 }}>{g.type}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
        <span style={{ fontSize: 9, color: C.text2 }}>Win Rate: <span style={{ color: C.lime, fontWeight: 800 }}>62%</span></span>
        <span style={{ fontSize: 9, color: C.text2 }}>Streak: <span style={{ color: C.orange, fontWeight: 800 }}>🔥 5</span></span>
      </div>
    </div>
  )

  if (zoneId === 'stage') return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {pill(C.red, '2 LIVE now')}
        {pill(C.gold, '1,247 watching')}
        {pill(C.lime, '12,500 coins tonight')}
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,50,50,0.06)', border: '1px solid rgba(255,50,50,0.15)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>🧠 Vibe Check</span>
          <span style={{ fontSize: 9, color: C.text3, marginLeft: 'auto' }}>1,247 watching</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 9, color: C.text3 }}>Next: </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>🎭 Simon Puffs in 8 min</span>
      </div>
    </div>
  )

  if (zoneId === 'oracle') return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, letterSpacing: 2, textShadow: `0 0 20px ${C.gold}50, 0 0 40px ${C.gold}25` }}>THE FORTUNE</div>
        <div style={{ fontSize: 7, color: C.text3, letterSpacing: 2, marginTop: 2 }}>FORTUNE FAVORS THE BOLD</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {pill(C.gold, '16 Games')}
        {pill(C.green, 'Win Rate 62%')}
        {pill(C.gold, 'Jackpot 47K')}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {[
          { label: 'Sportsbook', emoji: '🔮', color: C.purple, path: '/fortune' },
          { label: 'Luck',       emoji: '🎰', color: C.gold,   path: '/fortune' },
          { label: 'Mystery',    emoji: '✨', color: C.orange, path: '/fortune' },
        ].map((a, i) => (
          <div key={i} onClick={() => { playFx('select'); navigate(a.path) }} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${a.color}08`, border: `1px solid ${a.color}15` }}>
            <div style={{ fontSize: 20 }}>{a.emoji}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: a.color, marginTop: 2 }}>{a.label}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>🏆 Daily Jackpot: 47,382 coins</span>
      </div>
    </div>
  )

  if (zoneId === 'wall') return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {pill(C.orange, '#3 your rank')}
        {pill(C.gold, '8 records')}
        {pill(C.lime, 'Season 1 active')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
        {[
          { pos: '🥈', name: 'VibeKing',      pts: '2.6K', first: false, isYou: false },
          { pos: '🥇', name: 'ChillMaster',   pts: '2.8K', first: true,  isYou: false },
          { pos: '🥉', name: 'You',            pts: '421',  first: false, isYou: true  },
        ].map((p, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 10, background: p.first ? `${C.gold}10` : p.isYou ? `${C.cyan}08` : `${C.text3}06`, border: `1px solid ${p.first ? C.gold + '25' : p.isYou ? C.cyan + '20' : C.text3 + '10'}`, transform: p.first ? 'translateY(-4px)' : 'none' }}>
            <div style={{ fontSize: 16 }}>{p.pos}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: p.isYou ? C.cyan : C.text, marginTop: 2 }}>{p.name}</div>
            <div style={{ fontSize: 7, color: C.text3 }}>{p.pts}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>🥉 #3 · Gold</span>
        <span style={{ fontSize: 8, color: C.green }}> · ↑3 today</span>
      </div>
    </div>
  )

  if (zoneId === 'worldcup') return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, letterSpacing: 2 }}>WORLD CUP 2026</div>
        <div style={{ fontSize: 10, color: C.text2, marginTop: 2 }}>June 11 — July 19 · USA · Mexico · Canada</div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
        {[
          { val: WC_DAYS, label: 'DAYS', color: C.gold },
          { val: 48,      label: 'TEAMS', color: C.cyan },
          { val: 104,     label: 'MATCHES', color: C.green },
          { val: 3,       label: 'NATIONS', color: C.red },
        ].map((s, i) => (
          <div key={i} style={{ padding: '6px 12px', borderRadius: 10, textAlign: 'center', background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 6, color: C.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { emoji: '⚽', label: 'Play',    color: C.gold },
          { emoji: '🔮', label: 'Predict', color: C.purple },
          { emoji: '🎪', label: 'Shows',   color: C.pink },
        ].map((a, i) => (
          <div key={i} onClick={() => { playFx('select'); navigate('/worldcup') }} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: `${a.color}08`, border: `1px solid ${a.color}15` }}>
            <div style={{ fontSize: 16 }}>{a.emoji}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: a.color }}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return null
}

export default function ZoneFocus() {
  const { zoneId = '' } = useParams<{ zoneId: string }>()
  const navigate = useNavigate()
  const { playFx } = useArena()

  const z = Z[zoneId]
  const enterPath = ZONE_ROUTES[zoneId]

  if (!z || !enterPath) {
    navigate('/')
    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 5 }}>
      {/* Full-screen background video */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <video autoPlay loop muted playsInline poster={ARENA_IMAGES[zoneId]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
          <source src={ARENA_VIDEOS[zoneId]} type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(5,5,16,0.35) 80%, rgba(5,5,16,0.65) 95%)' }} />
      </div>

      {/* Back button */}
      <div style={{ position: 'absolute', top: 72, left: 14, zIndex: 12 }}>
        <div
          onClick={() => { playFx('back'); navigate('/') }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '7px 14px', borderRadius: 100, ...GLASS_CLEAR }}
        >
          <span style={{ fontSize: 12, color: C.text2 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>Lobby</span>
        </div>
      </div>

      {/* Bottom HUD card */}
      <div style={{ position: 'absolute', bottom: 62, left: 10, right: 10, zIndex: 10, animation: 'panelSlideUp 0.4s ease 0.15s both' }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 8, ...GLASS_CARD }}>
          <div style={{ padding: '16px 18px 14px' }}>
            <div style={{ marginBottom: 14 }}>
              <FocusContent zoneId={zoneId} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                onClick={() => { playFx('nav'); navigate(enterPath) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 100, cursor: 'pointer', background: `${z.primary}12`, border: `1px solid ${z.primary}30`, boxShadow: `0 0 20px ${z.primary}12, inset 0 1px 0 rgba(255,255,255,0.12)`, transition: 'all 0.2s ease' }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: z.primary, letterSpacing: 0.5 }}>Enter {z.name}</span>
                <span style={{ fontSize: 14, color: z.primary }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating pill bottom nav */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 12 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 5px', borderRadius: 100, ...GLASS_CLEAR }}>
          {[
            { id: 'control', l: 'Control', i: '🎛', c: C.cyan },
            { id: 'arena',   l: 'Arena',   i: '🎮', c: C.cyan },
            { id: 'live',    l: 'Live',    i: '📡', c: C.pink },
            { id: 'me',      l: 'Me',      i: '👤', c: C.purple },
          ].map(t => {
            const active = t.id === 'arena'
            return (
              <div
                key={t.id}
                onClick={() => {
                  playFx('nav')
                  if (t.id === 'arena' || t.id === 'control') { navigate('/'); return }
                  navigate(t.id === 'me' ? '/me' : '/live')
                }}
                style={{ display: 'flex', alignItems: 'center', gap: active ? 5 : 0, padding: active ? '7px 14px' : '7px 10px', borderRadius: 100, cursor: 'pointer', background: active ? `${t.c}20` : 'transparent', transition: 'all 0.3s ease', position: 'relative' }}
              >
                <span style={{ fontSize: 16, opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' }}>{t.i}</span>
                {active && <span style={{ fontSize: 11, fontWeight: 700, color: t.c, whiteSpace: 'nowrap' }}>{t.l}</span>}
                {t.id === 'live' && <div style={{ position: 'absolute', top: 3, right: active ? 8 : 4, width: 5, height: 5, borderRadius: '50%', background: C.red, animation: 'pulse 1.5s infinite' }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
