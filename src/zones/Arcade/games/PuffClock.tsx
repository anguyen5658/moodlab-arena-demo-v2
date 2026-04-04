import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PC_TARGETS = [2.00, 3.50, 1.75, 4.20, 0]
const PC_ROUND_NAMES = ["Round 1: The Warm-Up","Round 2: Getting Tricky","Round 3: Precision Mode","Round 4: THE 4.20 ROUND","Round 5: SURPRISE"]
const PC_COMEDY = [
  "Your internal clock is vibing differently right now",
  "THC messing with your perception of time!",
  "Einstein said time is relative... he was clearly high",
  "Your brain cells are counting in slow motion",
  "That was either 2 seconds or 2 hours, who knows",
  "Time flies when you're having puffs!",
  "Your temporal lobe called in sick today",
  "Somewhere a clock is laughing at you right now",
]
const SPECTATOR_EMOJIS = ["😤","😶‍🌫️","🤤","😎","🥴","😮‍💨","🫠","🤩","😵‍💫","🥳","😈","👽","🤖","👻","💀","🫡","🧿","🦊","🐸","🌚"]

type Phase = 'intro' | 'target' | 'puffing' | 'reveal' | 'result'

type RoundResult = { round: number; target: number; actual: number; error: number }
type LbEntry = { name: string; emoji: string; totalError: number; rank: number }

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export default function PuffClock() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame, setCoins } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [target, setTarget] = useState(0)
  const [round, setRound] = useState(0)
  const [puffTime, setPuffTime] = useState(0)
  const [holding, setHolding] = useState(false)
  const [results, setResults] = useState<RoundResult[]>([])
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([])
  const [comment, setComment] = useState('')
  const [perfect420, setPerfect420] = useState(false)
  const [commentary, setCommentary] = useState('')

  const pcPuffStart = useRef(0)
  const pcPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundRef = useRef(0)
  const targetRef = useRef(0)
  const holdingRef = useRef(false)
  const resultsRef = useRef<RoundResult[]>([])
  const phaseRef = useRef<Phase>('intro')
  const activeRef = useRef(true)

  const stopInterval = () => {
    if (pcPuffInterval.current) { clearInterval(pcPuffInterval.current); pcPuffInterval.current = null }
  }

  const showFinalResults = useCallback((finalResults: RoundResult[], lb: LbEntry[]) => {
    setPhase('result')
    phaseRef.current = 'result'
    const totalError = finalResults.reduce((s, r) => s + r.error, 0)
    const avgError = finalResults.length > 0 ? totalError / finalResults.length : 0
    const rank = lb.find(p => p.name === 'You')
    const c =
      avgError <= 0.15 ? "CHRONOMASTER! Your timing is INHUMAN!" :
      avgError <= 0.30 ? "Impressive precision! Your internal clock is solid." :
      avgError <= 0.60 ? "Not bad! THC only slightly warped your time perception." :
      "Your sense of time is... unique. Very unique."
    setComment(c)
    setCommentary(`Final rank: #${rank ? rank.rank : '?'} | Avg error: ${avgError.toFixed(2)}s`)
    playFx('crowd')
    if (rank && rank.rank <= 3) {
      awardGame({ won: true, baseCoins: 80, baseXP: 20 })
    } else {
      awardGame({ won: avgError <= 0.50, baseCoins: avgError <= 0.50 ? 30 : 10, baseXP: avgError <= 0.50 ? 20 : 8 })
    }
  }, [playFx, awardGame])

  const startRound = useCallback((roundNum: number, prevResults: RoundResult[], lb: LbEntry[]) => {
    if (roundNum >= 5) {
      showFinalResults(prevResults, lb)
      return
    }
    let t = PC_TARGETS[roundNum]
    if (t === 0) t = +(1.0 + Math.random() * 3.5).toFixed(2)
    targetRef.current = t
    roundRef.current = roundNum
    setTarget(t)
    setRound(roundNum + 1)
    setPuffTime(0)
    setHolding(false)
    holdingRef.current = false
    setComment(PC_ROUND_NAMES[roundNum])
    setPhase('target')
    phaseRef.current = 'target'
    setCommentary(`Target: ${t.toFixed(2)} seconds!`)
    setTimeout(() => {
      if (!activeRef.current) return
      setPhase('puffing')
      phaseRef.current = 'puffing'
      setComment(`PUFF NOW! Hold for ${t.toFixed(2)}s!`)
    }, 3000)
  }, [showFinalResults])

  const stopPuff = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    stopInterval()
    const elapsed = +(((Date.now() - pcPuffStart.current) / 1000)).toFixed(2)
    const clamped = Math.min(elapsed, 6.0)
    setPuffTime(clamped)
    const t = targetRef.current
    const error = +(Math.abs(clamped - t)).toFixed(2)
    const roundResult: RoundResult = { round: roundRef.current + 1, target: t, actual: clamped, error }
    const newResults = [...resultsRef.current, roundResult]
    resultsRef.current = newResults
    setResults(newResults)

    let perfect = false
    if (t === 4.20 && error <= 0.15) {
      perfect = true
      setPerfect420(true)
      setCoins((c: number) => c + 420)
      playFx('crowd')
      playFx('achievement')
    }

    setPhase('reveal')
    phaseRef.current = 'reveal'

    const errorComment =
      error <= 0.15 ? "PERFECT! Are you a robot?!" :
      error <= 0.30 ? "Not bad! Your internal clock is pretty solid." :
      error <= 0.50 ? `Decent! ${pick(PC_COMEDY)}` :
      error <= 1.0 ? `Off by ${error.toFixed(2)}s... ${pick(PC_COMEDY)}` :
      `You puffed ${clamped.toFixed(2)}s... target was ${t.toFixed(2)}s. Are you even trying?!`

    setComment(perfect ? "4.20 PERFECTION! LEGENDARY!" : errorComment)
    setCommentary(`You: ${clamped.toFixed(2)}s | Target: ${t.toFixed(2)}s | Error: ${error.toFixed(2)}s`)

    // update leaderboard
    setLeaderboard(prev => {
      const totalErr = newResults.reduce((s, r) => s + r.error, 0)
      const updated = prev.filter(p => p.name !== 'You')
      updated.push({ name: 'You', emoji: '🌟', totalError: +totalErr.toFixed(2), rank: 0 })
      updated.sort((a, b) => a.totalError - b.totalError)
      updated.forEach((p, i) => { p.rank = i + 1 })
      const newLb = updated.slice(0, 10)
      // schedule next round with updated lb
      setTimeout(() => {
        if (!activeRef.current) return
        startRound(roundRef.current + 1, newResults, newLb)
      }, 3500)
      return newLb
    })
  }, [playFx, setCoins, startRound])

  const startPuff = useCallback(() => {
    if (holdingRef.current || phaseRef.current !== 'puffing') return
    holdingRef.current = true
    setHolding(true)
    pcPuffStart.current = Date.now()
    setPuffTime(0)
    playFx('clock_tick_precise')
    if (pcPuffInterval.current) clearInterval(pcPuffInterval.current)
    pcPuffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - pcPuffStart.current) / 1000
      setPuffTime(elapsed)
      if (elapsed >= 6.0) stopPuff()
    }, 50)
  }, [playFx, stopPuff])

  useEffect(() => {
    registerPuffHandlers(startPuff, stopPuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, startPuff, stopPuff])

  useEffect(() => {
    activeRef.current = true
    resultsRef.current = []
    playFx('crowd')
    setCommentary('Puff Clock! Precision is everything!')
    const names = ["CloudTimer","PrecisionPuff","4.20_King","NanoSecond","TimeWarp","ChronoBlaze","ClockMaster","TickTock420"]
    const lb: LbEntry[] = names.map((n, i) => ({
      name: n,
      emoji: SPECTATOR_EMOJIS[i % SPECTATOR_EMOJIS.length],
      totalError: +(Math.random() * 2 + 0.1).toFixed(2),
      rank: i + 1,
    }))
    lb.sort((a, b) => a.totalError - b.totalError)
    lb.forEach((p, i) => { p.rank = i + 1 })
    setLeaderboard(lb)

    setComment('Puff for EXACTLY the target time!')
    setTimeout(() => {
      if (!activeRef.current) return
      setComment('Closest to the target wins!')
      setTimeout(() => {
        if (!activeRef.current) return
        startRound(0, [], lb)
      }, 1500)
    }, 500)

    return () => {
      activeRef.current = false
      stopInterval()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const puffPct = Math.min((puffTime / 6.0) * 100, 100)
  const targetPct = (target / 6.0) * 100

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', background: 'rgba(0,5,20,0.97)', display: 'flex', flexDirection: 'column' }}>
      <div data-back="true" onClick={() => { activeRef.current = false; stopInterval(); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, paddingTop: 56 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: 2, textTransform: 'uppercase' }}>⏱️ PUFF CLOCK ⏱️</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Round {round}/5 {perfect420 ? '| 🌟 4.20 ACHIEVED!' : ''}</div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.cyan }}>{comment}</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 8 }}>5 rounds of precision puffing</div>
          </div>
        )}

        {/* Target display */}
        {phase === 'target' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>{comment}</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>TARGET TIME:</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: target === 4.20 ? C.gold : C.cyan, fontFamily: 'monospace', textShadow: `0 0 30px ${target === 4.20 ? C.gold : C.cyan}60` }}>
              {target.toFixed(2)}s
            </div>
            {target === 4.20 && <div style={{ fontSize: 13, color: C.gold, marginTop: 8, fontWeight: 700 }}>THE SACRED NUMBER! Hit it for 420 coins!</div>}
            <div style={{ fontSize: 11, color: C.text3, marginTop: 12 }}>Get ready to puff...</div>
          </div>
        )}

        {/* Puffing phase */}
        {phase === 'puffing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: C.cyan, marginBottom: 16, fontWeight: 700 }}>{comment}</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: holding ? C.cyan : C.text3, fontFamily: 'monospace', marginBottom: 20, textShadow: holding ? `0 0 20px ${C.cyan}60` : 'none' }}>
              {puffTime.toFixed(2)}s
            </div>
            {/* Timeline bar */}
            <div style={{ width: '100%', maxWidth: 300, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: targetPct + '%', top: 0, bottom: 0, width: 2, background: C.gold, zIndex: 2, boxShadow: `0 0 8px ${C.gold}` }} />
              <div style={{ position: 'absolute', left: (targetPct - 1) + '%', top: -18, fontSize: 9, color: C.gold, fontWeight: 700 }}>TARGET</div>
              <div style={{ height: '100%', width: puffPct + '%', background: `linear-gradient(90deg,${C.cyan}40,${C.cyan})`, borderRadius: 15, transition: holding ? 'none' : 'width 0.1s' }} />
            </div>
            {/* Puff button */}
            <div
              onMouseDown={startPuff} onMouseUp={stopPuff} onMouseLeave={stopPuff}
              onTouchStart={(e) => { e.preventDefault(); startPuff() }} onTouchEnd={(e) => { e.preventDefault(); stopPuff() }}
              style={{ width: 100, height: 100, borderRadius: 50, background: holding ? `radial-gradient(circle,${C.cyan},${C.cyan}40)` : 'rgba(0,229,255,0.08)', border: `2px solid ${holding ? C.cyan : C.cyan + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', transform: holding ? 'scale(1.1)' : 'scale(1)', boxShadow: holding ? `0 0 30px ${C.cyan}40` : 'none' }}
            >
              <div style={{ fontSize: holding ? 28 : 14, fontWeight: 900, color: holding ? '#000' : C.cyan }}>{holding ? '💨' : 'HOLD'}</div>
            </div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 12 }}>{holding ? "Release when you think you've hit the target!" : "Press and HOLD to puff"}</div>
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.text3 }}>YOUR PUFF</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.cyan, fontFamily: 'monospace' }}>{puffTime.toFixed(2)}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.text3 }}>TARGET</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, fontFamily: 'monospace' }}>{target.toFixed(2)}s</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: Math.abs(puffTime - target) <= 0.15 ? C.green : Math.abs(puffTime - target) <= 0.5 ? C.gold : C.red, marginBottom: 8 }}>
              {Math.abs(puffTime - target) <= 0.15 ? '±0.15s PERFECT!' : `±${Math.abs(puffTime - target).toFixed(2)}s off`}
            </div>
            <div style={{ fontSize: 12, color: C.text2, textAlign: 'center', maxWidth: 280, marginBottom: 12 }}>{comment}</div>
            <div style={{ width: '100%', maxWidth: 300, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'visible', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: targetPct + '%', top: -4, bottom: -4, width: 2, background: C.gold, zIndex: 2 }} />
              <div style={{ position: 'absolute', left: puffPct + '%', top: -4, bottom: -4, width: 2, background: C.cyan, zIndex: 2 }} />
            </div>
          </div>
        )}

        {/* Final results */}
        {phase === 'result' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.cyan, marginBottom: 16 }}>FINAL RESULTS</div>
            <div style={{ width: '100%', marginBottom: 16 }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 4, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: C.text3 }}>R{r.round}</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>Target: {r.target.toFixed(2)}s</div>
                  <div style={{ fontSize: 11, color: C.cyan }}>You: {r.actual.toFixed(2)}s</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.error <= 0.15 ? C.green : r.error <= 0.5 ? C.gold : C.red }}>±{r.error.toFixed(2)}s</div>
                </div>
              ))}
            </div>
            <div style={{ width: '100%', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 8 }}>LEADERBOARD</div>
              {leaderboard.slice(0, 8).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderRadius: 6, background: p.name === 'You' ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)', marginBottom: 2, border: p.name === 'You' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent' }}>
                  <div style={{ fontSize: 11, color: p.name === 'You' ? C.cyan : C.text3 }}>#{p.rank} {p.emoji} {p.name}</div>
                  <div style={{ fontSize: 11, color: p.name === 'You' ? C.cyan : C.text3, fontFamily: 'monospace' }}>±{p.totalError.toFixed(2)}s total</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.cyan, marginBottom: 8, textAlign: 'center' }}>{comment}</div>
            {perfect420 && <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginBottom: 8 }}>🌟 4.20 ACHIEVEMENT UNLOCKED! 🌟</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div data-btn="true" onClick={() => { activeRef.current = true; resultsRef.current = []; setResults([]); setPerfect420(false); setPhase('intro'); phaseRef.current = 'intro'; const lb = leaderboard.filter(p => p.name !== 'You'); setLeaderboard(lb); setTimeout(() => { if (activeRef.current) startRound(0, [], lb) }, 500) }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, fontSize: 13, fontWeight: 800, color: C.cyan }}>Play Again</div>
              <div data-btn="true" onClick={() => navigate('/arcade')} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {/* Commentary */}
        <div style={{ textAlign: 'center', fontSize: 11, color: C.text3, fontStyle: 'italic', padding: '8px 0' }}>{commentary}</div>
      </div>
    </div>
  )
}
