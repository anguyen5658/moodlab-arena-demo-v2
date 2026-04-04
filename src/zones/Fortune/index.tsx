import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { C } from '@/constants/theme'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'

const FORTUNE_GAMES = [
  { id: 'crystalball',   name: 'Fortune Teller',  emoji: '🔮', type: 'Predict',   color: C.purple, desc: 'Yes or No? Puff your prediction!',        cat: 'sportsbook', route: '/fortune/crystalball' },
  { id: 'strainbattle',  name: 'Strain Battle',   emoji: '🌿', type: 'Predict',   color: C.green,  desc: 'Which strain wins? Vote by puff!',         cat: 'sportsbook', route: '/fortune/strainbattle' },
  { id: 'matchpredictor',name: 'Match Predictor', emoji: '📊', type: 'Predict',   color: C.blue,   desc: 'Predict WC match results!',                cat: 'sportsbook', route: '/fortune/matchpredictor' },
  { id: 'dailypicks',    name: 'Daily Bets',      emoji: '📅', type: 'Streak',    color: C.orange, desc: '3 bets per day. Build your streak!',        cat: 'sportsbook', route: '/fortune/dailypicks' },
  { id: 'spinwin',       name: 'Spin & Win',      emoji: '🎡', type: 'Luck',      color: C.pink,   desc: 'Spin the wheel! Puff = spin force!',        cat: 'luck',       route: '/stage/spinwin' },
  { id: 'puffslots',     name: 'Puff Slots',      emoji: '🎰', type: 'Luck',      color: C.gold,   desc: '3 reels. Puff to spin. Blinker = bonus!',   cat: 'luck',       route: '/fortune/puffslots' },
  { id: 'coinflip',      name: 'Coin Flip',       emoji: '🪙', type: '50/50',     color: C.gold,   desc: 'Puff confidence = bet multiplier!',         cat: 'luck',       route: '/fortune/coinflip' },
  { id: 'puffblackjack', name: 'Puff Blackjack',  emoji: '🃏', type: 'Cards',     color: C.green,  desc: 'Short = Hit. Long = Stand. Beat 21!',       cat: 'table',      route: '/fortune/puffblackjack' },
  { id: 'crapsnclouds',  name: 'Craps & Clouds',  emoji: '🎲', type: 'Dice',      color: C.cyan,   desc: 'Puff duration = dice roll!',                cat: 'table',      route: '/fortune/crapsnclouds' },
  { id: 'mysterybox',    name: 'Mystery Box',     emoji: '🎁', type: 'Discovery', color: C.gold,   desc: '3 boxes. Pick one. Puff to reveal!',        cat: 'mystery',    route: '/fortune/mysterybox' },
  { id: 'scratchpuff',   name: 'Scratch & Puff',  emoji: '🎫', type: 'Discovery', color: C.pink,   desc: '6 areas. Puff to scratch. Match 3 wins!',   cat: 'mystery',    route: '/fortune/scratchpuff' },
  { id: 'fortunecookie', name: 'Fortune Cookie',  emoji: '🥠', type: 'Fortune',   color: C.orange, desc: 'Crack it open! Wisdom + coins inside!',      cat: 'mystery',    route: '/fortune/fortunecookie' },
  { id: 'treasuremap',   name: 'Treasure Map',    emoji: '🗺️', type: 'Adventure', color: C.gold,   desc: '16 tiles. Find 3 treasures. Avoid bombs!',  cat: 'mystery',    route: '/fortune/treasuremap' },
  { id: 'puffderby',     name: 'Puff Derby',      emoji: '🏇', type: 'Racing',    color: C.green,  desc: 'Pick a horse. Spam puff = speed!',          cat: 'bets',       route: '/arcade/puffderby' },
]

const FORTUNE_TABS = [
  { id: 'sportsbook', label: 'Sportsbook', emoji: '🔮' },
  { id: 'luck',       label: 'Luck',       emoji: '🎰' },
  { id: 'table',      label: 'Table',      emoji: '🃏' },
  { id: 'mystery',    label: 'Mystery',    emoji: '✨' },
  { id: 'recent',     label: 'Recent',     emoji: '📜' },
]

const RECENT_BETS = [
  { q: 'Brazil vs Germany',     ans: 'Brazil',         result: 'correct', coins: '+100', time: '2h ago' },
  { q: 'Gorilla Glue vs Blue',  ans: 'Gorilla Glue',   result: 'correct', coins: '+50',  time: '5h ago' },
  { q: 'FK1 WC Winner',         ans: 'MoodLab FC',     result: 'pending', coins: '--',   time: '1d ago' },
  { q: 'Coin Flip',             ans: 'Heads',          result: 'wrong',   coins: '-25',  time: '1d ago' },
  { q: 'Puff Blackjack',        ans: '20 vs Dealer 18', result: 'correct', coins: '+200', time: '2d ago' },
]

const FORTUNE_FEED = [
  '🔮 CloudChaser predicted Brazil correctly!',
  '🎰 PuffQueen hit JACKPOT on Slots! +1,000',
  '🌿 Gorilla Glue won Strain Battle 52%-48%',
  '🪙 Coin Flip streak: THC_Tony at 7 in a row!',
  '🃏 BlinkerBetty hit Blackjack! Natural 21!',
]

const FORTUNE_JACKPOT = 47382

