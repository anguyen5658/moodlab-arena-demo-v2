import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const TOW_PULL = ["PULL! 💪","Keep going! 🔥","More power! ⚡","HARDER! 😤","HEAVE! 🏋️","Don't stop! 🫁","GRIP IT! 🤜","YANK IT! 💥"]
const TOW_PUFF = ["PUFF HARDER! Your team needs those lungs! 🫁💪","The AI team is struggling... no THC advantage 🌿","The rope is BURNING from friction 🔥","Your lungs are ELITE 🏆","BLINKER PULL incoming! 💀","Crowd is going WILD! 📢"]
const TOW_WIN = ["CHAMPIONS! The crowd goes INSANE! 🏆🎉","They FELL in the MUD! 😂🛁","DOMINANT! Your team is unstoppable! 💪","30 puffs in 10 seconds! Your lungs are ELITE 🏆"]
const TOW_LOSE = ["MUD PIT! Your team took a bath 🛁😂","The AI pulled harder... regroup! 💪","Into the mud you go! 🫠","Almost had it! One more puff! 😤"]

type Phase = 'intro' | 'playing' | 'suddendeath' | 'result'

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const spawnConfetti = (count = 30, colors = [C.cyan, C.gold, C.green]) => {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 100,
    y: Math.random() * 40,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
  }))
}

