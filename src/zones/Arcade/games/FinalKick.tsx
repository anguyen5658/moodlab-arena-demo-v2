import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const KICK_ZONES = [
  { label: '↖', col: 0, row: 0 }, { label: '⬆', col: 1, row: 0 }, { label: '↗', col: 2, row: 0 },
  { label: '↙', col: 0, row: 1 }, { label: '⬇', col: 1, row: 1 }, { label: '↘', col: 2, row: 1 },
]

const AI_OPPONENTS = [
  { name: 'SmokeBot 3000', emoji: '🤖', taunt: "I don't even need lungs 💨" },
  { name: 'Sir Puffs-a-Lot', emoji: '🧐', taunt: 'Indubitably, I shall save this' },
  { name: 'Goalkeeper Gary', emoji: '🦸', taunt: "These hands don't miss 🧤" },
  { name: 'Cloud Nine', emoji: '☁️', taunt: 'Floating to victory~' },
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

type Phase = 'intro' | 'shoot' | 'power' | 'flight' | 'shoot_result' | 'save_ready' | 'save_countdown' | 'save_dive' | 'save_result' | 'bonus_offer' | 'final'

const getPuffPower = (elapsed: number) => {
  if (elapsed < 0.5) return Math.round(elapsed / 0.5 * 15)
  if (elapsed < 1.5) return Math.round(15 + (elapsed - 0.5) / 1.0 * 25)
  if (elapsed < 2.5) return Math.round(40 + (elapsed - 1.5) / 1.0 * 30)
  if (elapsed < 3.5) return Math.round(70 + (elapsed - 2.5) / 1.0 * 25)
  if (elapsed < 4.5) return Math.round(95 - (elapsed - 3.5) / 1.0 * 20)
  return Math.round(75 - (elapsed - 4.5) / 0.5 * 45)
}

interface Props { isFK2?: boolean }

export default function FinalKick({ isFK2 = false }: Props) {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [kickAim, setKickAim] = useState<number | null>(null)
  const [kickPower, setKickPower] = useState(0)
  const [kickCharging, setKickCharging] = useState(false)
  const [kickAiZone, setKickAiZone] = useState<number | null>(null)
  const [sweetMin, setSweetMin] = useState(55)
  const [sweetMax, setSweetMax] = useState(80)
  const [ballResult, setBallResult] = useState<'goal' | 'saved' | 'missed' | null>(null)
  const [diveZone, setDiveZone] = useState<number | null>(null)
  const [commentary, setCommentary] = useState('')
  const [kickComment, setKickComment] = useState('')
  const [bonusAvail, setBonusAvail] = useState(false)
  const [bonusActive, setBonusActive] = useState(false)
  const [bonusUsed, setBonusUsed] = useState(false)
  const [opponent] = useState(() => pick(AI_OPPONENTS))

  // FK2 state
  const [fk2Phase, setFk2Phase] = useState<'x' | 'y' | null>(null)
  const [fk2X, setFk2X] = useState(0)
  const [fk2XDone, setFk2XDone] = useState(false)

  const phaseRef = useRef<Phase>('intro')
  const kickAimRef = useRef<number | null>(null)
  const kickPowerRef = useRef(0)
  const kickChargingRef = useRef(false)
  const kickAiZoneRef = useRef<number | null>(null)
  const sweetMinRef = useRef(55)
  const sweetMaxRef = useRef(80)
  const roundRef = useRef(0)
  const scoreRef = useRef({ you: 0, ai: 0 })
  const bonusActiveRef = useRef(false)
  const bonusUsedRef = useRef(false)
  const fk2PhaseRef = useRef<'x' | 'y' | null>(null)
  const fk2XRef = useRef(0)
  const fk2XDoneRef = useRef(false)

  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStart = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { kickAimRef.current = kickAim }, [kickAim])
  useEffect(() => { kickPowerRef.current = kickPower }, [kickPower])
  useEffect(() => { kickChargingRef.current = kickCharging }, [kickCharging])
  useEffect(() => { kickAiZoneRef.current = kickAiZone }, [kickAiZone])
  useEffect(() => { sweetMinRef.current = sweetMin }, [sweetMin])
  useEffect(() => { sweetMaxRef.current = sweetMax }, [sweetMax])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { bonusActiveRef.current = bonusActive }, [bonusActive])
  useEffect(() => { bonusUsedRef.current = bonusUsed }, [bonusUsed])
  useEffect(() => { fk2PhaseRef.current = fk2Phase }, [fk2Phase])
  useEffect(() => { fk2XRef.current = fk2X }, [fk2X])
  useEffect(() => { fk2XDoneRef.current = fk2XDone }, [fk2XDone])

  const randomizeSweetSpot = useCallback(() => {
    const holdMin = 1.5 + Math.random() * 0.8
    const window = 1.2 + Math.random() * 0.6
    const holdMax = holdMin + window
    const pMin = Math.max(45, Math.round(40 + (holdMin - 1.5) / 2.0 * 55))
    const pMax = Math.min(96, Math.round(40 + (holdMax - 1.5) / 2.0 * 55))
    setSweetMin(pMin); sweetMinRef.current = pMin
    setSweetMax(pMax); sweetMaxRef.current = pMax
    return { holdMin: holdMin.toFixed(1), holdMax: holdMax.toFixed(1) }
  }, [])

  const advanceRound = useCallback((curRound: number, curScore: { you: number, ai: number }) => {
    const next = curRound + 1
    if (next >= 5) {
      if (!bonusUsedRef.current && Math.random() < 0.5) {
        setBonusAvail(true)
        setPhase('bonus_offer'); phaseRef.current = 'bonus_offer'
        setKickComment('🎰 BONUS SHOT! Double-hold challenge!')
        playFx('whistle')
        return
      }
      setPhase('final'); phaseRef.current = 'final'
      awardGame({ won: curScore.you > curScore.ai, baseCoins: curScore.you > curScore.ai ? 80 : 12, baseXP: curScore.you > curScore.ai ? 20 : 8 })
    } else {
      setRound(next); roundRef.current = next
      const ss = randomizeSweetSpot()
      setKickAim(null); setKickPower(0); setKickAiZone(null); setDiveZone(null); setBallResult(null)
      if (isFK2) {
        setPhase('shoot'); phaseRef.current = 'shoot'
        setFk2Phase('x'); fk2PhaseRef.current = 'x'
        setFk2X(0); fk2XRef.current = 0
        setFk2XDone(false); fk2XDoneRef.current = false
        setKickComment(`Round ${next + 1}! Aim LEFT or RIGHT! ← → 👆`)
      } else {
        setPhase('shoot'); phaseRef.current = 'shoot'
        setKickComment(`Round ${next + 1}! Sweet spot: ${ss.holdMin}-${ss.holdMax}s 🎯`)
      }
    }
  }, [playFx, awardGame, randomizeSweetSpot, isFK2])

  const executeKick = useCallback((zone: number, power: number, wasBlinker: boolean) => {
    const aiSaveZone = Math.floor(Math.random() * 6)
    setKickAiZone(aiSaveZone); kickAiZoneRef.current = aiSaveZone
    setDiveZone(aiSaveZone)
    setPhase('flight'); phaseRef.current = 'flight'
    playFx('kick')

    const inSweet = power >= sweetMinRef.current && power <= sweetMaxRef.current
    const sameZone = zone === aiSaveZone

    let isGoal = false
    let isMissed = false

    if (wasBlinker) {
      isMissed = Math.random() < 0.7
      isGoal = !isMissed
    } else if (inSweet) {
      isMissed = false
      isGoal = !sameZone || Math.random() > 0.5
    } else {
      isMissed = Math.random() < 0.25
      isGoal = false
    }

    const result = isMissed ? 'missed' : isGoal ? 'goal' : 'saved'
    setBallResult(result)

    setTimeout(() => {
      setPhase('shoot_result'); phaseRef.current = 'shoot_result'
      if (result === 'goal') {
        const pts = bonusActiveRef.current ? 2 : 1
        setScore(s => { const ns = { ...s, you: s.you + pts }; scoreRef.current = ns; return ns })
        playFx('win'); playFx('crowd')
        setCommentary('WHAT A GOAL! 🔥')
        setKickComment(inSweet ? 'PERFECT PUFF GOAL! 💨👑' : 'GOLAZOOO! 🔥')
      } else if (result === 'missed') {
        playFx('lose')
        if (wasBlinker) setCommentary('BLINKER! Ball left the planet! 🛸💀')
        else setCommentary('MISSED! Over the bar! 🚀')
        setKickComment(wasBlinker ? 'Puffed too long! Blinker! 💀' : 'Too much power! 😬')
      } else {
        playFx('lose')
        setCommentary('SAVED! Keeper denies it! 🧤')
        setKickComment(!inSweet ? "Sweet spot needed! Find it! 🎯" : 'Keeper read it! 🧤')
      }

      setTimeout(() => {
        setBallResult(null); setDiveZone(null); setKickAim(null)
        if (bonusActiveRef.current) {
          setBonusActive(false); bonusActiveRef.current = false
          setPhase('final'); phaseRef.current = 'final'
          awardGame({ won: scoreRef.current.you > scoreRef.current.ai, baseCoins: scoreRef.current.you > scoreRef.current.ai ? 80 : 12, baseXP: scoreRef.current.you > scoreRef.current.ai ? 20 : 8 })
        } else {
          setPhase('save_ready'); phaseRef.current = 'save_ready'
          setKickComment(`Your turn in goal 🧤 Stop ${opponent.name}!`)
        }
      }, 1800)
    }, 800)
  }, [playFx, awardGame, opponent.name])

  const fk2LockX = useCallback((xPos: number) => {
    setFk2X(xPos); fk2XRef.current = xPos
    setFk2XDone(true); fk2XDoneRef.current = true
    setFk2Phase('y'); fk2PhaseRef.current = 'y'
    setKickPower(0); setKickCharging(false); kickChargingRef.current = false
    const outOfBounds = xPos < 10 || xPos > 90
    if (outOfBounds) setKickComment('WIDE! Too far! 🌊')
    else setKickComment('X locked! Now HOLD for HEIGHT! ↕️ ⚽')
    playFx('select')
  }, [playFx])

  const fk2LockY = useCallback((yPos: number) => {
    setFk2Phase(null); fk2PhaseRef.current = null
    setKickCharging(false); kickChargingRef.current = false
    const col = fk2XRef.current < 33 ? 0 : fk2XRef.current < 67 ? 1 : 2
    const row = yPos > 50 ? 0 : 1
    const zone = row * 3 + col
    const xOutOfBounds = fk2XRef.current < 10 || fk2XRef.current > 90
    const yOutOfBounds = yPos > 95
    const forceMiss = xOutOfBounds || yOutOfBounds
    setKickAim(zone); kickAimRef.current = zone
    const avgPower = Math.round((fk2XRef.current + yPos) / 2)
    const xInSweet = fk2XRef.current >= sweetMinRef.current && fk2XRef.current <= sweetMaxRef.current
    const yInSweet = yPos >= sweetMinRef.current && yPos <= sweetMaxRef.current
    const bothSweet = xInSweet && yInSweet
    if (forceMiss) {
      setPhase('flight'); phaseRef.current = 'flight'
      playFx('kick')
      setBallResult('missed')
      setTimeout(() => {
        setPhase('shoot_result'); phaseRef.current = 'shoot_result'
        setCommentary('WIDE/OVER! Way off target! 😂')
        setTimeout(() => {
          setBallResult(null); setDiveZone(null); setKickAim(null)
          setPhase('save_ready'); phaseRef.current = 'save_ready'
        }, 1800)
      }, 800)
    } else {
      const aiSaveZone = Math.floor(Math.random() * 6)
      setKickAiZone(aiSaveZone); kickAiZoneRef.current = aiSaveZone
      setDiveZone(aiSaveZone)
      setPhase('flight'); phaseRef.current = 'flight'
      playFx('kick')
      const sameZone = zone === aiSaveZone
      const isGoal = bothSweet ? true : sameZone ? Math.random() > 0.5 : true
      setBallResult(isGoal ? 'goal' : 'saved')
      setTimeout(() => {
        setPhase('shoot_result'); phaseRef.current = 'shoot_result'
        if (isGoal) {
          setScore(s => { const ns = { ...s, you: s.you + 1 }; scoreRef.current = ns; return ns })
          playFx('win'); playFx('crowd')
          if (bothSweet) setCommentary('DOUBLE SWEET SPOT! UNSTOPPABLE! 🎯🎯')
          else setCommentary('GOAL! Great placement! ⚽')
        } else {
          playFx('lose')
          setCommentary('SAVED! Keeper in the right spot! 🧤')
        }
        setTimeout(() => {
          setBallResult(null); setDiveZone(null); setKickAim(null)
          setFk2X(0); fk2XRef.current = 0; setFk2XDone(false); fk2XDoneRef.current = false
          if (bonusActiveRef.current) {
            setBonusActive(false); bonusActiveRef.current = false
            setPhase('final'); phaseRef.current = 'final'
            awardGame({ won: scoreRef.current.you > scoreRef.current.ai, baseCoins: scoreRef.current.you > scoreRef.current.ai ? 100 : 15, baseXP: scoreRef.current.you > scoreRef.current.ai ? 20 : 8 })
          } else {
            setPhase('save_ready'); phaseRef.current = 'save_ready'
            setKickComment(`Your turn in goal 🧤 Stop ${opponent.name}!`)
          }
        }, 1800)
      }, 800)
    }
  }, [playFx, awardGame, opponent.name])

  const handlePuffDown = useCallback(() => {
    const p = phaseRef.current
    if (p === 'power' || (isFK2 && (p === 'shoot') && (fk2PhaseRef.current === 'x' || fk2PhaseRef.current === 'y'))) {
      if (kickChargingRef.current) return
      if (p === 'power' && kickAimRef.current === null) return
      setKickCharging(true); kickChargingRef.current = true
      setKickPower(0); kickPowerRef.current = 0
      puffStart.current = Date.now()

      chargeInterval.current = setInterval(() => {
        const elapsed = (Date.now() - puffStart.current) / 1000
        const pwr = Math.max(0, Math.min(100, getPuffPower(elapsed)))
        setKickPower(pwr); kickPowerRef.current = pwr
        if (elapsed >= 5.5) handlePuffUp()
      }, 50)
    }
  }, [isFK2])

  const handlePuffUp = useCallback(() => {
    if (!kickChargingRef.current) return
    setKickCharging(false); kickChargingRef.current = false
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }

    const elapsed = (Date.now() - puffStart.current) / 1000
    const wasBlinker = elapsed >= 4.5

    if (isFK2) {
      const pos = kickPowerRef.current
      if (fk2PhaseRef.current === 'x') { fk2LockX(pos); return }
      if (fk2PhaseRef.current === 'y') { fk2LockY(pos); return }
      return
    }

    const finalPwr = Math.max(5, Math.min(100, kickPowerRef.current + (Math.random() - 0.5) * 10))
    executeKick(kickAimRef.current!, Math.round(finalPwr), wasBlinker)
  }, [isFK2, fk2LockX, fk2LockY, executeKick])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  const startGame = useCallback(() => {
    setRound(0); roundRef.current = 0
    setScore({ you: 0, ai: 0 }); scoreRef.current = { you: 0, ai: 0 }
    setKickAim(null); setKickPower(0); setKickAiZone(null)
    setDiveZone(null); setBallResult(null)
    setBonusAvail(false); setBonusActive(false); bonusActiveRef.current = false
    setBonusUsed(false); bonusUsedRef.current = false
    setFk2Phase(null); fk2PhaseRef.current = null
    setFk2X(0); fk2XRef.current = 0; setFk2XDone(false); fk2XDoneRef.current = false
    const ss = randomizeSweetSpot()
    if (isFK2) {
      setFk2Phase('x'); fk2PhaseRef.current = 'x'
      setKickComment('Aim LEFT or RIGHT! Hold & release! ← →')
    } else {
      setKickComment(`Let's gooo 🔥 Sweet spot: ${ss.holdMin}-${ss.holdMax}s`)
    }
    setCommentary('')
    setPhase('shoot'); phaseRef.current = 'shoot'
    playFx('crowd')
  }, [randomizeSweetSpot, playFx, isFK2])

  useEffect(() => {
    const t = setTimeout(() => startGame(), 1200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const kickDive = useCallback((zone: number) => {
    if (phaseRef.current !== 'save_dive') return
    setDiveZone(zone)
    setPhase('save_result'); phaseRef.current = 'save_result'
    playFx('kick')
    const aiKickZone = kickAiZoneRef.current!
    const sameZone = zone === aiKickZone
    const aiScores = !sameZone || (sameZone && Math.random() < 0.4)
    setBallResult(aiScores ? 'goal' : 'saved')
    setTimeout(() => {
      if (aiScores) {
        setScore(s => { const ns = { ...s, ai: s.ai + 1 }; scoreRef.current = ns; return ns })
        playFx('lose')
        setCommentary(`GOAL for ${opponent.name}! Wrong way! 😬`)
        setKickComment(`${opponent.emoji}: "${opponent.taunt}" 😂`)
      } else {
        playFx('win'); playFx('crowd')
        setCommentary('WHAT A SAVE! BRICK WALL! 🧱🧤')
        setKickComment('DENIED! You read it perfectly! 📖')
      }
      setTimeout(() => {
        setBallResult(null); setDiveZone(null); setKickAiZone(null)
        const cur = scoreRef.current
        const r = roundRef.current
        advanceRound(r, cur)
      }, 1800)
    }, 800)
  }, [playFx, opponent, advanceRound])

  const isShoot = phase === 'shoot'
  const isPower = phase === 'power'
  const isFlight = phase === 'flight'
  const isSaveReady = phase === 'save_ready'
  const isSaveCountdown = phase === 'save_countdown'
  const isSaveDive = phase === 'save_dive'
  const isFinal = phase === 'final'

  const ZONE_W = 100 / 3
  const ZONE_H = 50

  const getBallPos = (z: number) => ({
    x: KICK_ZONES[z].col * ZONE_W + ZONE_W / 2,
    y: KICK_ZONES[z].row * ZONE_H + ZONE_H / 2,
  })

  const won = score.you > score.ai
  const draw = score.you === score.ai

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #040E04 0%, #061a06 40%, #040E04 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(34,197,94,0.08), transparent 60%)', pointerEvents: 'none' }} />

      <div data-back="true" onClick={() => navigate('/arcade')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 14px 16px', gap: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.green}, ${C.lime})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isFK2 ? '⚽🔥 FINAL KICK 2' : '🏆 FINAL KICK'}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.cyan, fontWeight: 800 }}>YOU</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{score.you}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: C.text3 }}>R{round + 1}/5</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {[0, 1, 2, 3, 4].map(r => (
                <div key={r} style={{ width: 5, height: 5, borderRadius: '50%', background: r < round ? C.cyan : r === round ? C.gold : `${C.text3}30` }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.red, fontWeight: 800 }}>{opponent.emoji} AI</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{score.ai}</div>
          </div>
        </div>

        {/* Goal frame */}
        {phase !== 'intro' && !isFinal && phase !== 'bonus_offer' && (
          <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 160, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', background: 'linear-gradient(180deg, rgba(34,197,94,0.08) 0%, rgba(0,0,0,0.6) 100%)' }}>
            {/* Goal net lines */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, transparent 1px, transparent 19px, rgba(255,255,255,0.04) 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, transparent 1px, transparent 24px, rgba(255,255,255,0.04) 25px)' }} />

            {/* Zone buttons (shoot phase) */}
            {(isShoot && !isFK2) && KICK_ZONES.map((z, i) => (
              <div
                key={i}
                data-btn="true"
                onClick={() => {
                  setKickAim(i); kickAimRef.current = i
                  setPhase('power'); phaseRef.current = 'power'
                  setKickPower(0)
                  setKickComment(pick(['Now PUFF it! 💨', 'Hold that puff... 🫁', 'Full lungs energy 💨']))
                  playFx('select')
                }}
                style={{ position: 'absolute', left: `${z.col * 33.33}%`, top: `${z.row * 50}%`, width: '33.33%', height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: kickAim === i ? `${C.cyan}30` : 'transparent', border: `1px solid rgba(255,255,255,${kickAim === i ? 0.3 : 0.06})`, fontSize: 18, color: 'rgba(255,255,255,0.3)', transition: 'all 0.15s' }}
              >
                {z.label}
              </div>
            ))}

            {/* FK2 visual guide */}
            {isFK2 && isShoot && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                {fk2Phase === 'x' && (
                  <>
                    <div style={{ fontSize: 11, color: C.cyan, fontWeight: 800 }}>← HORIZONTAL AIM →</div>
                    <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${kickPower}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.lime})`, transition: 'width 0.05s' }} />
                    </div>
                    {fk2XDone && <div style={{ fontSize: 9, color: C.lime }}>X: {Math.round(fk2X)}% locked ✓</div>}
                  </>
                )}
                {fk2Phase === 'y' && (
                  <>
                    <div style={{ fontSize: 11, color: C.gold, fontWeight: 800 }}>↕ HEIGHT AIM ↕</div>
                    <div style={{ height: 80, width: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${kickPower}%`, background: `linear-gradient(0deg, ${C.gold}, ${C.lime})`, transition: 'height 0.05s' }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ball animation */}
            {(isFlight || phase === 'shoot_result') && kickAim !== null && ballResult && (
              <div style={{ position: 'absolute', left: `${getBallPos(kickAim).x}%`, top: `${getBallPos(kickAim).y}%`, transform: 'translate(-50%,-50%)', fontSize: 24, animation: 'fadeIn 0.3s ease', zIndex: 10 }}>
                {ballResult === 'goal' ? '⚽' : ballResult === 'missed' ? '💨' : '🧤'}
              </div>
            )}

            {/* Keeper dive */}
            {(diveZone !== null) && (
              <div style={{ position: 'absolute', left: `${getBallPos(diveZone).x}%`, top: `${getBallPos(diveZone).y}%`, transform: 'translate(-50%,-50%)', fontSize: 28, zIndex: 9 }}>🧤</div>
            )}

            {/* Save phase zone taps */}
            {isSaveDive && KICK_ZONES.map((z, i) => (
              <div
                key={i}
                data-btn="true"
                onClick={() => { kickDive(i); playFx('kick') }}
                style={{ position: 'absolute', left: `${z.col * 33.33}%`, top: `${z.row * 50}%`, width: '33.33%', height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,100,0,0.05)', border: '1px solid rgba(255,100,0,0.15)', fontSize: 18, color: 'rgba(255,100,0,0.4)' }}
              >
                {z.label}
              </div>
            ))}

            {isSaveCountdown && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 14, color: C.red, fontWeight: 900, animation: 'pulse 0.8s infinite' }}>{opponent.emoji} LINING UP...</div>
              </div>
            )}
          </div>
        )}

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: 64 }}>⚽</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>PENALTY SHOOTOUT</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>vs {opponent.emoji} {opponent.name}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
              {isFK2 ? 'Puff X then Y to aim! Double precision!' : 'Tap zone → PUFF to kick! Hit the sweet spot!'}
            </div>
          </div>
        )}

        {/* Power bar */}
        {(isPower || (isFK2 && isShoot && fk2Phase !== null)) && (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: kickCharging ? (kickPower >= sweetMin && kickPower <= sweetMax ? C.lime : C.gold) : C.text3 }}>
                {kickCharging ? (kickPower >= sweetMin && kickPower <= sweetMax ? '💨 SWEET SPOT! RELEASE!' : kickPower > sweetMax ? '📉 TOO LONG!' : 'Keep going...') : 'PUFF POWER'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 900, color: C.text2 }}>{Math.round(kickPower)}%</span>
            </div>
            <div style={{ height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: `1px solid rgba(255,255,255,0.1)`, position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%`, height: '100%', background: `${C.lime}15`, borderLeft: `1px solid ${C.lime}40`, borderRight: `1px solid ${C.lime}40` }} />
              <div style={{ position: 'absolute', left: `${sweetMin + 1}%`, top: 2, fontSize: 6, color: `${C.lime}80`, fontWeight: 800 }}>SWEET</div>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${kickPower}%`, background: kickPower >= sweetMin && kickPower <= sweetMax ? `linear-gradient(90deg, ${C.cyan}, ${C.lime})` : `linear-gradient(90deg, ${C.cyan}, ${C.green})`, borderRadius: 10, transition: 'width 0.05s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 6, color: C.text3 }}>TAP</span>
              <span style={{ fontSize: 6, color: C.text3 }}>SHORT</span>
              <span style={{ fontSize: 6, color: C.lime, fontWeight: 700 }}>PERFECT 💨</span>
              <span style={{ fontSize: 6, color: C.text3 }}>LONG</span>
              <span style={{ fontSize: 6, color: C.red }}>BLINK 💀</span>
            </div>
          </div>
        )}

        {/* Save prompt */}
        {isSaveReady && (
          <div
            data-btn="true"
            onClick={() => {
              const aiKickZone = Math.floor(Math.random() * 6)
              setKickAiZone(aiKickZone); kickAiZoneRef.current = aiKickZone
              setPhase('save_countdown'); phaseRef.current = 'save_countdown'
              playFx('whistle')
              setKickComment(`${opponent.emoji} is lining up... which way? 🤔`)
              setTimeout(() => {
                setPhase('save_dive'); phaseRef.current = 'save_dive'
                setKickComment('DIVE DIVE DIVE! 🧤')
              }, 1200)
            }}
            style={{ padding: '14px 28px', borderRadius: 14, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}
          >
            🧤 READY TO SAVE?
          </div>
        )}

        {/* Shoot instruction (FK1) */}
        {isShoot && !isFK2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.text2 }}>👆 TAP a zone in the goal</div>
          </div>
        )}

        {/* FK2 instruction */}
        {isFK2 && isShoot && (
          <div style={{ textAlign: 'center' }}>
            {fk2Phase === 'x' && <div style={{ fontSize: 11, color: C.cyan, animation: 'pulse 1.5s infinite', fontWeight: 700 }}>PUFF for LEFT ← or → RIGHT position</div>}
            {fk2Phase === 'y' && <div style={{ fontSize: 11, color: C.gold, animation: 'pulse 1.5s infinite', fontWeight: 700 }}>PUFF for LOW or ↑ HIGH position</div>}
          </div>
        )}

        {/* Power instruction */}
        {isPower && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.green, animation: 'pulse 1.5s infinite' }}>PUFF to kick! 💨</div>
            <div style={{ fontSize: 9, color: C.text3 }}>Release in the SWEET SPOT! 🎯</div>
          </div>
        )}

        {/* Bonus offer */}
        {phase === 'bonus_offer' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎰</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.gold }}>BONUS SHOT!</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4, marginBottom: 12 }}>Score = double points! Tighter sweet spot!</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div
                data-btn="true"
                onClick={(e) => {
                  e.stopPropagation()
                  const holdMin = 2.2 + Math.random() * 0.6
                  const holdMax = holdMin + 0.8 + Math.random() * 0.4
                  const pMin = Math.max(50, Math.round(40 + (holdMin - 1.5) / 2.0 * 55))
                  const pMax = Math.min(96, Math.round(40 + (holdMax - 1.5) / 2.0 * 55))
                  setSweetMin(pMin); sweetMinRef.current = pMin
                  setSweetMax(pMax); sweetMaxRef.current = pMax
                  setBonusUsed(true); bonusUsedRef.current = true
                  setBonusActive(true); bonusActiveRef.current = true
                  setBonusAvail(false)
                  setKickAim(null)
                  if (isFK2) {
                    setFk2Phase('x'); fk2PhaseRef.current = 'x'
                    setFk2X(0); fk2XRef.current = 0; setFk2XDone(false); fk2XDoneRef.current = false
                  }
                  setPhase('shoot'); phaseRef.current = 'shoot'
                  setKickComment('BONUS SHOT! Tighter sweet spot! ⚡')
                  playFx('crowd')
                }}
                style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: `${C.gold}15`, border: `1px solid ${C.gold}30`, fontSize: 13, fontWeight: 800, color: C.gold }}
              >
                ⚡ TAKE IT!
              </div>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); setBonusAvail(false); setPhase('final'); phaseRef.current = 'final'; awardGame({ won: score.you > score.ai, baseCoins: score.you > score.ai ? 80 : 12, baseXP: score.you > score.ai ? 20 : 8 }) }}
                style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 800, color: C.text3 }}
              >
                Skip
              </div>
            </div>
          </div>
        )}

        {/* Final */}
        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? '🏆' : draw ? '🤝' : '😢'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: won ? C.gold : draw ? C.text2 : C.red }}>
              {won ? 'YOU WIN!' : draw ? 'DRAW!' : `${opponent.name} WINS!`}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>{score.you} — {score.ai}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 13, fontWeight: 800, color: C.green }}>Play Again</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {/* Commentary */}
        <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', textAlign: 'center' }}>{commentary || kickComment}</div>
      </div>
    </div>
  )
}
