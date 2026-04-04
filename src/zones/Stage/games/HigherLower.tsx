import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

type Phase = 'playing' | 'correct' | 'wrong' | 'result'

interface Stat { topic: string; value: number; display: string }

const HL_STATS: Stat[] = [
  { topic: 'Monthly Google searches for "cannabis"', value: 4500000, display: '4.5M' },
  { topic: 'Average price of 1g flower in California', value: 12, display: '$12' },
  { topic: 'Number of legal dispensaries in the US', value: 14000, display: '14,000' },
  { topic: 'Instagram posts tagged #420', value: 28000000, display: '28M' },
  { topic: 'Average blinker duration (seconds)', value: 5.2, display: '5.2s' },
  { topic: 'THC % in average dispensary flower', value: 22, display: '22%' },
  { topic: "Snoop Dogg's age", value: 54, display: '54' },
  { topic: 'Minutes in a FIFA match', value: 90, display: '90' },
  { topic: 'States with legal recreational cannabis', value: 24, display: '24' },
  { topic: 'Price of a Storz & Bickel Volcano ($)', value: 479, display: '$479' },
  { topic: 'Daily active TikTok users (millions)', value: 1500, display: '1.5B' },
  { topic: 'Cannabis strains on Leafly', value: 5800, display: '5,800' },
  { topic: 'Average dispensary transaction ($)', value: 55, display: '$55' },
  { topic: 'Super Bowl viewers (millions)', value: 123, display: '123M' },
  { topic: 'Amsterdam coffee shops', value: 166, display: '166' },
  { topic: 'Songs on Spotify (millions)', value: 100, display: '100M' },
  { topic: 'World Cup 2026 host cities', value: 16, display: '16' },
  { topic: 'mg of THC in a standard edible', value: 10, display: '10mg' },
  { topic: 'Average joint contains (grams)', value: 0.5, display: '0.5g' },
  { topic: 'Rolling papers in a RAW pack', value: 32, display: '32' },
]

