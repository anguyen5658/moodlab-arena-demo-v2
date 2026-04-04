import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PL_TARGETS = [2.5, 3.0, 3.5, 3.8, 4.0, 4.2, 4.5]
const PL_NAMES = ["CloudChaser99","BlinkerBetty","THC_Tony","VapeLord69","DabQueen","PuffDaddy_Jr","SmokeRing_Steve","HazeDaze","KushKing","FogMachine","MistWalker","NebulaNick","GreenGoblin","SkyHighSam","TokeToken","LitLenny","BubbleBoi","RipTide","SeshGremlin","GlassHouse"]

type Phase = 'intro' | 'ready' | 'puffing' | 'result' | 'eliminated' | 'champion' | 'final'

export default function PuffLimbo() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [target, setTarget] = useState(PL_TARGETS[0])
  const [players, setPlayers] = useState(20)
  const [puffTime, setPuffTime] = useState(0)
  const [holding, setHolding] = useState(false)
  const [roundResults, setRoundResults] = useState<{ round: number; target: number; time: number; survived: boolean }[]>([])
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const puffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStart = useRef(0)
  const holdingRef = useRef(false)
  const phaseRef = useRef<Phase>('intro')
  const roundRef = useRef(0)
  const playersRef = useRef(20)
  const activeRef = useRef(true)

  const spawnConfetti = (count = 50) => {
    const colors = [C.gold, C.orange, C.red, C.pink]
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, x: Math.random() * 100, y: Math.random() * 40,
      size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2500)
  }

  const triggerFlash = (type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }
  const triggerShake = () => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }

  const startRound = useCallback((roundNum: number, numPlayers: number) => {
    if (!activeRef.current) return
    const t = PL_TARGETS[roundNum]
    setRound(roundNum)
    roundRef.current = roundNum
    setTarget(t)
    setPuffTime(0)
    setHolding(false)
    holdingRef.current = false
    phaseRef.current = 'ready'
    setPhase('ready')
    const dangerMsg = t >= 4.5 ? ' -- you can feel the blinker calling your name' : t >= 4.0 ? ' -- getting serious now' : ''
    setCommentary(`Round ${roundNum + 1}: Hold for ${t.toFixed(1)}s${dangerMsg}`)
  }, [])

  const startGame = useCallback(() => {
    activeRef.current = true
    setRound(0)
    roundRef.current = 0
    setTarget(PL_TARGETS[0])
    setPlayers(20)
    playersRef.current = 20
    setPuffTime(0)
    setHolding(false)
    holdingRef.current = false
    setRoundResults([])
    phaseRef.current = 'intro'
    setPhase('intro')
    setCommentary('Welcome to PUFF LIMBO! Can you survive the blinker threshold?')
    playFx('crowd')
    setTimeout(() => { if (activeRef.current) startRound(0, 20) }, 2500)
  }, [playFx, startRound])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'ready') return
    if (holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    setPuffTime(0)
    holdStart.current = Date.now()
    phaseRef.current = 'puffing'
    setPhase('puffing')
    puffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - holdStart.current) / 1000
      setPuffTime(elapsed)
      if (elapsed >= 6.0) handlePuffUp()
    }, 50)
  }, [])

  const handlePuffUp = useCallback(() => {
    if (!holdingRef.current && phaseRef.current !== 'puffing') return
    if (puffInterval.current) { clearInterval(puffInterval.current); puffInterval.current = null }
    holdingRef.current = false
    setHolding(false)
    const elapsed = (Date.now() - holdStart.current) / 1000
    setPuffTime(elapsed)
    if (!activeRef.current) return

    const currentRound = roundRef.current
    const t = PL_TARGETS[currentRound]
    const survived = elapsed >= t
    const isBlinker = elapsed >= 5.0
    const currentPlayers = playersRef.current
    const failChance = t >= 4.5 ? 0.5 : t >= 4.0 ? 0.35 : 0.2
    let eliminatedCount = 0
    for (let i = 0; i < currentPlayers - 1; i++) { if (Math.random() < failChance) eliminatedCount++ }
    const newPlayers = Math.max(1, currentPlayers - eliminatedCount - (survived ? 0 : 1))
    const newEliminated = []
    for (let i = 0; i < eliminatedCount; i++) newEliminated.push(PL_NAMES[Math.floor(Math.random() * PL_NAMES.length)])

    const updatedPlayers = survived ? newPlayers + 1 : newPlayers
    setPlayers(updatedPlayers)
    playersRef.current = updatedPlayers

    if (!survived) {
      phaseRef.current = 'eliminated'
      setPhase('eliminated')
      setCommentary(`ELIMINATED at ${elapsed.toFixed(2)}s! Needed ${t.toFixed(1)}s`)
      playFx('tap')
      triggerShake()
    } else {
      phaseRef.current = 'result'
      setPhase('result')
      setRoundResults(prev => [...prev, { round: currentRound + 1, target: t, time: elapsed, survived: true }])
      if (isBlinker) {
        setCommentary(`BLINKER HOLD! ${elapsed.toFixed(2)}s -- ABSOLUTE LEGEND!`)
        playFx('goal'); triggerFlash('goal'); spawnConfetti(50)
      } else {
        setCommentary(`SURVIVED! ${elapsed.toFixed(2)}s (needed ${t.toFixed(1)}s)`)
        playFx('select')
      }
    }

    setTimeout(() => {
      if (!activeRef.current) return
      if (!survived) {
        const baseCoins = 12
        awardGame({ won: false, baseCoins, baseXP: 8 })
        phaseRef.current = 'final'
        setPhase('final')
        setCommentary(`Puff Limbo over! Made it to round ${currentRound + 1} -- +${baseCoins} coins`)
      } else if (currentRound >= 6) {
        phaseRef.current = 'champion'
        setPhase('champion')
        awardGame({ won: true, baseCoins: 80, baseXP: 20 })
        setCommentary('PUFF LIMBO CHAMPION! Survived the 5.0s BLINKER round! +80 coins!')
        spawnConfetti(80)
        playFx('win')
        setTimeout(() => { if (activeRef.current) { phaseRef.current = 'final'; setPhase('final') } }, 3000)
      } else {
        startRound(currentRound + 1, updatedPlayers)
      }
    }, 2500)
  }, [playFx, awardGame, startRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  useEffect(() => {
    startGame()
    return () => {
      activeRef.current = false
      if (puffInterval.current) clearInterval(puffInterval.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dangerZone = target >= 4.5
  const extremeDanger = target >= 4.7
  const targetPct = target / 5.5 * 100
  const puffPct = Math.min(puffTime / 5.5 * 100, 100)
  const isIntro = phase === 'intro'
  const isReady = phase === 'ready'
  const isPuffing = phase === 'puffing'
  const isResult = phase === 'result'
  const isEliminated = phase === 'eliminated'
  const isChampion = phase === 'champion'
  const isFinal = phase === 'final'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: dangerZone ? 'linear-gradient(180deg, #2a0a00 0%, #3d1500 25%, #2a0800 50%, #1a0500 75%, #0a0200 100%)' : 'linear-gradient(180deg, #1a0a00 0%, #2d1200 25%, #1a0800 50%, #0d0400 75%, #050200 100%)' }} />
      {dangerZone && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 60%, ${C.red}15, transparent 60%)`, pointerEvents: 'none', animation: 'pulse 1s infinite' }} />}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, background: screenFlash === 'goal' ? `${C.gold}25` : `${C.red}20`, zIndex: 99, pointerEvents: 'none' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { activeRef.current = false; navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 380, padding: '60px 20px 30px', flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.orange, letterSpacing: 3, marginBottom: 4 }}>PUFF LIMBO</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.text3 }}>ROUND</div><div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>{round + 1}/7</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.text3 }}>TARGET</div><div style={{ fontSize: 18, fontWeight: 900, color: dangerZone ? C.red : C.gold }}>{target.toFixed(1)}s</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.text3 }}>PLAYERS</div><div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{players}</div></div>
        </div>

        {/* Limbo bar visualization */}
        {(isReady || isPuffing || isResult || isEliminated) && (
          <div style={{ width: '100%', height: 200, position: 'relative', marginBottom: 20, border: `1px solid ${C.orange}15`, borderRadius: 16, overflow: 'hidden', background: `${C.orange}04` }}>
            {/* Target line */}
            <div style={{ position: 'absolute', bottom: targetPct + '%', left: 0, right: 0, height: 3, background: dangerZone ? `linear-gradient(90deg, ${C.red}, ${C.orange}, ${C.red})` : C.orange, boxShadow: `0 0 10px ${dangerZone ? C.red : C.orange}60`, zIndex: 2 }}>
              <div style={{ position: 'absolute', right: 8, top: -14, fontSize: 9, fontWeight: 800, color: dangerZone ? C.red : C.orange }}>{target.toFixed(1)}s</div>
            </div>
            {dangerZone && <div style={{ position: 'absolute', bottom: targetPct + '%', left: 0, right: 0, top: 0, background: `${C.red}08` }} />}
            {/* Blinker line at 5.0s */}
            <div style={{ position: 'absolute', bottom: (5.0 / 5.5 * 100) + '%', left: 0, right: 0, height: 2, background: `${C.red}40`, borderTop: `1px dashed ${C.red}50` }}>
              <div style={{ position: 'absolute', right: 8, top: -14, fontSize: 8, fontWeight: 800, color: C.red }}>BLINKER 5.0s</div>
            </div>
            {/* Puff bar */}
            <div style={{ position: 'absolute', bottom: 0, left: '35%', width: '30%', height: puffPct + '%', borderRadius: '8px 8px 0 0', transition: isPuffing ? 'height 0.05s' : 'height 0.3s', background: puffTime >= 5 ? `linear-gradient(180deg, ${C.red}, ${C.orange})` : puffTime >= target ? `linear-gradient(180deg, ${C.green}, ${C.gold})` : `linear-gradient(180deg, ${C.orange}, ${C.gold})`, boxShadow: puffTime >= target ? `0 0 20px ${C.green}40` : puffTime >= 4.5 ? `0 0 20px ${C.red}40` : `0 0 10px ${C.orange}20`, zIndex: 3 }}>
              <div style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>{puffTime.toFixed(1)}s</div>
            </div>
          </div>
        )}

        {isIntro && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎪</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>PUFF LIMBO</div>
            <div style={{ fontSize: 12, color: C.text2, maxWidth: 260, lineHeight: 1.5 }}>Each round the target gets longer. Hold your puff to survive. Can you make it to the BLINKER round?</div>
            <div style={{ fontSize: 11, color: C.orange, marginTop: 12 }}>20 players entering...</div>
          </div>
        )}

        {isReady && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: dangerZone ? C.red : C.orange, marginBottom: 4 }}>
              {extremeDanger ? 'DANGER ZONE!' : dangerZone ? 'Getting Dangerous...' : `Round ${round + 1}`}
            </div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>Hold for at least {target.toFixed(1)} seconds</div>
            {dangerZone && <div style={{ fontSize: 11, color: C.red, fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
              {target >= 4.7 ? 'The blinker is RIGHT THERE...' : 'You can feel the blinker calling your name'}
            </div>}
            <div style={{ fontSize: 12, color: C.text3, marginTop: 12, animation: 'pulse 2s infinite' }}>Hold anywhere to puff</div>
          </div>
        )}

        {isPuffing && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: puffTime >= target ? C.green : puffTime >= 4.5 ? C.red : C.orange }}>{puffTime.toFixed(1)}s</div>
            <div style={{ fontSize: 11, color: puffTime >= target ? C.green : C.text2, marginTop: 4 }}>
              {puffTime >= 5 ? 'BLINKER TERRITORY!' : puffTime >= target ? 'TARGET REACHED! Release anytime' : 'Keep holding...'}
            </div>
          </div>
        )}

        {isResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginBottom: 4 }}>SURVIVED!</div>
            <div style={{ fontSize: 14, color: C.text2 }}>{puffTime.toFixed(2)}s (needed {target.toFixed(1)}s)</div>
            {puffTime >= 5 && <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, marginTop: 8, animation: 'pulse 0.5s infinite' }}>BLINKER HOLD!</div>}
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>Next round loading...</div>
          </div>
        )}

        {isEliminated && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💀</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.red, marginBottom: 4 }}>ELIMINATED!</div>
            <div style={{ fontSize: 14, color: C.text2 }}>{puffTime.toFixed(2)}s -- needed {target.toFixed(1)}s</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>So close...</div>
          </div>
        )}

        {isChampion && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, textShadow: `0 0 30px ${C.gold}60`, marginBottom: 8 }}>PUFF LIMBO CHAMPION!</div>
            <div style={{ fontSize: 14, color: C.text2 }}>You survived the 5.0s BLINKER round!</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginTop: 8 }}>+150 coins!</div>
          </div>
        )}

        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', width: '100%' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: round >= 6 ? C.gold : C.orange, marginBottom: 12 }}>{round >= 6 ? 'CHAMPION!' : 'Game Over'}</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 16 }}>Made it to Round {round + 1} of 7 | {players} players survived</div>
            {roundResults.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 20px', marginBottom: 4, borderRadius: 8, background: `${C.orange}08` }}>
                <span style={{ fontSize: 11, color: C.text2 }}>R{r.round}: {r.target.toFixed(1)}s target</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{r.time.toFixed(2)}s</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>🎪 Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 8 }}>{commentary}</div>
      </div>
    </div>
  )
}
