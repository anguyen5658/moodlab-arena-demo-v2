import { useState, useEffect } from 'react'
import { C, GLASS_CARD, GLASS_CLEAR } from '@/constants'
import { useArena } from '@/context/ArenaContext'

// ── Data ──────────────────────────────────────────────────────────────────────

const LIVE_HERO_SLIDES = [
  {
    id: 'wc', type: 'match',
    tag: '⚽ FIFA WORLD CUP 2026', tagColor: '#FFD93D',
    title: 'Brazil vs Argentina', subtitle: 'Quarter Final — Watch Party',
    host: { name: 'VibeKing', avatar: '👑', badge: 'Partner' },
    meta: '1,247 watching • 3,420 puffs', cta: 'JOIN WATCH PARTY',
    gradient: 'linear-gradient(135deg, #0c1445 0%, #1a0a30 40%, #2d0a24 100%)',
    visual: { teamA: '🇧🇷', teamB: '🇦🇷', score: 'LIVE' },
  },
  {
    id: 'celeb', type: 'kol',
    tag: '🔥 FEATURED CREATOR', tagColor: '#FF4D8D',
    title: 'SnoopCloud420', subtitle: 'Celebrity Chill Session',
    host: { name: 'SnoopCloud420', avatar: '🎤', badge: 'Partner' },
    meta: '8,912 watching • VIP', cta: 'WATCH NOW',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #0a1628 40%, #0c2a1a 100%)',
    visual: { emoji: '🎤', ring: '#C084FC' },
  },
  {
    id: 'gameshow', type: 'gameshow',
    tag: '🎮 ARENA × LIVE', tagColor: '#00E5FF',
    title: 'Vibe Check LIVE', subtitle: 'Trivia Game Show — Play along!',
    host: { name: 'AI Host Max', avatar: '🤖', badge: 'Official' },
    meta: '342 watching • 1,200 playing', cta: 'JOIN AS AUDIENCE',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d0a24 40%, #0c1445 100%)',
    visual: { emoji: '🧠', ring: '#00E5FF', emoji2: '⚡', emoji3: '🏆' },
  },
  {
    id: 'brand', type: 'brand',
    tag: '📦 BRAND DROP', tagColor: '#34D399',
    title: 'Cali Clear × Mood Lab', subtitle: 'Exclusive Launch Stream',
    host: { name: 'Cali Clear', avatar: '✨', badge: 'Official' },
    meta: 'Tomorrow 8PM • Giveaways', cta: 'GET NOTIFIED',
    gradient: 'linear-gradient(135deg, #1a1a0a 0%, #0a1a14 40%, #0a0f1a 100%)',
    visual: { emoji: '✨', ring: '#34D399' },
  },
  {
    id: 'tournament', type: 'tournament',
    tag: '🏆 TOURNAMENT FINALS', tagColor: '#FFD93D',
    title: 'FK Championship Final', subtitle: 'PuffDaddy vs NeonNinja',
    host: { name: 'Arena', avatar: '🏆', badge: 'Official' },
    meta: 'LIVE • 2,100 spectators', cta: 'WATCH FINAL',
    gradient: 'linear-gradient(135deg, #0a0f1a 0%, #1a1a0a 40%, #2d0a24 100%)',
    visual: { p1: '🔥', p2: '⚡' },
  },
]

const LIVE_STREAMS = [
  { id: 1, host: 'ChillQueen',    avatar: '🌙', viewers: 892, category: 'Chill',  title: 'Late Night Chill Sesh 🌌',      puffs: 1205, badge: 'Partner', followers: 8200  },
  { id: 2, host: 'GameMaster420', avatar: '🎮', viewers: 634, category: 'Games',  title: 'Hot Potato Tournament 🥔🔥',    puffs: 876,  badge: 'Creator', followers: 3100  },
  { id: 3, host: 'CloudNine',     avatar: '☁️', viewers: 421, category: 'Chill',  title: 'Morning Mist Session ☀️',       puffs: 340,  badge: 'Creator', followers: 1800  },
  { id: 4, host: 'NeonVibes',     avatar: '✨', viewers: 315, category: 'Brand',  title: 'Stack Launch Party 🎉',         puffs: 2100, badge: 'Official', followers: 25000 },
  { id: 5, host: 'TerpQueen',     avatar: '🧪', viewers: 189, category: 'Chill',  title: 'Strain Review: OG Kush 🌿',    puffs: 450,  badge: 'Creator', followers: 2400  },
]