export default function HigherLower() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('playing')
  const [current, setCurrent] = useState<Stat | null>(null)
  const [next, setNext] = useState<Stat | null>(null)
  const [revealNum, setRevealNum] = useState(0)
  const [revealing, setRevealing] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [commentary, setCommentary] = useState('')

  const phaseRef = useRef<Phase>('playing')
  const revealingRef = useRef(false)
  const streakRef = useRef(0)
  const bestStreakRef = useRef(0)
  const scoreRef = useRef(0)
  const roundRef = useRef(1)
  const usedRef = useRef<number[]>([])
  const puffStartRef = useRef<number | null>(null)
  const nextRef = useRef<Stat | null>(null)
  const currentRef = useRef<Stat | null>(null)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { revealingRef.current = revealing }, [revealing])
  useEffect(() => { streakRef.current = streak }, [streak])
  useEffect(() => { bestStreakRef.current = bestStreak }, [bestStreak])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { nextRef.current = next }, [next])
  useEffect(() => { currentRef.current = current }, [current])

  const pickRandom = useCallback((): Stat => {
    const available = HL_STATS.filter((_, i) => !usedRef.current.includes(i))
    if (available.length === 0) { usedRef.current = []; return HL_STATS[Math.floor(Math.random() * HL_STATS.length)] }
    const pk = available[Math.floor(Math.random() * available.length)]
    usedRef.current = [...usedRef.current, HL_STATS.indexOf(pk)]
    return pk
  }, [])

  const doGuess = useCallback((guess: 'higher' | 'lower') => {
    if (phaseRef.current !== 'playing' || revealingRef.current || !nextRef.current || !currentRef.current) return
    setRevealing(true); revealingRef.current = true
    puffStartRef.current = null
    playFx('tap')
    const target = nextRef.current.value
    let step = 0
    const rid = setInterval(() => {
      step++
      setRevealNum(Math.round(target * (1 - Math.pow(1 - step / 20, 3))))
      if (step >= 20) {
        clearInterval(rid)
        setRevealNum(target)
        const actual = nextRef.current!.value > currentRef.current!.value ? 'higher' : nextRef.current!.value < currentRef.current!.value ? 'lower' : guess
        const correct = guess === actual || nextRef.current!.value === currentRef.current!.value
        setTimeout(() => {
          if (correct) {
            const ns = streakRef.current + 1
            const pts = 10 * ns
            setStreak(ns); streakRef.current = ns
            setBestStreak(b => { const nb = Math.max(b, ns); bestStreakRef.current = nb; return nb })
            setScore(s => { const ns2 = s + pts; scoreRef.current = ns2; return ns2 })
            setCommentary(`CORRECT! +${pts}`)
            playFx('select')
            setPhase('correct'); phaseRef.current = 'correct'
          } else {
            setStreak(0); streakRef.current = 0
            setCommentary(`WRONG! It was ${actual.toUpperCase()}`)
            playFx('lose')
            setPhase('wrong'); phaseRef.current = 'wrong'
          }
          setTimeout(() => {
            const nr = roundRef.current + 1
            if (nr > 10) {
              setPhase('result'); phaseRef.current = 'result'
              setCommentary(`Game over! Score: ${scoreRef.current}`)
              awardGame({ won: bestStreakRef.current >= 3, baseCoins: bestStreakRef.current >= 3 ? 50 : 8, baseXP: bestStreakRef.current >= 3 ? 20 : 8 })
            } else {
              setRound(nr); roundRef.current = nr
              const f = currentRef.current!
              setCurrent(nextRef.current!); currentRef.current = nextRef.current!
              const nxt = pickRandom()
              setNext(nxt); nextRef.current = nxt
              setRevealing(false); revealingRef.current = false
              setRevealNum(0)
              setPhase('playing'); phaseRef.current = 'playing'
              setCommentary(`Round ${nr}/10`)
            }
          }, 1800)
        }, 600)
      }
    }, 40)
  }, [playFx, awardGame, pickRandom])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'playing' || revealingRef.current) return
    puffStartRef.current = Date.now()
  }, [])

  const handlePuffUp = useCallback(() => {
    if (!puffStartRef.current || phaseRef.current !== 'playing' || revealingRef.current) return
    const dur = Date.now() - puffStartRef.current
    puffStartRef.current = null
    if (dur < 1500) doGuess('higher')
    else doGuess('lower')
  }, [doGuess])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    usedRef.current = []
    const f = pickRandom(); const s = pickRandom()
    setCurrent(f); currentRef.current = f
    setNext(s); nextRef.current = s
    setStreak(0); streakRef.current = 0
    setBestStreak(0); bestStreakRef.current = 0
    setScore(0); scoreRef.current = 0
    setRound(1); roundRef.current = 1
    setRevealing(false); revealingRef.current = false
    setRevealNum(0)
    setPhase('playing'); phaseRef.current = 'playing'
    setCommentary('Higher or Lower?')
    playFx('crowd')
  }, [pickRandom, playFx])

  useEffect(() => { startGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPlaying = phase === 'playing'
  const isResult = phase === 'result'
  const se = streak >= 5 ? '🔥' : streak >= 3 ? '⭐' : ''

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #060a18 0%, #0a1030 40%, #060a18 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/stage')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 16px 20px', gap: 12, maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📊 HIGHER OR LOWER</div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.cyan }}>{score}</div><div style={{ fontSize: 8, color: C.text3 }}>SCORE</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.text2 }}>{Math.min(round, 10)}/10</div><div style={{ fontSize: 8, color: C.text3 }}>ROUND</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 900, color: streak >= 5 ? C.red : streak >= 3 ? C.gold : C.text2 }}>x{streak}{se}</div><div style={{ fontSize: 8, color: C.text3 }}>STREAK</div></div>
        </div>

        {/* Streak bar */}
        <div style={{ width: '90%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, streak * 10)}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold}${streak >= 5 ? `, ${C.red}` : ''})`, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {!isResult && current && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 6 }}>CURRENT VALUE</div>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 8 }}>{current.topic}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.cyan, textAlign: 'center' }}>{current.display}</div>
          </div>
        )}

        {!isResult && next && (
          <div style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(255,215,0,0.05)', border: `1px solid ${phase === 'correct' ? C.green + '40' : phase === 'wrong' ? C.red + '40' : 'rgba(255,215,0,0.15)'}` }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 6 }}>IS THIS HIGHER OR LOWER?</div>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 8 }}>{next.topic}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: phase === 'correct' ? C.green : phase === 'wrong' ? C.red : C.gold, textAlign: 'center' }}>
              {revealing ? revealNum.toLocaleString() : '???'}
            </div>
          </div>
        )}

        {isPlaying && !revealing && (
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <div
              data-btn="true"
              onClick={() => doGuess('higher')}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 900, color: C.green }}
            >
              ⬆ HIGHER
            </div>
            <div
              data-btn="true"
              onClick={() => doGuess('lower')}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 14, fontWeight: 900, color: C.red }}
            >
              ⬇ LOWER
            </div>
          </div>
        )}

        {isPlaying && !revealing && (
          <div style={{ fontSize: 10, color: C.text3, textAlign: 'center' }}>Short puff = HIGHER · Long puff = LOWER</div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{bestStreak >= 7 ? '🏆' : bestStreak >= 5 ? '🔥' : bestStreak >= 3 ? '⭐' : '📊'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: score >= 100 ? C.gold : C.cyan, marginBottom: 4 }}>GAME OVER</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Score: {score}</div>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>Best Streak: {bestStreak} {bestStreak >= 5 ? '🔥' : ''}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/stage') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center' }}>{commentary}</div>
      </div>
    </div>
  )
}
