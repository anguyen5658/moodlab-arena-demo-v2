import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const CB_PREDICTIONS = [
  { q: "Will Bitcoin hit $100K this month?", cat: "crypto", emoji: "🪙" },
  { q: "Will a new cannabis strain go viral on TikTok this week?", cat: "cannabis", emoji: "🌿" },
  { q: "Will Brazil win their next World Cup match?", cat: "sports", emoji: "⚽" },
  { q: "Will Snoop Dogg drop a surprise album this year?", cat: "culture", emoji: "🎤" },
  { q: "Will THC prices drop below $5/g in Colorado?", cat: "cannabis", emoji: "💰" },
  { q: "Will the next FIFA game outsell the last one?", cat: "gaming", emoji: "🎮" },
  { q: "Will a meme coin 10x this month?", cat: "crypto", emoji: "🚀" },
  { q: "Will indica outsell sativa this quarter?", cat: "cannabis", emoji: "🌿" },
  { q: "Will Argentina make it to the WC final?", cat: "sports", emoji: "🇦🇷" },
  { q: "Will AI replace more than 10% of jobs this year?", cat: "culture", emoji: "🤖" },
  { q: "Will edibles become legal in 3 more states?", cat: "cannabis", emoji: "🍫" },
  { q: "Will the next Super Bowl break viewership records?", cat: "sports", emoji: "🏈" },
  { q: "Will Drake drop a collab with a cannabis brand?", cat: "culture", emoji: "🎵" },
  { q: "Will Ethereum flip Bitcoin in market cap?", cat: "crypto", emoji: "💎" },
  { q: "Will the MLS become a top 5 global league?", cat: "sports", emoji: "⚽" },
]

type Phase = 'intro' | 'question' | 'reveal' | 'result' | 'complete'
type Answer = 'yes' | 'no' | 'certain'