const LIVE_CATEGORIES = [
  { name: 'All',       icon: '🔥', c: '#FF4D8D' },
  { name: 'Following', icon: '♡',  c: '#FB923C' },
  { name: 'World Cup', icon: '⚽', c: '#FFD93D' },
  { name: 'Arena',     icon: '🎮', c: '#00E5FF' },
  { name: 'Chill',     icon: '🌙', c: '#C084FC' },
  { name: 'Games',     icon: '🕹️', c: '#34D399' },
]

const LIVE_ARENA_ITEMS = [
  { icon: '🧠', title: 'Vibe Check', status: 'LIVE NOW',  statusColor: '#FF4444', sub: '342 playing',    isLive: true  },
  { icon: '⚽', title: 'Final Kick', status: 'FINALS',    statusColor: '#FFD93D', sub: '2.1K watching',  isLive: true  },
  { icon: '🎡', title: 'Spin & Win', status: 'IN 30 MIN', statusColor: '#FB923C', sub: 'KOL hosted',     isLive: false },
  { icon: '🔮', title: 'WC Predictor', status: 'OPEN',   statusColor: '#34D399', sub: 'BRA vs ARG',     isLive: false },
]

const LIVE_CREATORS = [
  { name: 'DankReviews', avatar: '🔬', badge: 'Partner', followers: '15.2K', schedule: 'Mon/Thu 9PM'  },
  { name: 'CloudChaser', avatar: '🌬️', badge: 'Partner', followers: '9.8K',  schedule: 'Daily 8PM'    },
  { name: 'TerpQueen',   avatar: '🧪', badge: 'Creator', followers: '4.1K',  schedule: 'Fri/Sat 10PM' },
  { name: 'VapeSensei',  avatar: '🥷', badge: 'Partner', followers: '22K',   schedule: 'Wed/Sun 7PM'  },
]

