import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const BD_SONGS = [
  { name: "Neon Rise", buildTime: 8000, fakeAt: null, color: "#FF69B4" },
  { name: "Phantom Drop", buildTime: 12000, fakeAt: 6000, color: "#A855F7" },
  { name: "Chaos Theory", buildTime: null as null | number, color: "#FF4D8D" },
]

type Phase = 'intro' | 'building' | 'dropped' | 'round_result' | 'final'

export default function BeatDrop() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [building, setBuilding] = useState(false)
  const [dropped, setDropped] = useState(false)
  const [holding, setHolding] = useState(false)
  const [holdStart, setHoldStart] = useState(0)
  const [dropTime, setDropTime] = useState(0)
  const [beatIntensity, setBeatIntensity] = useState(0)
  const [roundLabel, setRoundLabel] = useState('')
  const [fakeDropped, setFakeDropped] = useState(false)
  const [roundScores, setRoundScores] = useState<{ round: number; pts: number; label: string }[]>([])
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const buildInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const releasedRef = useRef(false)
  const droppedRef = useRef(false)
  const dropTimeRef = useRef(0)
  const holdStartRef = useRef(0)
  const holdingRef = useRef(false)
  const phaseRef = useRef<Phase>('intro')
  const roundRef = useRef(0)
  const scoreRef = useRef(0)
  const activeRef = useRef(true)
  const bdAudioCtx = useRef<AudioContext | null>(null)
  const bdOscillator = useRef<OscillatorNode | null>(null)
  const bdGainNode = useRef<GainNode | null>(null)

  const spawnConfetti = (count = 40) => {
    const colors = [C.pink, C.purple, C.gold, C.cyan]
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, x: Math.random() * 100, y: Math.random() * 40,
      size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2000)
  }

  const triggerFlash = (type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }
  const triggerShake = () => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }

  const stopAudio = () => {
    try {
      if (bdOscillator.current) { bdOscillator.current.stop(); bdOscillator.current.disconnect(); bdOscillator.current = null }
      if (bdGainNode.current) { bdGainNode.current.disconnect(); bdGainNode.current = null }
      if (bdAudioCtx.current) { bdAudioCtx.current.close(); bdAudioCtx.current = null }
    } catch (_) {}
  }

  const playBuildAudio = (duration: number) => {
    stopAudio()
    try {
      const ac = new AudioContext()
      bdAudioCtx.current = ac
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + duration / 1000)
      gain.gain.setValueAtTime(0.05, ac.currentTime)
      gain.gain.linearRampToValueAtTime(0.15, ac.currentTime + duration / 1000)
      osc.connect(gain); gain.connect(ac.destination); osc.start()
      bdOscillator.current = osc; bdGainNode.current = gain
    } catch (_) {}
  }

  const scoreRound = useCallback((rnum: number, releaseT: number | null, dropT: number | null) => {
    let pts = 0
    let label = ''
    const holdDuration = holdStartRef.current > 0 ? ((releaseT || Date.now()) - holdStartRef.current) : 0
    const isBlinker = holdDuration >= 5000

    if (!releaseT || !dropT) {
      if (!dropT && releaseT) { pts = 0; label = 'EARLY -- Too soon!' }
      else { pts = 10; label = "LATE -- The party's over bro" }
    } else {
      const diff = Math.abs(releaseT - dropT) / 1000
      if (diff <= 0.2) { pts = 100; label = 'PERFECT -- ON THE BEAT!'; playFx('goal'); triggerFlash('goal'); spawnConfetti(40) }
      else if (diff <= 0.5) { pts = 75; label = 'GREAT'; playFx('select') }
      else if (diff <= 1.0) { pts = 50; label = 'GOOD'; playFx('select') }
      else if (releaseT > dropT) { pts = 10; label = "LATE -- The party's over bro"; playFx('miss') }
      else { pts = 0; label = 'EARLY -- Too soon!'; playFx('tap') }
    }
    if (isBlinker && pts >= 50) { pts += 50; label += ' + BLINKER LEGENDARY!'; playFx('crowd') }

    setRoundLabel(label)
    phaseRef.current = 'round_result'
    setPhase('round_result')
    const newScore = scoreRef.current + pts
    setScore(newScore)
    scoreRef.current = newScore
    setRoundScores(prev => [...prev, { round: rnum + 1, pts, label }])

    setTimeout(() => {
      if (!activeRef.current) return
      if (rnum < 2) {
        startRound(rnum + 1)
      } else {
        phaseRef.current = 'final'
        setPhase('final')
        const baseCoins = newScore >= 200 ? 60 : 10
        awardGame({ won: newScore >= 200, baseCoins, baseXP: newScore >= 200 ? 20 : 8 })
        if (newScore >= 250) { spawnConfetti(60); playFx('win') }
        else playFx('select')
      }
    }, 2500)
  }, [playFx, awardGame])

  const startRound = useCallback((roundNum: number) => {
    if (!activeRef.current) return
    const song = BD_SONGS[roundNum]
    const buildTime = song.buildTime || (5000 + Math.random() * 10000)
    setRound(roundNum)
    roundRef.current = roundNum
    setBuilding(true)
    setDropped(false)
    droppedRef.current = false
    setHolding(false)
    holdingRef.current = false
    setHoldStart(0)
    holdStartRef.current = 0
    setDropTime(0)
    dropTimeRef.current = 0
    releasedRef.current = false
    setBeatIntensity(0)
    setRoundLabel('')
    setFakeDropped(false)
    phaseRef.current = 'building'
    setPhase('building')
    playFx('beat_buildup')
    playBuildAudio(buildTime)

    const startT = Date.now()
    buildInterval.current = setInterval(() => {
      if (!activeRef.current) return
      const elapsed = Date.now() - startT
      setBeatIntensity(Math.min(elapsed / buildTime, 1))
    }, 50)

    if (song.fakeAt) {
      setTimeout(() => {
        if (!activeRef.current) return
        setFakeDropped(true)
        triggerShake()
        setTimeout(() => { if (activeRef.current) setFakeDropped(false) }, 800)
      }, song.fakeAt)
    }

    dropTimer.current = setTimeout(() => {
      if (!activeRef.current) return
      if (buildInterval.current) { clearInterval(buildInterval.current); buildInterval.current = null }
      stopAudio()
      setBuilding(false)
      setDropped(true)
      droppedRef.current = true
      const dt = Date.now()
      setDropTime(dt)
      dropTimeRef.current = dt
      setBeatIntensity(1)
      phaseRef.current = 'dropped'
      setPhase('dropped')
      playFx('beat_drop')
      triggerFlash('goal')
      triggerShake()

      setTimeout(() => {
        if (!activeRef.current) return
        if (!releasedRef.current) {
          scoreRound(roundRef.current, null, dt)
        }
      }, 4000)
    }, buildTime)
  }, [playFx, scoreRound])

  const handlePuffDown = useCallback(() => {
    if (phaseRef.current !== 'building' && phaseRef.current !== 'dropped') return
    if (holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    const hs = Date.now()
    setHoldStart(hs)
    holdStartRef.current = hs
  }, [])

  const handlePuffUp = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    const releaseT = Date.now()
    releasedRef.current = true
    if (!droppedRef.current) {
      setRoundLabel('EARLY')
      playFx('tap')
      scoreRound(roundRef.current, releaseT, null)
    } else {
      scoreRound(roundRef.current, releaseT, dropTimeRef.current)
    }
  }, [playFx, scoreRound])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    activeRef.current = true
    setRound(0)
    setScore(0)
    scoreRef.current = 0
    setRoundScores([])
    phaseRef.current = 'intro'
    setPhase('intro')
    playFx('crowd')
    setTimeout(() => { if (activeRef.current) startRound(0) }, 2000)
  }, [playFx, startRound])

  useEffect(() => {
    startGame()
    return () => {
      activeRef.current = false
      if (buildInterval.current) clearInterval(buildInterval.current)
      if (dropTimer.current) clearTimeout(dropTimer.current)
      stopAudio()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const song = BD_SONGS[round] || BD_SONGS[0]
  const holdTime = holding && holdStart > 0 ? (Date.now() - holdStart) / 1000 : 0
  const isIntro = phase === 'intro'
  const isBuilding = phase === 'building'
  const isDropped = phase === 'dropped'
  const isRoundResult = phase === 'round_result'
  const isFinal = phase === 'final'

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0525 0%, #2d0a3e 25%, #1a0030 50%, #0d0020 75%, #050510 100%)' }} />
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 300 + beatIntensity * 200, height: 300 + beatIntensity * 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.pink}${Math.floor(beatIntensity * 25).toString(16).padStart(2, '0')} 0%, ${C.purple}${Math.floor(beatIntensity * 15).toString(16).padStart(2, '0')} 40%, transparent 70%)`, pointerEvents: 'none', transition: 'all 0.1s', opacity: isDropped ? 1 : beatIntensity }} />
      {fakeDropped && <div style={{ position: 'absolute', inset: 0, background: `${C.purple}30`, zIndex: 2, pointerEvents: 'none' }} />}
      {isDropped && <div style={{ position: 'absolute', inset: 0, background: `${C.pink}20`, zIndex: 2, pointerEvents: 'none' }} />}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, background: screenFlash === 'goal' ? `${C.gold}25` : `${C.red}20`, zIndex: 99, pointerEvents: 'none' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { activeRef.current = false; navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 380, padding: '60px 20px 30px', flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.pink, letterSpacing: 3, marginBottom: 4 }}>BEAT DROP</div>
        <div style={{ fontSize: 10, color: C.text3, marginBottom: 16 }}>Song {round + 1}/3: {song.name}</div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.text3 }}>SCORE</div><div style={{ fontSize: 24, fontWeight: 900, color: C.gold }}>{score}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: C.text3 }}>ROUND</div><div style={{ fontSize: 24, fontWeight: 900, color: C.pink }}>{round + 1}/3</div></div>
        </div>

        {/* Waveform */}
        {(isBuilding || isDropped) && (
          <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, marginBottom: 20 }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const h = isDropped ? 80 + Math.random() * 40 : (10 + beatIntensity * 80 * (0.5 + 0.5 * Math.sin(i * 0.8)))
              return <div key={i} style={{ width: 8, borderRadius: 4, height: h, background: isDropped ? C.gold : `hsl(${300 + i * 3}, 80%, ${50 + beatIntensity * 30}%)`, opacity: 0.6 + beatIntensity * 0.4 }} />
            })}
          </div>
        )}

        {isBuilding && !fakeDropped && (
          <div style={{ textAlign: 'center', marginBottom: 16, animation: 'pulse 1s infinite' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: beatIntensity > 0.8 ? C.gold : C.purple }}>
              {beatIntensity > 0.9 ? 'ALMOST...' : beatIntensity > 0.6 ? 'BUILDING...' : 'Wait for it...'}
            </div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>Hold your puff... release ON the drop</div>
          </div>
        )}

        {fakeDropped && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.purple, animation: 'shake 0.3s ease' }}>PSYCH!</div>
            <div style={{ fontSize: 11, color: C.text2 }}>That was a FAKE drop! Keep holding!</div>
          </div>
        )}

        {isDropped && (
          <div style={{ textAlign: 'center', marginBottom: 16, animation: 'pulse 0.3s ease' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, textShadow: `0 0 30px ${C.gold}80` }}>DROP!</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.pink }}>RELEASE NOW!</div>
          </div>
        )}

        {holding && (
          <div style={{ width: '80%', height: 12, borderRadius: 6, background: `${C.text3}15`, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 6, width: Math.min(100, holdTime * 20) + '%', background: holdTime >= 5 ? `linear-gradient(90deg, ${C.gold}, ${C.red})` : `linear-gradient(90deg, ${C.pink}, ${C.purple})` }} />
          </div>
        )}
        {holding && <div style={{ fontSize: 10, color: C.pink, marginBottom: 8 }}>Holding... {holdTime.toFixed(1)}s {holdTime >= 5 ? 'BLINKER!' : ''}</div>}

        {isIntro && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎧</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>BEAT DROP</div>
            <div style={{ fontSize: 12, color: C.text2, maxWidth: 260, lineHeight: 1.5 }}>Hold your puff during the build-up. Release exactly when the beat drops. 3 songs, 3 chances.</div>
          </div>
        )}

        {isRoundResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: roundLabel.includes('PERFECT') ? C.gold : roundLabel.includes('GREAT') ? C.green : roundLabel.includes('EARLY') ? C.red : C.text2 }}>{roundLabel}</div>
            <div style={{ fontSize: 14, color: C.text2, marginTop: 8 }}>+{roundScores[roundScores.length - 1]?.pts || 0} pts</div>
          </div>
        )}

        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.gold, marginBottom: 8 }}>SHOW COMPLETE!</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.pink, marginBottom: 12 }}>{score}</div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 16 }}>Total Score</div>
            {roundScores.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 20px', marginBottom: 4, borderRadius: 8, background: `${C.pink}08` }}>
                <span style={{ fontSize: 11, color: C.text2 }}>Song {r.round}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: r.pts >= 100 ? C.gold : r.pts >= 50 ? C.green : C.text3 }}>+{r.pts}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 13, fontWeight: 800, color: C.pink }}>🎧 Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {(isBuilding || isDropped) && !holding && (
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.text3, animation: 'pulse 2s infinite' }}>Hold anywhere to puff</div>
          </div>
        )}
      </div>
    </div>
  )
}
