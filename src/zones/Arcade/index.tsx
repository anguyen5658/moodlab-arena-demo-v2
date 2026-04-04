import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { PLAY_GAMES } from '@/constants/games'
import { C } from '@/constants/theme'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'
import GameDetailSheet from '@/components/GameDetailSheet'
import type { GameDefinition } from '@/types'

const PLAYER_COUNTS: Record<string, number> = {
  finalkick: 2100, finalkick2: 356, finalkick3: 198, wildwest: 720,
  russian: 167, balloon: 145, puffpong: 289, rhythm: 134, tugofwar: 312,
  hotpotato: 890, hooked: 410, rps: 540, beatdrop: 245, puffclock: 310,
  pufflimbo: 178, puffderby: 420,
}

const TOURNAMENTS = [
  { name: 'FK1 World Cup 2026', emoji: '🏆', game: 'Final Kick', prize: '50,000 coins', color: C.gold, status: 'LIVE', players: 312, round: 'Round of 16' },
  { name: 'The Outlaw Circuit', emoji: '🤠', game: 'Wild West Duel', prize: '25,000 coins', color: C.orange, status: 'OPEN', players: 148, round: 'Qualifying' },
  { name: 'Dojo Championship', emoji: '🥋', game: 'Tug of War', prize: '15,000 coins', color: C.red, status: 'STARTING', players: 96, round: 'Round 1' },
  { name: 'Pong Masters', emoji: '🏓', game: 'Puff Pong', prize: '10,000 coins', color: C.green, status: 'OPEN', players: 64, round: 'Open Entry' },
]

const RECENT_ACTIVITY = [
  { emoji: '🏆', text: 'You won Final Kick vs SmokeBot! +80 coins', time: '5m ago', color: C.gold },
  { emoji: '🎯', text: 'CloudChaser99 just won 500 coins in Wild West!', time: '8m ago', color: C.orange },
  { emoji: '⏱️', text: 'NeonQueen set a new Puff Clock record!', time: '12m ago', color: C.cyan },
  { emoji: '🏆', text: 'Tournament: Outlaw Circuit Round 2 starting!', time: '20m ago', color: C.red },
  { emoji: '💣', text: 'Hot Potato lobby is FULL - 8/8 players!', time: '25m ago', color: C.orange },
]

const MY_STATS = { gamesPlayed: 47, winRate: 62, coinsWon: 4200, streak: 5, bestRecord: 'Puff Clock ±0.02s' }

const TRIED_GAMES = ['finalkick', 'wildwest', 'puffpong', 'tugofwar', 'rps']