export default function TugOfWar() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [position, setPosition] = useState(50)
  const [timer, setTimer] = useState(30)
  const [puffs, setPuffs] = useState(0)
  const [aiPuffs, setAiPuffs] = useState(0)
  const [comment, setComment] = useState('')
  const [introStep, setIntroStep] = useState(0)
  const [surge, setSurge] = useState(false)
  const [surgeAvail, setSurgeAvail] = useState(false)
  const [puffIntensity, setPuffIntensity] = useState(0)
  const [dust, setDust] = useState<{ id: number; x: number; y: number; size: number }[]>([])
  const [mudSplash, setMudSplash] = useState(false)
  const [crowdHype, setCrowdHype] = useState(0)
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const posRef = useRef(50)
  const holdRef = useRef(false)
  const phaseRef = useRef<Phase>('intro')
  const surgeRef = useRef(false)
  const surgeAvailRef = useRef(false)
  const puffsRef = useRef(0)
  const timerRef = useRef(30)

  const towInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const towPhysics = useRef<ReturnType<typeof setInterval> | null>(null)
  const towSurgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerFlash = (type: string) => {
    setScreenFlash(type)
    setTimeout(() => setScreenFlash(null), 400)
  }
  const triggerShake = () => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 400)
  }

  const cleanup = useCallback(() => {
    if (towInterval.current) { clearInterval(towInterval.current); towInterval.current = null }
    if (towPhysics.current) { clearInterval(towPhysics.current); towPhysics.current = null }
    if (towSurgeTimer.current) { clearTimeout(towSurgeTimer.current); towSurgeTimer.current = null }
    holdRef.current = false
  }, [])

  const finishMatch = useCallback(() => {
    cleanup()
    const pos = posRef.current
    const won = pos > 50
    const resultPhase: Phase = 'result'
    setPhase(resultPhase)
    phaseRef.current = resultPhase
    if (won) {
      setConfetti(spawnConfetti(40, [C.cyan, C.gold, C.blue, C.green]))
      setTimeout(() => setConfetti([]), 2500)
      playFx('win')
      triggerFlash('goal')
      triggerShake()
      setComment(pick(TOW_WIN))
    } else {
      setMudSplash(true)
      playFx('mud_splash')
      playFx('lose')
      triggerFlash('miss')
      triggerShake()
      setComment(pick(TOW_LOSE))
      setTimeout(() => setMudSplash(false), 2000)
    }
    awardGame({ won, baseCoins: won ? 60 : 10, baseXP: won ? 20 : 8 })
  }, [cleanup, playFx, awardGame])

  const startMatch = useCallback(() => {
    const newPhase: Phase = 'playing'
    setPhase(newPhase)
    phaseRef.current = newPhase
    timerRef.current = 30
    setTimer(30)
    let elapsed = 0
    towInterval.current = setInterval(() => {
      elapsed++
      if (elapsed % 10 === 0 && elapsed < 30) {
        setSurgeAvail(true)
        surgeAvailRef.current = true
        setComment('⚡ SURGE AVAILABLE! Puff NOW for 3x! ⚡')
        playFx('tick')
        if (towSurgeTimer.current) clearTimeout(towSurgeTimer.current)
        towSurgeTimer.current = setTimeout(() => { setSurgeAvail(false); surgeAvailRef.current = false }, 3000)
      }
      timerRef.current -= 1
      setTimer(timerRef.current)
      const newT = timerRef.current
      if (newT <= 5 && newT > 0) playFx('tick')
      if (newT <= 0) {
        if (towInterval.current) { clearInterval(towInterval.current); towInterval.current = null }
        const pos = posRef.current
        if (pos >= 45 && pos <= 55) {
          const sdPhase: Phase = 'suddendeath'
          setPhase(sdPhase)
          phaseRef.current = sdPhase
          timerRef.current = 10
          setTimer(10)
          setComment('SUDDEN DEATH! 10 more seconds! ⚡💀')
          playFx('crowd')
          triggerShake()
          // restart interval for sudden death
          elapsed = 0
          towInterval.current = setInterval(() => {
            timerRef.current -= 1
            setTimer(timerRef.current)
            if (timerRef.current <= 5 && timerRef.current > 0) playFx('tick')
            if (timerRef.current <= 0) {
              if (towInterval.current) { clearInterval(towInterval.current); towInterval.current = null }
              finishMatch()
            }
            const aiStr2 = 0.8 + Math.random() * 1.8
            if (Math.random() < 0.45) {
              posRef.current = Math.max(0, posRef.current - aiStr2)
              setPosition(posRef.current)
              setAiPuffs(a => a + 1)
            }
            setCrowdHype(Math.min(100, Math.abs(posRef.current - 50) * 2))
          }, 1000)
          return
        }
        finishMatch()
        return
      }
      const aiStr = 0.8 + Math.random() * 1.8
      if (Math.random() < 0.45) {
        posRef.current = Math.max(0, posRef.current - aiStr)
        setPosition(posRef.current)
        setAiPuffs(a => a + 1)
        if (Math.random() < 0.15) {
          posRef.current = Math.max(0, posRef.current - 2.5)
          setPosition(posRef.current)
          triggerShake()
          setComment("AI BURST! They're pulling hard! 😤")
        }
      }
      setCrowdHype(Math.min(100, Math.abs(posRef.current - 50) * 2))
    }, 1000)

    towPhysics.current = setInterval(() => {
      if (holdRef.current) {
        const pf = 0.4 + Math.random() * 0.3
        posRef.current = Math.min(100, posRef.current + pf)
        setPosition(posRef.current)
        setPuffIntensity(p => Math.min(100, p + 3))
        if (Math.random() < 0.3) {
          setDust(d => [...d.slice(-12), { id: Date.now() + Math.random(), x: 55 + Math.random() * 20, y: 70 + Math.random() * 10, size: 3 + Math.random() * 5 }])
        }
      } else {
        setPuffIntensity(p => Math.max(0, p - 2))
        if (posRef.current > 50) { posRef.current = Math.max(50, posRef.current - 0.08); setPosition(posRef.current) }
      }
      setDust(d => d.length > 15 ? d.slice(-10) : d)
    }, 50)
  }, [playFx, finishMatch])

  const startGame = useCallback(() => {
    cleanup()
    posRef.current = 50
    timerRef.current = 30
    puffsRef.current = 0
    surgeRef.current = false
    surgeAvailRef.current = false
    setPosition(50)
    setTimer(30)
    setPuffs(0)
    setAiPuffs(0)
    setComment('')
    setIntroStep(0)
    setSurge(false)
    setSurgeAvail(false)
    setPuffIntensity(0)
    setDust([])
    setMudSplash(false)
    setCrowdHype(0)
    setConfetti([])
    setPhase('intro')
    phaseRef.current = 'intro'
    playFx('crowd')
    setComment('TUG OF WAR! Teams entering the arena! 🏟️')
    let step = 0
    const introTimer = setInterval(() => {
      step++
      setIntroStep(step)
      if (step >= 4 && step <= 6) playFx('tick')
      if (step >= 7) {
        clearInterval(introTimer)
        playFx('whistle')
        setComment('PULL! Spam puff to win! 💪🫁')
        startMatch()
      }
    }, 700)
  }, [cleanup, playFx, startMatch])

  const towPuff = useCallback(() => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'suddendeath') return
    const isSudden = phaseRef.current === 'suddendeath'
    const surgeMulti = surgeRef.current ? 3 : 1
    const baseForce = isSudden ? (2 + Math.random() * 2) : (1.5 + Math.random() * 2)
    const force = baseForce * surgeMulti
    posRef.current = Math.min(100, posRef.current + force)
    setPosition(posRef.current)
    puffsRef.current++
    setPuffs(puffsRef.current)
    playFx('rope_pull')
    if (surgeAvailRef.current && !surgeRef.current) {
      surgeRef.current = true
      setSurge(true)
      setSurgeAvail(false)
      surgeAvailRef.current = false
      setComment('🔥 SURGE ACTIVATED! 3x PULL POWER! 🔥')
      playFx('blinker')
      triggerFlash('blinker')
      triggerShake()
      setTimeout(() => { surgeRef.current = false; setSurge(false); setComment('Surge ended!') }, 3000)
    } else if (puffsRef.current > 0 && puffsRef.current % 10 === 0) {
      setComment(pick(TOW_PUFF))
    } else {
      setComment(pick(TOW_PULL))
    }
    setDust(d => [...d.slice(-12), { id: Date.now() + Math.random(), x: 55 + Math.random() * 25, y: 68 + Math.random() * 12, size: 4 + Math.random() * 6 }])
    if (force > 3) triggerShake()
  }, [playFx])

  useEffect(() => {
    registerPuffHandlers(towPuff, null)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, towPuff])

  useEffect(() => {
    startGame()
    return () => cleanup()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const youWinning = position > 50
  const barColor = youWinning ? C.cyan : C.red
  const isPlaying = phase === 'playing' || phase === 'suddendeath'
  const isSuddenDeath = phase === 'suddendeath'
  const timerDanger = timer <= 5

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(180deg, #0a0618 0%, #1a0a2e 25%, #0d1a2f 50%, #0a0a14 100%)',
        animation: screenShake ? 'shake 0.4s ease' : 'none' }}
    >
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}
      <div data-back="true" onClick={() => { cleanup(); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 12, zIndex: 10, flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, color: C.blue, textShadow: `0 0 20px ${C.blue}40` }}>💪 TUG OF WAR</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: C.cyan }}>YOU</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: timerDanger ? C.red : C.gold, background: `${timerDanger ? C.red : C.gold}15`, padding: '2px 10px', borderRadius: 8 }}>{timer}s</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: C.red }}>AI</span>
        </div>
        {isSuddenDeath && <div style={{ fontSize: 12, fontWeight: 900, color: C.red, animation: 'pulse 0.5s infinite' }}>⚡ SUDDEN DEATH!</div>}

        {/* Tug bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${position}%`, background: `linear-gradient(90deg,${C.cyan}40,${C.cyan}20)`, transition: 'width 0.1s', borderRadius: '20px 0 0 20px' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.3)', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: `${position}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: barColor, boxShadow: `0 0 15px ${barColor}80`, transition: 'left 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>💪</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 340 }}>
          <span style={{ fontSize: 8, color: C.cyan }}>← YOUR SIDE</span>
          <span style={{ fontSize: 8, color: C.text3 }}>Position: {Math.round(position)}%</span>
          <span style={{ fontSize: 8, color: C.red }}>AI SIDE →</span>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: C.cyan }}>Your puffs: {puffs}</span>
          <span style={{ fontSize: 10, color: C.red }}>AI puffs: {aiPuffs}</span>
        </div>

        {comment && <div style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}><div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{comment}</div></div>}

        {isPlaying && (
          <div style={{ width: '100%', maxWidth: 300, marginTop: 8 }}>
            {/* puff intensity bar */}
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: puffIntensity + '%', height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${C.cyan},${C.blue})`, transition: 'width 0.05s' }} />
            </div>
            {surgeAvail && <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textAlign: 'center', animation: 'pulse 0.5s infinite', marginBottom: 4 }}>⚡ SURGE AVAILABLE! Puff NOW!</div>}
            {surge && <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textAlign: 'center', animation: 'pulse 0.3s infinite', marginBottom: 4 }}>🔥 3x SURGE ACTIVE!</div>}
            <div
              onClick={towPuff}
              onTouchStart={(e) => { e.preventDefault(); towPuff() }}
              style={{ padding: '20px 0', borderRadius: 16, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.blue}10)`, border: `2px solid ${C.cyan}30`, animation: 'countPulse 0.5s infinite', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>💨 PUFF TO PULL!</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>Spam puff to win!</div>
            </div>
          </div>
        )}

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💪🪢💪</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.blue }}>TUG OF WAR</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 8 }}>Spam puff to pull your team to victory!</div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>{position > 50 ? '🏆' : '😤'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: position > 50 ? C.green : C.red }}>{position > 50 ? 'YOU WIN!' : 'AI WINS!'}</div>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                <span style={{ color: C.text }}>Earned</span>
                <span style={{ color: C.gold }}>+{position > 50 ? 60 : 10} 🪙</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
              <div data-btn="true" onClick={() => startGame()} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.blue}15`, border: `1px solid ${C.blue}30`, fontSize: 13, fontWeight: 800, color: C.blue }}>🔄 Again</div>
              <div data-btn="true" onClick={() => navigate('/arcade')} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done ✓</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