export default function CrystalBall() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [question, setQuestion] = useState(CB_PREDICTIONS[0])
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [puffing, setPuffing] = useState(false)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [used, setUsed] = useState<string[]>([])
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState(false)

  const puffStart = useRef(0)

  const spawnConfetti = (count = 30) => {
    const colors = [C.gold, '#9333EA', C.green, C.cyan, '#F97316']
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

  const triggerFlash = () => {
    setScreenFlash(true)
    setTimeout(() => setScreenFlash(false), 400)
  }

  const pickQuestion = (usedList: string[]) => {
    let q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)]
    if (usedList.length < CB_PREDICTIONS.length) {
      while (usedList.includes(q.q)) {
        q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)]
      }
    }
    return q
  }

  const startGame = useCallback(() => {
    const q = CB_PREDICTIONS[Math.floor(Math.random() * CB_PREDICTIONS.length)]
    setUsed([q.q])
    setQuestion(q)
    setAnswer(null)
    setResult(null)
    setRound(0)
    setScore(0)
    setStreak(0)
    setPuffing(false)
    setCommentary('The Crystal Ball awaits your predictions...')
    setPhase('intro')
    playFx('crowd')
    setTimeout(() => setPhase('question'), 1500)
  }, [playFx])

  const nextRound = useCallback((currentRound: number, currentScore: number, currentStreak: number) => {
    const next = currentRound + 1
    if (next >= 5) {
      setPhase('complete')
      awardGame({ won: currentScore > 0, baseCoins: currentScore > 0 ? 20 : 0, baseXP: currentScore > 0 ? 20 : 8 })
      return
    }
    setUsed(u => {
      const q = pickQuestion(u)
      setQuestion(q)
      return [...u, q.q]
    })
    setAnswer(null)
    setResult(null)
    setRound(next)
    setPhase('question')
  }, [awardGame])

  const handlePuffDown = useCallback(() => {
    if (phase !== 'question') return
    setPuffing(true)
    puffStart.current = Date.now()
  }, [phase])

  const handlePuffUp = useCallback(() => {
    if (!puffing) return
    const dur = (Date.now() - puffStart.current) / 1000
    setPuffing(false)
    let ans: Answer
    if (dur >= 3.0) {
      ans = 'certain'
      setCommentary('BLINKER! ABSOLUTELY CERTAIN! 3x if right, -2x if wrong!')
    } else if (dur >= 1.5) {
      ans = 'yes'
      setCommentary('You predict YES!')
    } else {
      ans = 'no'
      setCommentary('You predict NO!')
    }
    setAnswer(ans)
    setPhase('reveal')
    playFx('whistle')
    triggerFlash()

    setTimeout(() => {
      const correct = Math.random() > 0.45
      let newScore = score
      let newStreak = streak

      if (correct) {
        const pts = ans === 'certain' ? 150 : 50
        newScore = score + pts
        newStreak = streak + 1
        setScore(newScore)
        setStreak(newStreak)
        playFx('crowd')
        spawnConfetti(30)
        setCommentary(ans === 'certain' ? 'BLINKER BONUS! 3x COINS! The Fortune pays out big!' : 'Correct! The Crystal Ball confirms your vision!')
      } else {
        const penalty = ans === 'certain' ? -100 : 0
        newScore = score + penalty
        newStreak = 0
        setScore(newScore)
        setStreak(0)
        setCommentary(ans === 'certain' ? 'The Blinker backfired! -2x penalty!' : 'The Crystal Ball says otherwise...')
      }
      setResult(correct ? 'correct' : 'wrong')
      setPhase('result')

      setTimeout(() => nextRound(round, newScore, newStreak), 2500)
    }, 2000)
  }, [puffing, score, streak, round, playFx, nextRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  useEffect(() => {
    startGame()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isQ = phase === 'question'
  const isR = phase === 'reveal'
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
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0520 0%, #1a0838 30%, #0d0625 60%, #06031a 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(147,51,234,0.15), transparent 60%)', pointerEvents: 'none' }} />

      {/* Particles */}
      {[...Array(15)].map((_, i) => (
        <div key={'cbp' + i} style={{ position: 'absolute', left: `${(i * 19 + 7) % 100}%`, top: `${(i * 23 + 5) % 100}%`, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: i % 2 ? '#9333EA' : '#FFD700', opacity: 0.15, animation: `pulse ${2 + i % 3}s infinite ${i * 0.2}s`, pointerEvents: 'none' }} />
      ))}

      {/* Screen flash */}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', background: 'rgba(147,51,234,0.3)', animation: 'flashOverlay 0.4s ease forwards' }} />}

      {/* Confetti */}
      {confetti.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={() => navigate('/fortune')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, flex: 1, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg, #9333EA, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CRYSTAL BALL</div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: '#F97316' }}>{streak}🔥</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{round + 1}/5</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 12, animation: 'gentleFloat 2s infinite', filter: 'drop-shadow(0 0 20px rgba(147,51,234,0.6))' }}>🔮</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#9333EA', letterSpacing: 3 }}>THE ORACLE AWAITS</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Short puff = NO | Long puff = YES | Blinker = CERTAIN (3x/−2x)</div>
          </div>
        )}

        {/* Question */}
        {isQ && (
          <div style={{ textAlign: 'center', width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: puffing ? 'countPulse 0.5s infinite' : 'gentleFloat 2s infinite', filter: puffing ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' : 'drop-shadow(0 0 15px rgba(147,51,234,0.5))' }}>🔮</div>
            <div style={{ padding: '2px 10px', borderRadius: 6, background: 'rgba(147,51,234,0.12)', display: 'inline-block', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#9333EA' }}>{question.cat.toUpperCase()} {question.emoji}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.4, maxWidth: 300, margin: '0 auto', marginBottom: 16 }}>{question.q}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>NO</div><div style={{ fontSize: 8, color: C.text3 }}>Short (&lt;1.5s)</div></div>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>YES</div><div style={{ fontSize: 8, color: C.text3 }}>Long (&gt;1.5s)</div></div>
              <div style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.25)' }}><div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>CERTAIN</div><div style={{ fontSize: 8, color: C.text3 }}>Blinker (&gt;3s)</div></div>
            </div>
            {puffing && <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, animation: 'pulse 0.5s infinite' }}>CHANNELING... hold for YES or Blinker! 🔮</div>}
            {!puffing && <div style={{ fontSize: 11, color: C.text3 }}>PUFF FOR PREDICTION 🔮</div>}
          </div>
        )}

        {/* Reveal */}
        {isR && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 12, animation: 'countPulse 0.8s infinite', filter: 'drop-shadow(0 0 25px rgba(147,51,234,0.7))' }}>🔮</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: answer === 'certain' ? C.gold : answer === 'yes' ? C.green : C.red, marginBottom: 4 }}>
              {answer === 'certain' ? 'ABSOLUTELY CERTAIN!' : answer === 'yes' ? 'YES' : 'NO'}
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>The Crystal Ball is revealing...</div>
          </div>
        )}

        {/* Result */}
        {isRes && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{result === 'correct' ? '✅' : '❌'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: result === 'correct' ? C.green : C.red, marginBottom: 4 }}>{result === 'correct' ? 'CORRECT!' : 'WRONG!'}</div>
            {result === 'correct' && answer === 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, marginBottom: 4 }}>BLINKER BONUS! 3x coins! +150</div>}
            {result === 'correct' && answer !== 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 4 }}>+50 coins!</div>}
            {result === 'wrong' && answer === 'certain' && <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 4 }}>Blinker penalty! -100 coins</div>}
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginBottom: 12 }}>{commentary}</div>
          </div>
        )}

        {/* Complete */}
        {isComp && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔮</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginBottom: 4 }}>ORACLE SESSION COMPLETE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 13, color: '#F97316' }}>Best Streak: {streak} 🔥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginTop: 8 }}>+{Math.max(0, score)} coins earned</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.30)', fontSize: 13, fontWeight: 800, color: '#9333EA' }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/fortune') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
