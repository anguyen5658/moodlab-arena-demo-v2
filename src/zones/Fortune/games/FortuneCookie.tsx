import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const FC_FORTUNES = [
  "Your next blinker will bring unexpected joy",
  "The strain you're smoking right now chose YOU",
  "Someone in this Arena is thinking about your last play",
  "Your puff-to-win ratio is cosmically aligned today",
  "A legendary catch awaits you in HOOKED",
  "The number 420 will appear in your life within 24 hours",
  "Your lungs are your greatest asset. Treat them well",
  "The dealer fears your next hand",
  "Today's high will lead to tomorrow's idea",
  "Your tolerance break starts... eventually",
  "The munchies you're about to get will be LEGENDARY",
  "A friend will ask you for a hit. Share generously",
  "Your next roll will be a natural 7",
  "The universe rewards those who puff with purpose",
  "You will discover a new favorite strain this month",
  "Your smoke circle is about to get an upgrade",
  "The edible will hit exactly when you forgot about it",
  "Your Puff Clock accuracy will improve by 0.1s tomorrow",
  "A winning streak is written in your stars",
  "The best ideas come after the second puff",
  "Your cart will last exactly as long as you need it to",
  "The dab rig is ready when you are",
]

const FC_RARE_FORTUNES = [
  "You are the chosen one. The Arena bows to you",
  "A 1000-coin jackpot is in your near future",
  "Your next 3 games will all be winners",
  "The stars align for a perfect blinker tonight",
]

type Phase = 'intro' | 'holding' | 'reading' | 'result' | 'complete'

export default function FortuneCookie() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [fortune, setFortune] = useState('')
  const [coins, setCoins] = useState(0)
  const [cracking, setCracking] = useState(false)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [golden, setGolden] = useState(false)
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState(false)

  const puffStart = useRef(0)
  const roundRef = useRef(0)
  const scoreRef = useRef(0)

  const spawnConfetti = (count = 30) => {
    const colors = [C.gold, C.orange, C.green, C.cyan]
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2000)
  }

  const nextRound = useCallback((currentRound: number, currentScore: number) => {
    const next = currentRound + 1
    if (next >= 5) {
      setPhase('complete')
      awardGame({ won: currentScore > 0, baseCoins: currentScore > 0 ? 20 : 0, baseXP: currentScore > 0 ? 20 : 8 })
      return
    }
    setRound(next)
    roundRef.current = next
    setFortune('')
    setCoins(0)
    setCracking(false)
    setGolden(false)
    setPhase('holding')
    setCommentary(`Cookie ${next + 1}/5 -- HOLD to crack!`)
  }, [awardGame])

  const startGame = useCallback(() => {
    setFortune('')
    setCoins(0)
    setCracking(false)
    setRound(0)
    roundRef.current = 0
    setScore(0)
    scoreRef.current = 0
    setGolden(false)
    setPhase('intro')
    playFx('crowd')
    setCommentary('Fortune Cookie! HOLD to puff and crack it open!')
    setTimeout(() => setPhase('holding'), 1500)
  }, [playFx])

  const handlePuffDown = useCallback(() => {
    if (phase !== 'holding') return
    puffStart.current = Date.now()
    setCracking(true)
  }, [phase])

  const handlePuffUp = useCallback(() => {
    if (phase !== 'holding' || !puffStart.current) return
    const dur = (Date.now() - puffStart.current) / 1000
    puffStart.current = 0
    setCracking(false)
    if (dur < 0.3) return

    playFx('crack')
    const isBlinker = dur >= 4.5
    setGolden(isBlinker)

    let f: string
    if (isBlinker) {
      f = FC_RARE_FORTUNES[Math.floor(Math.random() * FC_RARE_FORTUNES.length)]
      spawnConfetti(30)
      setScreenFlash(true)
      setTimeout(() => setScreenFlash(false), 400)
      playFx('treasure_find')
      setCommentary('GOLDEN FORTUNE COOKIE! 2x coins!')
    } else {
      f = FC_FORTUNES[Math.floor(Math.random() * FC_FORTUNES.length)]
    }

    const baseCoins = Math.floor(10 + Math.random() * 190)
    const fcWin = isBlinker ? Math.floor(50 + Math.random() * 450) : baseCoins
    setFortune(f)
    setCoins(fcWin)
    const newScore = scoreRef.current + fcWin
    setScore(newScore)
    scoreRef.current = newScore
    setPhase('reading')
    setTimeout(() => setPhase('result'), 3000)
    setTimeout(() => nextRound(roundRef.current, scoreRef.current), 4500)
  }, [phase, playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  useEffect(() => {
    startGame()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isHold = phase === 'holding'
  const isRead = phase === 'reading'
  const isRes = phase === 'result'
  const isComp = phase === 'complete'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a1408 0%, #2a1e0a 40%, #1a1408 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${C.orange}10, transparent 60%)`, pointerEvents: 'none' }} />
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', background: `${C.gold}30`, animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}
      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FORTUNE COOKIE</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>COINS</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>COOKIE</div></div>
        </div>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🥠</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: 3 }}>FORTUNE COOKIE</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>HOLD to puff and crack it open! Blinker = GOLDEN cookie!</div>
          </div>
        )}

        {isHold && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{
              fontSize: cracking ? 80 : 72,
              transition: 'all 0.3s',
              filter: cracking ? `drop-shadow(0 0 30px ${C.orange}80)` : `drop-shadow(0 0 10px ${C.orange}30)`,
              animation: cracking ? 'pulse 0.3s infinite' : 'pulse 3s infinite',
              transform: cracking ? 'rotate(10deg) scale(1.1)' : 'rotate(0)',
            }}>🥠</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.orange, marginTop: 16, animation: 'pulse 1.5s infinite' }}>TAP TO CRACK 🥠</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Longer puff = bigger reveal. Blinker = 2x coins!</div>
          </div>
        )}

        {(isRead || isRes) && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', marginTop: 16, maxWidth: 300 }}>
            <div style={{ fontSize: 48, marginBottom: 12, filter: golden ? `drop-shadow(0 0 20px ${C.gold}80)` : 'none' }}>🥠</div>
            {golden && <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 3, marginBottom: 8, animation: 'pulse 1s infinite' }}>GOLDEN COOKIE!</div>}
            <div style={{ padding: '14px 18px', borderRadius: 14, background: golden ? `${C.gold}10` : `${C.orange}08`, border: `1px solid ${golden ? C.gold : C.orange}20`, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: C.text, fontStyle: 'italic', lineHeight: 1.6 }}>"{fortune}"</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>+{coins} Coins!</div>
          </div>
        )}

        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🥠</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 8 }}>ALL COOKIES CRACKED!</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Total Won: {score} coins</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