const LIVE_BADGE: Record<string, { icon: string; c: string }> = {
  Creator: { icon: '⚡', c: '#00E5FF' },
  Partner: { icon: '💎', c: '#FFD93D' },
  Official: { icon: '✦', c: '#FF4D8D' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveBadgeTag({ type, s = 10 }: { type: string; s?: number }) {
  const b = LIVE_BADGE[type]
  if (!b) return null
  return (
    <span style={{
      fontSize: s, fontWeight: 800, color: b.c,
      padding: '1px 5px', borderRadius: 5,
      background: `${b.c}18`, border: `1px solid ${b.c}30`,
    }}>
      {b.icon} {type}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Live() {
  const { playFx, notify } = useArena()

  const [liveHeroIdx, setLiveHeroIdx] = useState(0)
  const [liveHeroProgress, setLiveHeroProgress] = useState(0)
  const [liveCategory, setLiveCategory] = useState('All')
  const [liveFollowed, setLiveFollowed] = useState<Record<string, boolean>>({})

  // Auto-rotate hero slides
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveHeroIdx(p => (p + 1) % LIVE_HERO_SLIDES.length)
      setLiveHeroProgress(0)
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  // Progress bar animation
  useEffect(() => {
    setLiveHeroProgress(0)
    const iv = setInterval(() => {
      setLiveHeroProgress(p => {
        if (p >= 1) return 1
        return p + 0.01
      })
    }, 40)
    return () => clearInterval(iv)
  }, [liveHeroIdx])

  const filteredLiveStreams =
    liveCategory === 'All' ? LIVE_STREAMS
    : liveCategory === 'Following' ? LIVE_STREAMS.filter(s => liveFollowed[s.host])
    : LIVE_STREAMS.filter(s => s.category === liveCategory || (liveCategory === 'Games' && s.category === 'Games'))

  const heroSlide = LIVE_HERO_SLIDES[liveHeroIdx]

  const openLiveStream = () => {
    playFx('nav')
    notify('Opening stream...', C.pink)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%', overflowY: 'auto', paddingBottom: 80 }}>
      {/* Atmospheric background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0515 0%, #050510 30%, #0c0820 60%, #050510 100%)' }} />
        <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '60%', height: '50%', background: 'radial-gradient(ellipse, rgba(244,114,182,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-15%', width: '50%', height: '40%', background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: '40%', height: '30%', background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {[...Array(15)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2 + (i * 0.13) % 2,
            height: 2 + (i * 0.13) % 2,
            borderRadius: '50%',
            background: ['rgba(244,114,182,0.3)', 'rgba(34,211,238,0.3)', 'rgba(251,191,36,0.2)', 'rgba(192,132,252,0.3)'][i % 4],
            left: (5 + (i * 6.1) % 90) + '%',
            top: (5 + (i * 5.7) % 90) + '%',
            animation: `floatParticle ${8 + (i * 1.3) % 12}s ease-in-out infinite ${(i * 0.33) % 5}s`,
            filter: 'blur(1px)',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: 'absolute', top: '15%', left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.15), rgba(34,211,238,0.1), transparent)', boxShadow: '0 0 20px rgba(244,114,182,0.1)' }} />
      </div>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '2px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(135deg, #FF4D8D, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, animation: 'pulse 1.2s infinite', boxShadow: `0 0 8px ${C.red}, 0 0 16px ${C.red}60` }} />
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 1, letterSpacing: 0.5 }}>Watch  ·  Stream  ·  Puff Together</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['🔔', '🔍'] as const).map((e, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 12, ...GLASS_CLEAR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{e}</div>
          ))}
        </div>
      </div>

      {/* Hero Slider */}
      <div
        style={{ margin: '8px 14px', borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1, height: 250, cursor: 'pointer' }}
        onClick={openLiveStream}
      >
        <div style={{ position: 'absolute', inset: 0, background: heroSlide.gradient, transition: 'opacity 0.6s ease' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: 18 }}>
          {/* Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, background: `${heroSlide.tagColor}15`, border: `1px solid ${heroSlide.tagColor}25` }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: heroSlide.tagColor, animation: 'pulse 1.2s infinite', boxShadow: `0 0 6px ${heroSlide.tagColor}` }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: heroSlide.tagColor, letterSpacing: 0.5 }}>{heroSlide.tag}</span>
            </div>
          </div>

          {/* Center visual */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {heroSlide.type === 'match' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ fontSize: 44, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{(heroSlide.visual as { teamA: string }).teamA}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: C.gold }}>VS</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.gold, marginTop: 4, fontWeight: 700, letterSpacing: 1 }}>{(heroSlide.visual as { score: string }).score}</div>
                </div>
                <div style={{ fontSize: 44, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{(heroSlide.visual as { teamB: string }).teamB}</div>
              </div>
            ) : heroSlide.type === 'gameshow' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.purple}15`, border: `1.5px solid ${C.purple}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, animation: 'float 2.5s ease-in-out infinite' }}>{(heroSlide.visual as { emoji2: string }).emoji2}</div>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: `${(heroSlide.visual as { ring: string }).ring}15`, border: `2px solid ${(heroSlide.visual as { ring: string }).ring}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: `0 0 40px ${(heroSlide.visual as { ring: string }).ring}10` }}>{(heroSlide.visual as { emoji: string }).emoji}</div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.gold}15`, border: `1.5px solid ${C.gold}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, animation: 'float 3s ease-in-out infinite 0.5s' }}>{(heroSlide.visual as { emoji3: string }).emoji3}</div>
              </div>
            ) : heroSlide.type === 'tournament' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.red}12`, border: `2px solid ${C.red}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{(heroSlide.visual as { p1: string }).p1}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, marginTop: 4 }}>PuffDaddy</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: C.gold }}>VS</span>
                  </div>
                  <div style={{ fontSize: 8, color: C.gold, marginTop: 3, fontWeight: 700, letterSpacing: 1 }}>FINAL</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.cyan}12`, border: `2px solid ${C.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{(heroSlide.visual as { p2: string }).p2}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, marginTop: 4 }}>NeonNinja</div>
                </div>
              </div>
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 20, background: `${(heroSlide.visual as { ring: string }).ring}12`, border: `2px solid ${(heroSlide.visual as { ring: string }).ring}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: `0 0 40px ${(heroSlide.visual as { ring: string }).ring}15`, animation: 'float 3s ease-in-out infinite' }}>{(heroSlide.visual as { emoji: string }).emoji}</div>
            )}
          </div>

          {/* Bottom info */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 2, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{heroSlide.title}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{heroSlide.subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{heroSlide.host.avatar}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>{heroSlide.host.name}</span>
                <LiveBadgeTag type={heroSlide.host.badge} s={8} />
              </div>
              <span style={{ fontSize: 10, color: C.text3 }}>•</span>
              <span style={{ fontSize: 10, color: C.text3 }}>{heroSlide.meta}</span>
            </div>
            {/* CTA + Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                onClick={e => { e.stopPropagation(); openLiveStream() }}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${heroSlide.tagColor}, ${C.orange})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.8, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
              >
                {heroSlide.cta}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {LIVE_HERO_SLIDES.map((_, i) => (
                  <div
                    key={i}
                    onClick={e => { e.stopPropagation(); setLiveHeroIdx(i); setLiveHeroProgress(0) }}
                    style={{ width: i === liveHeroIdx ? 24 : 6, height: 6, borderRadius: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.15)', position: 'relative', overflow: 'hidden', transition: 'width 0.3s ease' }}
                  >
                    {i === liveHeroIdx && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${liveHeroProgress * 100}%`, borderRadius: 3, background: heroSlide.tagColor, transition: 'width 0.04s linear' }} />}
                    {i !== liveHeroIdx && <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'rgba(255,255,255,0.25)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 6, padding: '10px 14px', overflowX: 'auto' }}>
        {LIVE_CATEGORIES.map(cat => (
          <div
            key={cat.name}
            onClick={() => setLiveCategory(cat.name)}
            style={{ padding: '6px 14px', borderRadius: 20, border: liveCategory === cat.name ? `1.5px solid ${cat.c}` : `1px solid ${C.border}`, background: liveCategory === cat.name ? `${cat.c}12` : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600, color: liveCategory === cat.name ? cat.c : C.text3, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
          >
            <span>{cat.icon}</span> {cat.name}
            {cat.name === 'Following' && Object.values(liveFollowed).filter(Boolean).length > 0 && (
              <span style={{ background: cat.c, color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 9, fontWeight: 800, minWidth: 14, textAlign: 'center' }}>
                {Object.values(liveFollowed).filter(Boolean).length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Arena × Live Strip */}
      <div style={{ position: 'relative', zIndex: 1, padding: '10px 14px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 12 }}>🎮</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Arena × Live</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: `${C.cyan}15`, color: C.cyan, fontWeight: 700 }}>CROSS-TAB</span>
          <span style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginLeft: 'auto', cursor: 'pointer' }}>Go to Arena →</span>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {LIVE_ARENA_ITEMS.map((a, i) => (
            <div key={i} style={{ minWidth: 140, padding: '12px 14px', borderRadius: 14, ...GLASS_CARD, border: a.isLive ? `1px solid ${a.statusColor}20` : `1px solid ${C.glassBorder}`, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              {a.isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${a.statusColor}, transparent)` }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: a.statusColor, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {a.isLive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: a.statusColor, animation: 'pulse 1.2s infinite' }} />}
                    {a.status}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 8 }}>{a.sub}</div>
              <div
                onClick={() => notify('Joining stream...', a.statusColor || C.cyan)}
                style={{ width: '100%', padding: '5px 0', borderRadius: 8, border: `1px solid ${a.statusColor}30`, background: `${a.statusColor}08`, fontSize: 10, fontWeight: 700, color: a.statusColor, cursor: 'pointer', textAlign: 'center' }}
              >
                {a.isLive ? 'Watch' : 'Remind'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Now */}
      <div style={{ position: 'relative', zIndex: 1, padding: '12px 14px 4px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.red, animation: 'pulse 1.2s infinite' }}>●</span>
          {liveCategory === 'Following' ? 'Following — Live' : 'Live Now'}
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 400, marginLeft: 'auto' }}>{filteredLiveStreams.length} streams</span>
        </div>
        {filteredLiveStreams.length === 0 && liveCategory === 'Following' && (
          <div style={{ textAlign: 'center', padding: 32, color: C.text3, fontSize: 13 }}>No followed creators are live.<br />Follow creators below!</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLiveStreams.map(s => {
            const catColor = s.category === 'Chill' ? C.purple : s.category === 'Brand' ? C.gold : s.category === 'World Cup' ? C.gold : C.cyan
            return (
              <div
                key={s.id}
                onClick={openLiveStream}
                style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 16, ...GLASS_CARD, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${catColor}, ${catColor}40, transparent)`, borderRadius: '16px 16px 0 0' }} />
                <div style={{ width: 76, height: 76, borderRadius: 14, background: `linear-gradient(135deg, ${C.bg3}, ${catColor}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, position: 'relative', flexShrink: 0, border: `1px solid ${catColor}15` }}>
                  {s.avatar}
                  <div style={{ position: 'absolute', top: 5, right: 5, background: C.red, borderRadius: 4, padding: '1px 5px', fontSize: 8, fontWeight: 800, color: '#fff', boxShadow: `0 0 6px ${C.red}60` }}>LIVE</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.text3, marginBottom: 4 }}>
                    <span>{s.host}</span><LiveBadgeTag type={s.badge} s={8} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.text3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite', boxShadow: `0 0 4px ${C.green}` }} />
                      {s.viewers.toLocaleString()} watching
                    </span>
                    <span>💨 {s.puffs.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Featured Creators */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 14px 4px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⭐ Featured Creators
          <span style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginLeft: 'auto' }}>See all →</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {LIVE_CREATORS.map(cr => {
            const ringColor = cr.badge === 'vip' ? C.gold : cr.badge === 'og' ? C.purple : cr.badge === 'mod' ? C.cyan : C.pink
            return (
              <div key={cr.name} style={{ minWidth: 136, padding: 14, textAlign: 'center', flexShrink: 0, borderRadius: 16, ...GLASS_CARD, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: `linear-gradient(90deg, transparent, ${ringColor}40, transparent)` }} />
                <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 8px', background: `linear-gradient(135deg, ${ringColor}20, ${C.bg3})`, border: `2px solid ${ringColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: `0 0 16px ${ringColor}20, inset 0 0 8px ${ringColor}10` }}>
                  {cr.avatar}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cr.name}</div>
                <LiveBadgeTag type={cr.badge} s={8} />
                <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{cr.followers} followers</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>🕐 {cr.schedule}</div>
                <div
                  onClick={e => { e.stopPropagation(); setLiveFollowed(p => ({ ...p, [cr.name]: !p[cr.name] })); playFx('coin') }}
                  style={{ width: '100%', padding: '6px 0', borderRadius: 10, border: liveFollowed[cr.name] ? `1px solid ${C.orange}` : 'none', background: liveFollowed[cr.name] ? 'transparent' : `linear-gradient(135deg, ${C.orange}, ${C.pink})`, fontSize: 10, fontWeight: 700, color: liveFollowed[cr.name] ? C.orange : '#fff', cursor: 'pointer', marginTop: 8, textAlign: 'center', boxShadow: liveFollowed[cr.name] ? 'none' : '0 2px 12px rgba(251,146,60,0.2)' }}
                >
                  {liveFollowed[cr.name] ? '✓ Following' : 'Follow'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Go Live FAB */}
      <div style={{ position: 'fixed', bottom: 88, right: 'calc(50% - 195px)', zIndex: 40 }}>
        <div
          onClick={() => notify('Go Live — Coming soon!', C.pink)}
          style={{ width: 62, height: 62, borderRadius: 18, background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px rgba(236,72,153,0.4), 0 0 40px rgba(236,72,153,0.15)`, position: 'relative' }}
        >
          <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
          📡
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: C.pink, textAlign: 'center', marginTop: 4, letterSpacing: 1, textShadow: `0 0 10px ${C.pink}40` }}>GO LIVE</div>
      </div>
    </div>
  )
}