export default function ArcadeZone() {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const [tab, setTab] = useState<'games' | 'tournaments' | 'activity' | 'stats'>('games')
  const [tick, setTick] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const hotGames = PLAY_GAMES.filter(g => g.hot)
  const hotIdx = Math.floor(Date.now() / 4000) % Math.max(hotGames.length, 1)
  const featuredGame = hotGames[hotIdx] || PLAY_GAMES[0]
  const activeTourney = TOURNAMENTS.find(t => t.status === 'LIVE') || TOURNAMENTS[0]
  const totalPlaying = Object.values(PLAYER_COUNTS).reduce((a, b) => a + b, 0)

  const heroSlides = [
    { emoji: featuredGame.emoji, title: featuredGame.name, sub: `${featuredGame.type} · ${PLAYER_COUNTS[featuredGame.id] || 0} playing`, color: featuredGame.color, badge: featuredGame.hot ? '🔥 HOT' : '', action: () => { playFx('select'); setSelectedGame(featuredGame) } },
    { emoji: '🏆', title: activeTourney.name, sub: `${activeTourney.players} entered · ${activeTourney.round}`, color: C.gold, badge: activeTourney.status, action: () => { playFx('select') } },
    { emoji: '🎮', title: 'ARCADE', sub: `${PLAY_GAMES.length} Games · ${totalPlaying.toLocaleString()} Playing Now`, color: C.cyan, badge: 'LIVE', action: null },
    { emoji: '⚡', title: 'Quick Play', sub: 'Jump into a random game instantly!', color: C.lime, badge: 'INSTANT', action: () => { playFx('select'); const rg = PLAY_GAMES[Math.floor(Math.random() * PLAY_GAMES.length)]; setSelectedGame(rg) } },
  ]
  const slideIdx = Math.floor(tick / 4) % heroSlides.length
  const slide = heroSlides[slideIdx]

  const smartSorted = [...PLAY_GAMES].sort((a, b) => {
    if (a.hot && !b.hot) return -1
    if (!a.hot && b.hot) return 1
    return (PLAYER_COUNTS[b.id] || 0) - (PLAYER_COUNTS[a.id] || 0)
  })

  const highlights = [
    `🔥 ${featuredGame.name} trending · ${PLAYER_COUNTS[featuredGame.id] || 0} playing`,
    `🏆 ${activeTourney.name} ${activeTourney.round} starting`,
    `⚡ ${RECENT_ACTIVITY[0].text}`,
    `🎯 ${RECENT_ACTIVITY[1].text}`,
    `💣 ${RECENT_ACTIVITY[4].text}`,
  ]

  return (
    <>
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, position: 'relative' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 400, pointerEvents: 'none', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${C.cyan}15, transparent 60%)` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(${C.cyan}06 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}06 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: 0.5 }} />
      </div>

      <ZoneHeader zoneId="arcade" />

      {/* Hero slider */}
      <div onClick={() => slide.action?.()} style={{ padding: '0 14px', marginBottom: 10, cursor: slide.action ? 'pointer' : 'default' }}>
        <div style={{ padding: '14px 16px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                {slide.badge && (
                  <span style={{ fontSize: 6, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: slide.badge === 'LIVE' || slide.badge === '🔥 HOT' ? `${C.red}18` : `${C.green}12`, color: slide.badge === 'LIVE' || slide.badge === '🔥 HOT' ? C.red : C.green, border: `1px solid ${slide.badge === 'LIVE' || slide.badge === '🔥 HOT' ? C.red : C.green}25` }}>{slide.badge}</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
            {heroSlides.map((_, i) => (
              <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick highlight */}
      <div style={{ padding: '0 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: `${C.cyan}06`, border: `1px solid ${C.cyan}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlights[Math.floor(tick / 3) % 5]}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ padding: '0 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { val: MY_STATS.gamesPlayed, label: 'Played', color: C.cyan },
            { val: `${MY_STATS.winRate}%`, label: 'Win Rate', color: C.green },
            { val: MY_STATS.coinsWon.toLocaleString(), label: 'Coins', color: C.gold },
            { val: `🔥${MY_STATS.streak}`, label: 'Streak', color: C.orange },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 6, color: C.text3, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
          {(['games', 'tournaments', 'activity', 'stats'] as const).map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: tab === t ? 800 : 600, color: tab === t ? C.cyan : C.text3, borderBottom: tab === t ? `2px solid ${C.cyan}` : '2px solid transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Games tab */}
        {tab === 'games' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>🎮</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: C.text, letterSpacing: 1.5 }}>ALL GAMES</span>
              </div>
              <span style={{ fontSize: 9, color: C.text3 }}>{PLAY_GAMES.length} games</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {smartSorted.map((g, i) => {
                const isNew = !TRIED_GAMES.includes(g.id)
                const count = PLAYER_COUNTS[g.id] || 30
                return (
                  <div key={g.id} onClick={() => { playFx('select'); setSelectedGame(g) }} style={{ padding: '12px 10px', borderRadius: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, ${C.bg2} 70%)`, border: `1px solid ${g.color}15`, transition: 'all 0.3s', animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}>
                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                      {g.hot && <span style={{ fontSize: 7, fontWeight: 800, color: C.red, padding: '1px 6px', borderRadius: 4, background: `${C.red}18`, border: `1px solid ${C.red}25` }}>🔥 HOT</span>}
                      {isNew && <span style={{ fontSize: 6, fontWeight: 800, color: C.cyan, padding: '1px 5px', borderRadius: 4, background: `${C.cyan}15`, border: `1px solid ${C.cyan}25` }}>NEW FOR YOU</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: `radial-gradient(circle, ${g.color}18, ${g.color}05)`, border: `1px solid ${g.color}22`, filter: `drop-shadow(0 0 8px ${g.color}35)`, boxShadow: `0 0 14px ${g.color}12`, flexShrink: 0 }}>{g.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                        <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>👥 {g.players} · ⏱ {g.time}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: g.color, padding: '2px 6px', borderRadius: 4, background: `${g.color}10` }}>{g.type}</span>
                      <span style={{ fontSize: 7, color: C.green, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: `${C.green}06` }}>
                        <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: C.green, marginRight: 3, verticalAlign: 'middle' }} />{count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* World Cup cross-link */}
            <div onClick={() => { playFx('nav'); navigate('/worldcup') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', marginTop: 8, background: `linear-gradient(135deg, ${C.gold}08, ${C.green}06)`, border: `1px solid ${C.gold}20`, boxShadow: `0 0 16px ${C.gold}08` }}>
              <span style={{ fontSize: 22 }}>⚽</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>World Cup 2026 Tournament</div>
                <div style={{ fontSize: 8, color: C.text3 }}>Play FK1/FK2/FK3 WC editions, predict matches, win big!</div>
              </div>
              <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', padding: '2px 6px', borderRadius: 4, background: C.gold }}>WC</span>
            </div>
          </div>
        )}

        {/* Tournaments tab */}
        {tab === 'tournaments' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TOURNAMENTS.map((t, i) => (
                <div key={i} onClick={() => playFx('select')} style={{ padding: '10px 10px', borderRadius: 12, cursor: 'pointer', background: `radial-gradient(ellipse at 30% 20%, ${t.color}10, ${C.bg2} 70%)`, border: `1px solid ${t.color}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    <div style={{ padding: '1px 5px', borderRadius: 3, background: t.status === 'LIVE' ? `${C.red}18` : `${C.green}12`, border: `1px solid ${t.status === 'LIVE' ? C.red : C.green}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {t.status === 'LIVE' && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.red, animation: 'pulse 1.5s infinite' }} />}
                        <span style={{ fontSize: 6, fontWeight: 900, color: t.status === 'LIVE' ? C.red : C.green }}>{t.status}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.text, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 7, color: C.text3, marginBottom: 3 }}>{t.game} · {t.players} entered</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.gold }}>🎁 {t.prize}</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>{t.round}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <div style={{ marginBottom: 14, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.cyan}10`, background: `${C.cyan}03` }}>
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{a.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.text2, lineHeight: 1.3 }}>{a.text}</div>
                </div>
                <span style={{ fontSize: 8, color: C.text3, flexShrink: 0, fontFamily: 'monospace' }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats tab */}
        {tab === 'stats' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { val: MY_STATS.gamesPlayed, label: 'Games Played', color: C.cyan },
                { val: `${MY_STATS.winRate}%`, label: 'Win Rate', color: C.green },
                { val: MY_STATS.coinsWon.toLocaleString(), label: 'Coins Won', color: C.gold },
                { val: `🔥 ${MY_STATS.streak}`, label: 'Win Streak', color: C.orange },
              ].map((s, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 12, background: `${s.color}06`, border: `1px solid ${s.color}12`, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: C.text3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: `${C.text3}06`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{PLAY_GAMES[0].emoji}</span>
                <div>
                  <div style={{ fontSize: 8, color: C.text3 }}>Favorite Game</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{PLAY_GAMES[0].name}</div>
                </div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: `${C.text3}06`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🏅</span>
                <div>
                  <div style={{ fontSize: 8, color: C.text3 }}>Best Record</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{MY_STATS.bestRecord}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {selectedGame && (
      <GameDetailSheet
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        zoneRoute="/arcade"
      />
    )}
    </>
  )
}