export default function FortuneZone() {
  const navigate = useNavigate()
  const { playFx } = useArena()
  const [tab, setTab] = useState('sportsbook')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const heroSlides = [
    { emoji: '🏆', title: `Daily Jackpot: ${FORTUNE_JACKPOT.toLocaleString()}`, sub: 'Play any game to grow the pot!', color: C.gold, badge: 'LIVE' },
    { emoji: '🔮', title: 'Fortune Teller', sub: '15 yes/no predictions. Blinker = 3x risk!', color: C.purple, badge: 'HOT' },
    { emoji: '🍀', title: 'Lucky Hour', sub: 'Coming soon...', color: C.lime, badge: '' },
    { emoji: '🎰', title: 'Puff Slots', sub: 'Puff to spin. Blinker = bonus!', color: C.gold, badge: 'PLAY' },
  ]
  const slideIdx = Math.floor(tick / 4) % heroSlides.length
  const slide = heroSlides[slideIdx]
  const feedIdx = Math.floor(tick / 3) % FORTUNE_FEED.length

  const gamesForTab = FORTUNE_GAMES.filter(g => g.cat === tab)
  const isHot = (badge: string) => badge === 'LIVE' || badge === 'HOT'

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, position: 'relative' }}>
      {/* Gold particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(i * 13 + 5) % 100}%`, top: `${(i * 27 + 8) % 300}px`, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: i % 3 === 0 ? C.gold : i % 3 === 1 ? C.green : C.red, opacity: 0.15, animation: `pulse ${2 + i % 3}s infinite ${i * 0.25}s`, pointerEvents: 'none', zIndex: 0 }} />
      ))}
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 320, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: 'none' }} />

      <ZoneHeader zoneId="oracle" />

      {/* Hero slider */}
      <div onClick={() => { playFx('select'); navigate('/fortune/crystalball') }} style={{ padding: '0 14px', marginBottom: 10, cursor: 'pointer', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '14px 16px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                {slide.badge && (
                  <span style={{ fontSize: 6, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: isHot(slide.badge) ? `${C.red}18` : `${C.green}12`, color: isHot(slide.badge) ? C.red : C.green, border: `1px solid ${isHot(slide.badge) ? C.red : C.green}25` }}>{slide.badge}</span>
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

      {/* Daily jackpot banner */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}10, ${C.red}08)`, border: `1px solid ${C.gold}18`, cursor: 'pointer' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.text3, letterSpacing: 2 }}>DAILY JACKPOT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, textShadow: `0 0 16px ${C.gold}40` }}>🏆 {FORTUNE_JACKPOT.toLocaleString()} coins</div>
          <div style={{ fontSize: 7, color: C.text3 }}>Play any game for a chance to win</div>
        </div>
      </div>

      {/* Fortune feed bar */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{FORTUNE_FEED[feedIdx]}</span>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: '0 14px', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { val: '284', label: 'Bets Made', color: C.gold },
            { val: '62%', label: 'Win Rate', color: C.green },
            { val: '🔥5', label: 'Streak', color: C.orange },
            { val: `${Math.floor(FORTUNE_JACKPOT / 1000)}K`, label: 'Jackpot Pool', color: C.red },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center', background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily bets strip */}
      <div style={{ padding: '0 14px', marginBottom: 10, position: 'relative', zIndex: 1 }}>
        <div onClick={() => { playFx('select'); navigate('/fortune/dailypicks') }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}04`, border: `1px solid ${C.gold}12` }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>3 DAILY BETS</span>
            <span style={{ fontSize: 8, color: C.text3, marginLeft: 6 }}>🌅 🌤 🌙</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: C.green, padding: '2px 8px', borderRadius: 100, background: `${C.green}10`, border: `1px solid ${C.green}20` }}>🔥 5-day · 2x</span>
        </div>
      </div>

      <div style={{ padding: '0 14px', position: 'relative', zIndex: 1 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.gold}18`, marginBottom: 10 }}>
          {FORTUNE_TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer', fontSize: 9, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? C.gold : C.text3, borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent' }}>
              <span style={{ marginRight: 3 }}>{t.emoji}</span>{t.label}
            </div>
          ))}
        </div>

        {/* Game grid (sportsbook/luck/table/mystery/bets tabs) */}
        {tab !== 'recent' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {(tab === 'bets' ? FORTUNE_GAMES.filter(g => g.cat === 'bets') : gamesForTab).map((g, i) => (
              <div key={g.id} onClick={() => { playFx('select'); navigate(g.route) }} style={{ padding: '14px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18`, transition: 'all 0.3s', animation: `fadeIn 0.3s ease ${i * 0.06}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: g.color }}>{g.name}</div>
                <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{g.desc}</div>
                <div style={{ fontSize: 7, fontWeight: 700, color: C.lime, marginTop: 3 }}>PLAY NOW</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent tab */}
        {tab === 'recent' && (
          <div style={{ marginBottom: 14, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.gold}10` }}>
            {RECENT_BETS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < RECENT_BETS.length - 1 ? `1px solid ${C.border}` : 'none', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>{b.result === 'correct' ? '✅' : b.result === 'wrong' ? '❌' : '⏳'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.q}</div>
                  <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>→ {b.ans}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: b.result === 'correct' ? C.green : b.result === 'wrong' ? C.red : C.text3 }}>{b.coins}</div>
                  <div style={{ fontSize: 7, color: C.text3 }}>{b.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
