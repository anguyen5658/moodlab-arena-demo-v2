import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C, GLASS_CARD, LG, GLASS_CLEAR } from '@/constants'

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

const SHOOT_TAUNTS = ["Pick your poison 🎯","Where you aiming, champ? 😏","Top bins or nah? 🤔","Don't choke now 😂","AI keeper is SHOOK 🥶","One puff to rule them all 💨","Aim with your third eye 👁️","This keeper's been napping 😴"]
const GOAL_CHEERS = ["GOLAZOOO! 🔥🔥🔥","ABSOLUTE BANGER! 💥","NET GO BRRR 😤","SHEEEESH! 🥶","TOP BINS MERCHANT 👑","WHAT A STRIKE! 🫠","THUNDERPUFF! ⚡","CLINICAL! 🩺"]
const SAVE_CHEERS = ["DENIED! 🚫🧤","WALL MODE ACTIVATED 🧱","NOT TODAY! 😤","BRICK WALL ENERGY 💪","AI IS CRYING RN 😭","FORTRESS! 🏰"]
const CONCEDE_REACT = ["Bruh... 💀","That one hurt 😂","AI said 'sit down' 😤","Pain. Just pain. 🥲","Keeper had lag 📡","Wrong way bestie 🧭"]
const crowdEmojis = ["🎉","🔥","😤","💨","🤣","😱","👏","🥳","💀","😂","🙌","⚡"]

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

interface MatchIntro { stage: 'enter' | 'stats' | 'countdown' | 'go'; count?: number }
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

  // Visual state
  const [tick, setTick] = useState(0)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const actionTimer = 10
  const [kickStats, setKickStats] = useState({ goals: 0, saves: 0, perfects: 0, blinkers: 0, misses: 0 })
  const [matchIntro, setMatchIntro] = useState<MatchIntro | null>({ stage: 'enter' })

  const endSoundFiredRef = useRef(false)
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

  // Tick for crowd animation
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 2000)
    return () => clearInterval(t)
  }, [])

  const triggerFlash = (type: string, shake = false) => {
    setScreenFlash(type)
    setTimeout(() => setScreenFlash(null), 400)
    if (shake) {
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 500)
    }
  }

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
      if (!endSoundFiredRef.current) { endSoundFiredRef.current = true; playFx(curScore.you > curScore.ai ? 'win' : 'lose') }
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
        playFx('goal'); playFx('crowd')
        setCommentary('WHAT A GOAL! 🔥')
        setKickComment(inSweet ? 'PERFECT PUFF GOAL! 💨👑' : 'GOLAZOOO! 🔥')
        setKickStats(st => ({ ...st, goals: st.goals + 1, perfects: inSweet ? st.perfects + 1 : st.perfects }))
        triggerFlash('goal', true)
      } else if (result === 'missed') {
        playFx(wasBlinker ? 'blinker' : 'error')
        if (wasBlinker) setCommentary('BLINKER! Ball left the planet! 🛸💀')
        else setCommentary('MISSED! Over the bar! 🚀')
        setKickComment(wasBlinker ? 'Puffed too long! Blinker! 💀' : 'Too much power! 😬')
        setKickStats(st => ({ ...st, misses: st.misses + 1, blinkers: wasBlinker ? st.blinkers + 1 : st.blinkers }))
        triggerFlash(wasBlinker ? 'blinker' : 'miss', wasBlinker)
      } else {
        playFx('save')
        setCommentary('SAVED! Keeper denies it! 🧤')
        setKickComment(!inSweet ? "Sweet spot needed! Find it! 🎯" : 'Keeper read it! 🧤')
        triggerFlash('save')
      }

      setTimeout(() => {
        setBallResult(null); setDiveZone(null); setKickAim(null)
        if (bonusActiveRef.current) {
          setBonusActive(false); bonusActiveRef.current = false
          setPhase('final'); phaseRef.current = 'final'
          const wonBonus = scoreRef.current.you > scoreRef.current.ai
          if (!endSoundFiredRef.current) { endSoundFiredRef.current = true; playFx(wonBonus ? 'win' : 'lose') }
          awardGame({ won: wonBonus, baseCoins: wonBonus ? 80 : 12, baseXP: wonBonus ? 20 : 8 })
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
        triggerFlash('miss')
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
          playFx('goal'); playFx('crowd')
          if (bothSweet) setCommentary('DOUBLE SWEET SPOT! UNSTOPPABLE! 🎯🎯')
          else setCommentary('GOAL! Great placement! ⚽')
          setKickStats(st => ({ ...st, goals: st.goals + 1, perfects: bothSweet ? st.perfects + 1 : st.perfects }))
          triggerFlash('goal', true)
        } else {
          playFx('save')
          setCommentary('SAVED! Keeper in the right spot! 🧤')
          triggerFlash('save')
        }
        setTimeout(() => {
          setBallResult(null); setDiveZone(null); setKickAim(null)
          setFk2X(0); fk2XRef.current = 0; setFk2XDone(false); fk2XDoneRef.current = false
          if (bonusActiveRef.current) {
            setBonusActive(false); bonusActiveRef.current = false
            setPhase('final'); phaseRef.current = 'final'
            const wonBonus2 = scoreRef.current.you > scoreRef.current.ai
            if (!endSoundFiredRef.current) { endSoundFiredRef.current = true; playFx(wonBonus2 ? 'win' : 'lose') }
            awardGame({ won: wonBonus2, baseCoins: wonBonus2 ? 100 : 15, baseXP: wonBonus2 ? 20 : 8 })
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
    setKickStats({ goals: 0, saves: 0, perfects: 0, blinkers: 0, misses: 0 })
    endSoundFiredRef.current = false
    const ss = randomizeSweetSpot()

    // Match intro sequence
    setMatchIntro({ stage: 'enter' })
    setTimeout(() => setMatchIntro({ stage: 'stats' }), 1500)
    setTimeout(() => setMatchIntro({ stage: 'countdown', count: 3 }), 3000)
    setTimeout(() => setMatchIntro({ stage: 'countdown', count: 2 }), 4000)
    setTimeout(() => setMatchIntro({ stage: 'countdown', count: 1 }), 5000)
    setTimeout(() => setMatchIntro({ stage: 'go' }), 6000)
    setTimeout(() => {
      setMatchIntro(null)
      if (isFK2) {
        setFk2Phase('x'); fk2PhaseRef.current = 'x'
        setKickComment('Aim LEFT or RIGHT! Hold & release! ← →')
      } else {
        setKickComment(`Let's gooo 🔥 Sweet spot: ${ss.holdMin}-${ss.holdMax}s`)
      }
      setCommentary('')
      setPhase('shoot'); phaseRef.current = 'shoot'
      playFx('crowd')
    }, 6800)
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
        playFx('error')
        setCommentary(`GOAL for ${opponent.name}! Wrong way! 😬`)
        setKickComment(`${opponent.emoji}: "${opponent.taunt}" 😂`)
        setKickStats(st => ({ ...st, misses: st.misses + 1 }))
        triggerFlash('miss', true)
      } else {
        playFx('save'); playFx('crowd')
        setCommentary('WHAT A SAVE! BRICK WALL! 🧱🧤')
        setKickComment('DENIED! You read it perfectly! 📖')
        setKickStats(st => ({ ...st, saves: st.saves + 1 }))
        triggerFlash('goal')
      }
      setTimeout(() => {
        setBallResult(null); setDiveZone(null); setKickAiZone(null)
        const cur = scoreRef.current
        const r = roundRef.current
        advanceRound(r, cur)
      }, 1800)
    }, 800)
  }, [playFx, opponent, advanceRound])

  // Derived state
  const isShootPhase = ['shoot', 'power', 'flight', 'shoot_result'].includes(phase)
  const isSavePhase = ['save_ready', 'save_countdown', 'save_dive', 'save_result'].includes(phase)
  const isResult = phase === 'shoot_result' || phase === 'save_result'
  const isShoot = phase === 'shoot'
  const isPower = phase === 'power'
  const isFlight = phase === 'flight'
  const isSaveReady = phase === 'save_ready'
  const isSaveCountdown = phase === 'save_countdown'
  const isSaveDive = phase === 'save_dive'
  const isFinal = phase === 'final'

  const goalW = 290
  const goalH = 140
  const zoneW = goalW / 3
  const zoneH = goalH / 2

  const getBallPos = (z: number) => ({
    x: KICK_ZONES[z].col * zoneW + zoneW / 2,
    y: KICK_ZONES[z].row * zoneH + zoneH / 2,
  })

  const won = score.you > score.ai
  const draw = score.you === score.ai

  const streakBonus = kickStats.goals > 0 ? Math.min(kickStats.goals, 5) : 0
  const streakLabel = streakBonus >= 5 ? "🔥 UNSTOPPABLE x5" : streakBonus >= 4 ? "🔥 ON FIRE x4" : streakBonus >= 3 ? "⚡ HAT TRICK x3" : streakBonus >= 2 ? "✨ DOUBLE x2" : ""

  const elapsed = kickCharging ? (Date.now() - puffStart.current) / 1000 : 0

  const getPuffZone = (pwr: number) => {
    if (pwr < 15) return 'tap'
    if (pwr < 40) return 'short'
    if (pwr < sweetMin) return 'good'
    if (pwr <= sweetMax) return 'perfect'
    return 'blinker'
  }
  const zone = getPuffZone(kickPower)
  const zoneColor = zone === 'perfect' ? C.green : zone === 'good' ? C.cyan : zone === 'short' ? C.gold : zone === 'tap' ? C.text3 : C.red
  const barColor = kickPower >= sweetMin && kickPower <= sweetMax
    ? `linear-gradient(90deg, ${C.cyan}, ${C.green}, ${C.gold})`
    : kickPower > sweetMax
      ? `linear-gradient(90deg, ${C.cyan}, ${C.green}, ${C.gold}, ${C.red})`
      : `linear-gradient(90deg, ${C.cyan}, ${C.green})`

  const WIN_MSGS = ["YOU'RE GOATED 🐐","CHAMPION VIBES 👑","AI NEEDS THERAPY 😂","UNMATCHED 💎",`${opponent.name} is crying rn 😭`,"Puff of champions 💨👑"]
  const LOSE_MSGS = ["GG next time 😤","Blame the controller 🎮",`${opponent.name} got lucky fr 💀`,"Keeper was HIGH key asleep 😂","Run it back! 🔄","That wasn't even fair bro 🤣"]

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden',
        animation: screenShake ? 'shake 0.4s ease' : 'none',
      }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; handlePuffUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); handlePuffUp() }}
    >
      {/* ═══ SCREEN FLASH OVERLAY ═══ */}
      {screenFlash && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0,
          background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : screenFlash === 'save' ? 'rgba(255,165,0,0.2)' : screenFlash === 'miss' ? 'rgba(255,50,50,0.2)' : 'rgba(255,0,0,0.3)',
          animation: 'flashOverlay 0.4s ease forwards',
        }} />
      )}

      {/* ═══ SCREEN EDGE GLOW during active puff ═══ */}
      {kickCharging && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 203, pointerEvents: 'none',
          boxShadow: `inset 0 0 60px ${C.lime}15, inset 0 0 120px ${C.cyan}08`,
          borderRadius: 'inherit', animation: 'pulse 1.5s infinite',
        }} />
      )}

      {/* ═══ MATCH INTRO ═══ */}
      {matchIntro && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(ellipse at 50% 30%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 70%, rgba(255,217,61,0.04) 0%, transparent 50%),
            rgba(4,8,18,0.92)`,
          backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease',
        }}>
          {/* Stadium spotlight beams */}
          <div style={{ position: 'absolute', top: 0, left: '20%', width: 2, height: '40%', background: `linear-gradient(180deg, ${C.cyan}25, transparent)`, filter: 'blur(3px)' }} />
          <div style={{ position: 'absolute', top: 0, right: '20%', width: 2, height: '40%', background: `linear-gradient(180deg, ${C.red}25, transparent)`, filter: 'blur(3px)' }} />

          {/* Title badge */}
          <div style={{ marginBottom: 16, padding: '4px 16px', borderRadius: 20, background: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.gold, letterSpacing: 3 }}>{isFK2 ? '⚽🔥 FINAL KICK 2 — DOUBLE PUFF' : '🏆 FINAL KICK CHAMPIONSHIP'}</span>
          </div>

          {/* VS PLAYERS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
            {/* Player left */}
            <div style={{ textAlign: 'center', animation: 'slideInLeft 0.8s ease' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', border: `2px solid ${C.cyan}60`, background: `${C.cyan}10`, margin: '0 auto 6px', boxShadow: `0 0 20px ${C.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>😎</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.cyan, textShadow: `0 0 10px ${C.cyan}40` }}>Steve</div>
              <div style={{ fontSize: 8, color: C.text3 }}>Lv.24 · 💨 Puff</div>
            </div>

            {/* VS center */}
            <div style={{ textAlign: 'center', minWidth: 50 }}>
              {matchIntro.stage === 'countdown' ? (
                <div style={{ fontSize: 60, fontWeight: 900, color: C.gold, textShadow: `0 0 40px ${C.gold}60`, animation: 'countPulse 0.8s ease', lineHeight: 1 }}>{matchIntro.count}</div>
              ) : matchIntro.stage === 'go' ? (
                <div style={{ fontSize: 24, fontWeight: 900, color: C.green, textShadow: `0 0 20px ${C.green}60`, animation: 'countPulse 0.5s ease', lineHeight: 1 }}>⚽</div>
              ) : (
                <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, textShadow: `0 0 20px ${C.gold}60`, animation: 'countPulse 1.5s infinite' }}>VS</div>
              )}
            </div>

            {/* Player right */}
            <div style={{ textAlign: 'center', animation: 'slideInRight 0.8s ease' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', border: `2px solid ${C.red}60`, background: `${C.red}10`, margin: '0 auto 6px', boxShadow: `0 0 20px ${C.red}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{opponent.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.red, textShadow: `0 0 10px ${C.red}40` }}>{opponent.name}</div>
              <div style={{ fontSize: 8, color: C.text3 }}>AI · Unranked</div>
            </div>
          </div>

          {/* Stats head-to-head */}
          {(matchIntro.stage === 'stats' || matchIntro.stage === 'countdown' || matchIntro.stage === 'go') && (
            <div style={{ width: '80%', maxWidth: 280, padding: '10px 14px', borderRadius: 14, ...GLASS_CLEAR, animation: 'fadeIn 0.5s ease', marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: C.gold, marginBottom: 8, textAlign: 'center', letterSpacing: 2 }}>📊 HEAD TO HEAD</div>
              {[
                ["72%", "Win Rate", (45 + Math.floor(Math.random() * 20)) + "%"],
                ["420", "Goals", Math.floor(Math.random() * 50) + ""],
                ["69", "Blinkers 💀", Math.floor(Math.random() * 30) + ""],
                ["2.9s", "Avg Puff", (2.5 + Math.random()).toFixed(1) + "s"],
              ].map(([l, mid, r], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 0', borderBottom: i < 3 ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, minWidth: 35 }}>{l}</span>
                  <span style={{ fontSize: 8, color: C.text3, flex: 1, textAlign: 'center' }}>{mid}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.red, minWidth: 35, textAlign: 'right' }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* GO text */}
          {matchIntro.stage === 'go' && (
            <div style={{ animation: 'fadeIn 0.2s ease', marginTop: 4 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.green, textShadow: `0 0 30px ${C.green}60`, animation: 'countPulse 0.5s ease', textAlign: 'center' }}>KICK OFF!</div>
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 8, color: C.text3 }}>👁️ {120 + Math.floor(Math.random() * 80)} watching · 🏟️ Round of 16</div>
        </div>
      )}

      {/* ═══ STADIUM BACKGROUND ═══ */}
      <div style={{
        position: 'absolute', inset: 0, background: `
          radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(127,255,0,0.05) 0%, transparent 40%),
          radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 40%),
          linear-gradient(180deg, #06101E 0%, #0c1a38 30%, #102240 60%, #081830 100%)
        `
      }} />

      {/* Stadium lights */}
      <div style={{ position: 'absolute', top: 0, left: '15%', width: 3, height: '35%', background: `linear-gradient(180deg, ${C.cyan}30, transparent)`, filter: 'blur(4px)', animation: 'pulse 3s infinite' }} />
      <div style={{ position: 'absolute', top: 0, right: '15%', width: 3, height: '35%', background: `linear-gradient(180deg, ${C.gold}30, transparent)`, filter: 'blur(4px)', animation: 'pulse 3s infinite 0.5s' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 60, borderRadius: '0 0 100% 100%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.04), transparent)', filter: 'blur(20px)' }} />

      {/* Grass field gradient at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: `linear-gradient(180deg, transparent, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0.12))`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', right: '10%', height: 1, background: `${C.green}10` }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '20%', right: '20%', height: 1, background: `${C.green}06` }} />

      {/* Floating crowd emojis */}
      {[...Array(8)].map((_, i) => (
        <div key={`crowd${i}`} style={{
          position: 'absolute',
          left: `${8 + i * 12}%`,
          bottom: `${(tick * 1.5 + i * 47) % 120 - 10}%`,
          fontSize: 12,
          opacity: 0.15,
          transition: 'bottom 2s linear',
          pointerEvents: 'none',
        }}>{crowdEmojis[(i + tick) % crowdEmojis.length]}</div>
      ))}

      {/* Ambient crowd noise dots */}
      {[...Array(20)].map((_, i) => (
        <div key={`dot${i}`} style={{
          position: 'absolute',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 23 + 5) % 30}%`,
          width: 2, height: 2, borderRadius: '50%',
          background: [C.cyan, C.gold, C.pink, C.orange][i % 4],
          opacity: 0.12,
          animation: `pulse ${2 + (i % 3)}s infinite ${(i % 5) * 0.4}s`,
        }} />
      ))}

      {/* Back button */}
      <div data-back="true" onClick={() => navigate('/arcade')} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: C.text2 }}>← Back</div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '38px 14px 52px', height: '100%', overflowY: 'auto' }}>

        {/* ═══ VS ARENA HEADER ═══ */}
        <div style={{ width: '100%', maxWidth: 390, marginTop: 28, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: C.gold, letterSpacing: 2 }}>{isFK2 ? '⚽🔥 FINAL KICK 2' : '🏆 FINAL KICK'}</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: C.cyan, padding: '2px 8px', borderRadius: 20, ...LG.tinted(C.cyan) }}>⚖️ Open Pool</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: C.cyan, padding: '2px 8px', borderRadius: 20, ...LG.tinted(C.cyan) }}>💨 Puff</span>
            {bonusActive && <span style={{ fontSize: 7, fontWeight: 800, color: C.gold, padding: '2px 8px', borderRadius: 20, background: `${C.gold}20`, border: `1px solid ${C.gold}40`, animation: 'pulse 1s infinite' }}>⚡ BONUS</span>}
          </div>

          {/* Arena VS card */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 18, overflow: 'hidden', ...LG.tinted(C.cyan), position: 'relative', minHeight: 80 }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: '100%', background: `linear-gradient(180deg, ${C.gold}60, ${C.gold}10)`, transform: 'skewX(-8deg)', zIndex: 3 }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', background: `radial-gradient(ellipse at 20% 50%, ${C.cyan}12, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', background: `radial-gradient(ellipse at 80% 50%, ${C.red}12, transparent 70%)`, pointerEvents: 'none' }} />

            {/* YOU */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: `linear-gradient(135deg, ${C.cyan}08, transparent)` }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, overflow: 'hidden', border: `2px solid ${C.cyan}50`, background: `${C.cyan}10`, boxShadow: `0 0 16px ${C.cyan}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>😎</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.cyan }}>Steve</div>
                <div style={{ fontSize: 7, color: C.text3 }}>💨 Puff</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', textShadow: `0 0 12px ${C.cyan}60`, lineHeight: 1, marginTop: 2 }}>{score.you}</div>
              </div>
            </div>

            {/* VS center */}
            <div style={{ width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
              <div style={{ fontSize: 7, color: C.text3, fontWeight: 700 }}>R{round + 1}/5</div>
              <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                {[0, 1, 2, 3, 4].map(r => (
                  <div key={r} style={{ width: 5, height: 5, borderRadius: '50%', background: r < round ? C.cyan : r === round ? C.gold : `${C.text3}30`, boxShadow: r === round ? `0 0 6px ${C.gold}` : '' }} />
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, textShadow: `0 0 10px ${C.gold}50`, marginTop: 2 }}>VS</div>
            </div>

            {/* AI */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexDirection: 'row-reverse', gap: 8, padding: '10px 12px', background: `linear-gradient(225deg, ${C.red}08, transparent)` }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, overflow: 'hidden', border: `2px solid ${C.red}50`, background: `${C.red}10`, boxShadow: `0 0 16px ${C.red}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{opponent.emoji}</div>
              <div style={{ textAlign: 'right', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.red, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opponent.name}</div>
                <div style={{ fontSize: 7, color: C.text3 }}>AI Keeper</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', textShadow: `0 0 12px ${C.red}60`, lineHeight: 1, marginTop: 2 }}>{score.ai}</div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 7, color: C.text3 }}>⚽{kickStats.goals}</span>
            <span style={{ fontSize: 7, color: C.text3 }}>🧤{kickStats.saves}</span>
            <span style={{ fontSize: 7, color: C.green }}>💨{kickStats.perfects}</span>
            {kickStats.blinkers > 0 && <span style={{ fontSize: 7, color: C.red }}>💀{kickStats.blinkers}</span>}
            {kickStats.misses > 0 && <span style={{ fontSize: 7, color: C.gold }}>🚀{kickStats.misses}</span>}
          </div>
        </div>

        {/* ═══ PHASE LABEL + LIVE COMMENTARY ═══ */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: isShootPhase ? C.cyan : isSavePhase ? C.orange : C.gold, textShadow: `0 0 15px ${isShootPhase ? C.cyan : C.orange}40` }}>
            {bonusActive ? '⚡ BONUS SHOT' : isShootPhase ? '🦶 YOUR KICK' : isSavePhase ? '🧤 YOUR SAVE' : phase === 'bonus_offer' ? '🎰 BONUS!' : ''}
          </div>
          {kickComment && (
            <div style={{ fontSize: 10, color: C.text2, marginTop: 3, fontStyle: 'italic', animation: 'fadeIn 0.4s ease', maxWidth: 300 }}>"{kickComment}"</div>
          )}
        </div>

        {/* ═══ GOAL FRAME ═══ */}
        {phase !== 'intro' && !isFinal && phase !== 'bonus_offer' && (
          <>
            <div style={{ perspective: '600px', marginBottom: 4 }}>
              <div style={{
                position: 'relative', width: goalW, height: goalH,
                cursor: isShoot || isSaveDive ? 'pointer' : 'default',
                border: '3px solid rgba(255,255,255,0.2)',
                borderBottom: `4px solid ${C.green}80`,
                borderRadius: '12px 12px 0 0',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                boxShadow: `0 0 40px rgba(0,229,255,0.06), inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)`,
                transform: isSavePhase ? 'rotateX(2deg)' : 'rotateX(-2deg)',
                transition: 'transform 0.5s ease',
                overflow: 'hidden',
              }}>
                {/* Net pattern — 9 vertical thin lines */}
                {[...Array(9)].map((_, i) => (
                  <div key={`nv${i}`} style={{ position: 'absolute', top: 0, left: `${(i + 1) * 10}%`, width: 1, height: '100%', background: 'rgba(255,255,255,0.04)' }} />
                ))}
                {/* 5 horizontal thin lines */}
                {[...Array(5)].map((_, i) => (
                  <div key={`nh${i}`} style={{ position: 'absolute', top: `${(i + 1) * 16.6}%`, left: 0, width: '100%', height: 1, background: 'rgba(255,255,255,0.04)' }} />
                ))}
                {/* Main dividers (thicker) */}
                <div style={{ position: 'absolute', top: 0, left: '33.3%', width: 1, height: '100%', background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ position: 'absolute', top: 0, left: '66.6%', width: 1, height: '100%', background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(255,255,255,0.12)' }} />

                {/* FK2: Vertical line showing X position during shoot_x charging */}
                {isFK2 && phase === 'shoot' && fk2Phase === 'x' && kickCharging && kickPower > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: `${kickPower}%`, width: 3,
                    background: (kickPower < 10 || kickPower > 90) ? C.red : (kickPower >= sweetMin && kickPower <= sweetMax) ? C.green : C.cyan,
                    boxShadow: `0 0 12px ${(kickPower < 10 || kickPower > 90) ? C.red : (kickPower >= sweetMin && kickPower <= sweetMax) ? C.green : C.cyan}`,
                    zIndex: 5, pointerEvents: 'none', transition: 'left 0.06s linear',
                  }} />
                )}
                {/* FK2: Locked X line */}
                {isFK2 && (phase === 'shoot' && fk2Phase === 'y' || fk2XDone) && (
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${fk2X}%`, width: 2, background: `${C.green}80`, boxShadow: `0 0 8px ${C.green}40`, zIndex: 4, pointerEvents: 'none' }} />
                )}
                {/* FK2: Horizontal Y line + crosshair */}
                {isFK2 && phase === 'shoot' && fk2Phase === 'y' && kickCharging && kickPower > 0 && (
                  <>
                    <div style={{
                      position: 'absolute', left: 0, right: 0, bottom: `${kickPower}%`, height: 3,
                      background: kickPower > 95 ? C.red : (kickPower >= sweetMin && kickPower <= sweetMax) ? C.green : C.orange,
                      boxShadow: `0 0 12px ${kickPower > 95 ? C.red : (kickPower >= sweetMin && kickPower <= sweetMax) ? C.green : C.orange}`,
                      zIndex: 5, pointerEvents: 'none', transition: 'bottom 0.06s linear',
                    }} />
                    <div style={{
                      position: 'absolute', left: `${fk2X}%`, bottom: `${kickPower}%`, width: 10, height: 10,
                      borderRadius: '50%', background: '#fff', border: `2px solid ${C.green}`,
                      transform: 'translate(-50%,50%)', boxShadow: `0 0 12px ${C.green}`, zIndex: 6, pointerEvents: 'none',
                    }} />
                  </>
                )}
                {/* FK2 out-of-bounds zones for X phase */}
                {isFK2 && phase === 'shoot' && fk2Phase === 'x' && (
                  <>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '10%', background: `${C.red}08`, borderRight: `1px dashed ${C.red}25`, pointerEvents: 'none', zIndex: 3 }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '10%', background: `${C.red}08`, borderLeft: `1px dashed ${C.red}25`, pointerEvents: 'none', zIndex: 3 }} />
                  </>
                )}
                {/* FK2 out-of-bounds for Y phase */}
                {isFK2 && phase === 'shoot' && fk2Phase === 'y' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5%', background: `${C.red}08`, borderBottom: `1px dashed ${C.red}25`, pointerEvents: 'none', zIndex: 3 }} />
                )}
                {/* FK2 sweet spot indicator */}
                {isFK2 && phase === 'shoot' && fk2Phase === 'x' && (
                  <div style={{ position: 'absolute', bottom: -4, left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%`, height: 3, background: C.green, borderRadius: 2, opacity: 0.5, zIndex: 3 }} />
                )}
                {isFK2 && phase === 'shoot' && fk2Phase === 'y' && (
                  <div style={{ position: 'absolute', right: -4, bottom: `${sweetMin}%`, height: `${sweetMax - sweetMin}%`, width: 3, background: C.green, borderRadius: 2, opacity: 0.5, zIndex: 3 }} />
                )}

                {/* Tap zones (FK1 shoot + save_dive for both) */}
                {(isShoot && !isFK2) && KICK_ZONES.map((z, i) => (
                  <div key={i}
                    data-btn="true"
                    onClick={() => {
                      setKickAim(i); kickAimRef.current = i
                      setPhase('power'); phaseRef.current = 'power'
                      setKickPower(0)
                      setKickComment(pick(['Now PUFF it! 💨', 'Hold that puff... 🫁', 'Full lungs energy 💨']))
                      playFx('select')
                    }}
                    style={{
                      position: 'absolute', left: z.col * zoneW, top: z.row * zoneH, width: zoneW, height: zoneH,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: kickAim === i ? `radial-gradient(circle, ${C.cyan}30, ${C.cyan}08)` : 'transparent',
                      borderRadius: 4, transition: 'all 0.15s ease', fontSize: 22, color: 'rgba(255,255,255,0.15)',
                    }}>
                    <span style={{ filter: kickAim === i ? `drop-shadow(0 0 8px ${C.cyan})` : '' }}>{z.label}</span>
                  </div>
                ))}

                {/* Save dive tap zones */}
                {isSaveDive && KICK_ZONES.map((z, i) => (
                  <div key={i}
                    data-btn="true"
                    onClick={() => { kickDive(i); playFx('kick') }}
                    style={{
                      position: 'absolute', left: z.col * zoneW, top: z.row * zoneH, width: zoneW, height: zoneH,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'rgba(255,100,0,0.05)', border: '1px solid rgba(255,100,0,0.15)',
                      fontSize: 22, color: 'rgba(255,100,0,0.4)', borderRadius: 4,
                    }}>
                    {z.label}
                  </div>
                ))}

                {/* Ball animation with impact flash */}
                {(isFlight || phase === 'shoot_result') && kickAim !== null && ballResult && (() => {
                  const bp = getBallPos(kickAim)
                  const isGoalResult = ballResult === 'goal'
                  return (
                    <>
                      <div style={{ position: 'absolute', left: bp.x - 30, top: bp.y - 30, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, ${isGoalResult ? C.green : C.red}30, transparent)`, animation: 'fadeIn 0.2s ease', zIndex: 4 }} />
                      <div style={{ position: 'absolute', left: bp.x - 16, top: bp.y - 16, fontSize: 32, zIndex: 5, animation: 'fadeIn 0.2s ease', filter: `drop-shadow(0 0 20px ${isGoalResult ? C.green : C.red}) drop-shadow(0 0 40px ${isGoalResult ? C.green : C.red}80)` }}>⚽</div>
                    </>
                  )
                })()}

                {/* Keeper dive — column-based positioning */}
                {diveZone !== null && (() => {
                  const col = KICK_ZONES[diveZone].col
                  const kx = col === 0 ? '15%' : col === 1 ? '50%' : '85%'
                  return (
                    <div style={{
                      position: 'absolute', bottom: 8, left: kx, transform: 'translateX(-50%)',
                      fontSize: 36, zIndex: 4, transition: 'left 0.25s cubic-bezier(0.22,1,0.36,1)',
                      filter: 'drop-shadow(0 0 10px rgba(255,165,0,0.4))',
                    }}>{col === 0 ? '🤸' : '🧤'}</div>
                  )
                })()}

                {/* Save countdown hint */}
                {isSaveCountdown && kickAiZone !== null && (() => {
                  const hintCol = KICK_ZONES[kickAiZone].col
                  return (
                    <div style={{
                      position: 'absolute',
                      left: hintCol === 0 ? '0%' : hintCol === 1 ? '25%' : '55%',
                      top: 0, width: '45%', height: '100%',
                      background: `linear-gradient(90deg, transparent, ${C.orange}06, transparent)`,
                      animation: 'pulse 0.8s infinite', pointerEvents: 'none',
                    }} />
                  )
                })()}

                {/* ═══ RESULT OVERLAY ═══ */}
                {isResult && (kickAim !== null || diveZone !== null) && ballResult && (() => {
                  const isMiss = ballResult === 'missed'
                  const isGoalResult = ballResult === 'goal'
                  const youScored = isShootPhase && isGoalResult
                  const youSaved = isSavePhase && !isGoalResult && !isMiss
                  const youMissed = isShootPhase && isMiss
                  const good = youScored || youSaved
                  return (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                      background: good ? `radial-gradient(circle, ${C.green}20, rgba(0,0,0,0.7))` : `radial-gradient(circle, ${C.red}15, rgba(0,0,0,0.7))`,
                      animation: 'fadeIn 0.2s ease',
                    }}>
                      <div style={{ fontSize: 56, animation: 'goalBurst 0.6s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 40px ${good ? C.green : C.red}80)` }}>
                        {youMissed ? '💀' : youScored ? '⚽' : youSaved ? '🧤' : isShootPhase ? '🧤' : '⚽'}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: youMissed ? C.gold : good ? C.green : C.red, textShadow: `0 0 40px ${youMissed ? C.gold : good ? C.green : C.red}`, animation: 'goalBurst 0.5s ease 0.1s both', letterSpacing: 2 }}>
                        {youMissed ? (ballResult === 'missed' ? 'MISS!' : 'BLINKER!') : youScored ? 'GOLAZO!' : youSaved ? 'DENIED!' : isShootPhase ? 'Saved!' : 'AI Scores!'}
                      </div>
                      <div style={{ fontSize: 11, color: C.text2, marginTop: 6, fontStyle: 'italic', animation: 'fadeIn 0.4s ease 0.2s both' }}>
                        {good ? pick(youScored ? GOAL_CHEERS : SAVE_CHEERS) : pick(CONCEDE_REACT)}
                      </div>
                      {youScored && streakBonus >= 2 && (
                        <div style={{ marginTop: 8, padding: '4px 14px', borderRadius: 20, background: `${C.gold}20`, border: `1px solid ${C.gold}40`, animation: 'goalBurst 0.4s ease 0.3s both', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: C.gold, textShadow: `0 0 15px ${C.gold}` }}>{streakLabel}</span>
                          <span style={{ fontSize: 9, color: C.gold }}>+{streakBonus * 10} bonus</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Grass / penalty spot strip */}
            <div style={{ width: goalW, height: 20, background: `linear-gradient(180deg, ${C.green}08, transparent)`, borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              {isShoot && <div style={{ width: 6, height: 6, borderRadius: '50%', background: `${C.text}20`, boxShadow: `0 0 8px ${C.text}10` }} />}
            </div>
          </>
        )}

        {/* ═══ INTRO ═══ */}
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

        {/* ═══ SHOOT INSTRUCTION (FK1) ═══ */}
        {!isFK2 && isShoot && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.text2, fontWeight: 600 }}>👆 Pick your corner</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: actionTimer <= 1 ? C.red : C.gold, minWidth: 20, animation: actionTimer <= 1 ? 'pulse 0.5s infinite' : 'none' }}>{actionTimer}s</span>
            </div>
          </div>
        )}

        {/* ═══ FK2 PHASE LABEL + HOLD TO PUFF ═══ */}
        {isFK2 && isShoot && (fk2Phase === 'x' || fk2Phase === 'y') && (
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: fk2Phase === 'x' ? C.cyan : C.orange }}>
                {fk2Phase === 'x' ? '← HORIZONTAL AIM →' : '↕ VERTICAL AIM'}
              </span>
            </div>
            {fk2Phase === 'x' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: goalW, margin: '0 auto 6px' }}>
                <span style={{ fontSize: 7, color: C.red }}>WIDE</span>
                <span style={{ fontSize: 7, color: C.text3 }}>LEFT</span>
                <span style={{ fontSize: 7, color: C.green, fontWeight: 700 }}>🎯 SWEET SPOT</span>
                <span style={{ fontSize: 7, color: C.text3 }}>RIGHT</span>
                <span style={{ fontSize: 7, color: C.red }}>WIDE</span>
              </div>
            )}
            {fk2Phase === 'y' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 7, color: C.text3 }}>GROUND</span>
                <span style={{ fontSize: 7, color: C.green, fontWeight: 700 }}>🎯 SWEET SPOT</span>
                <span style={{ fontSize: 7, color: C.red }}>OVER BAR</span>
                <span style={{ fontSize: 7, color: C.green }}>X: {Math.round(fk2X)}% ✓</span>
              </div>
            )}
            <div
              data-btn="true"
              onMouseDown={() => { handlePuffDown(); playFx('charge') }}
              onMouseUp={handlePuffUp}
              onMouseLeave={handlePuffUp}
              onTouchStart={(e) => { e.preventDefault(); handlePuffDown(); playFx('charge') }}
              onTouchEnd={handlePuffUp}
              style={{
                marginTop: 4, padding: kickCharging ? '14px 20px' : '12px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                background: kickCharging
                  ? `linear-gradient(135deg, ${fk2Phase === 'x' ? C.cyan : C.orange}30, ${fk2Phase === 'x' ? C.cyan : C.orange}10)`
                  : `linear-gradient(135deg, ${fk2Phase === 'x' ? C.cyan : C.orange}20, ${fk2Phase === 'x' ? C.cyan : C.orange}08)`,
                border: `1px solid ${kickCharging ? (fk2Phase === 'x' ? C.cyan : C.orange) + '60' : (fk2Phase === 'x' ? C.cyan : C.orange) + '40'}`,
                fontSize: 14, fontWeight: 900,
                color: fk2Phase === 'x' ? C.cyan : C.orange,
                animation: kickCharging ? 'none' : 'countPulse 1s infinite',
                boxShadow: kickCharging ? `0 0 25px ${fk2Phase === 'x' ? C.cyan : C.orange}25` : `0 0 15px ${fk2Phase === 'x' ? C.cyan : C.orange}12`,
                transform: kickCharging ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.15s', userSelect: 'none', WebkitUserSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span>
                  {kickCharging
                    ? (fk2Phase === 'x' ? `← AIMING... ${Math.round(kickPower)}% →` : `↕ POWERING... ${Math.round(kickPower)}%`)
                    : (fk2Phase === 'x' ? '⚽ HOLD TO AIM ← →' : '⚽ HOLD TO POWER ↕')}
                </span>
                {!kickCharging && <span style={{ fontSize: 12, fontWeight: 900, color: actionTimer <= 1 ? C.red : C.gold, minWidth: 20, animation: actionTimer <= 1 ? 'pulse 0.5s infinite' : 'none' }}>{actionTimer}s</span>}
              </div>
              <div style={{ fontSize: 7, color: `${fk2Phase === 'x' ? C.cyan : C.orange}70`, marginTop: 2 }}>
                {kickCharging
                  ? (fk2Phase === 'x' ? 'Longer puff = further RIGHT' : 'Longer puff = HIGHER')
                  : (fk2Phase === 'x' ? 'Aim LEFT/RIGHT · Hold & release' : 'Aim HEIGHT · Hold & release')}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PUFF DURATION METER (power phase, FK1) ═══ */}
        {isPower && (
          <div style={{ width: goalW, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, padding: '0 2px' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: zoneColor }}>{kickCharging ? (zone === 'perfect' ? '💨👑 PERFECT PUFF' : zone === 'good' ? 'Good puff 👌' : zone === 'short' ? 'Short puff' : zone === 'tap' ? 'Barely a puff' : 'Too long! 📉') : 'PUFF DURATION'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {kickCharging && <span style={{ fontSize: 10, fontWeight: 900, color: zoneColor, fontFamily: 'monospace' }}>{elapsed.toFixed(1)}s</span>}
                {!kickCharging && <span style={{ fontSize: 10, fontWeight: 900, color: actionTimer <= 1 ? C.red : C.gold, animation: actionTimer <= 1 ? 'pulse 0.5s infinite' : 'none' }}>{actionTimer}s</span>}
              </div>
            </div>
            <div style={{
              height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
              border: `2px solid ${kickCharging ? zoneColor + '60' : 'rgba(255,255,255,0.1)'}`,
              position: 'relative', transition: 'border-color 0.2s',
              boxShadow: kickCharging ? `0 0 15px ${zoneColor}25` : 'none',
              animation: !kickCharging ? 'countPulse 2s infinite' : 'none',
            }}>
              {/* Sweet spot highlight */}
              <div style={{ position: 'absolute', left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%`, height: '100%', background: `${C.green}08`, borderLeft: `1px solid ${C.green}30`, borderRight: `1px solid ${C.green}30` }} />
              <div style={{ position: 'absolute', left: `${sweetMin + 2}%`, top: 2, fontSize: 7, color: `${C.green}50`, fontWeight: 800, zIndex: 2 }}>SWEET</div>
              {!kickCharging && kickPower === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: `${C.text3}80`, animation: 'countPulse 1.5s infinite' }}>⬇️ Press & Hold below to charge</span>
                </div>
              )}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: `${kickPower}%`, background: barColor,
                borderRadius: 12, transition: 'width 0.05s linear',
                boxShadow: kickCharging ? `0 0 20px ${zoneColor}40` : `0 0 8px ${C.cyan}20`, zIndex: 1,
              }} />
              {kickPower > 8 && (
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 900, color: '#fff', textShadow: '0 0 6px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)', zIndex: 3 }}>
                  {Math.round(kickPower)}%
                </div>
              )}
              <div style={{ position: 'absolute', top: 0, left: '15%', width: 1, height: '100%', background: 'rgba(255,255,255,0.1)', zIndex: 2 }} />
              <div style={{ position: 'absolute', top: 0, left: '40%', width: 1, height: '100%', background: 'rgba(255,255,255,0.12)', zIndex: 2 }} />
              <div style={{ position: 'absolute', top: 0, left: `${sweetMax}%`, width: 2, height: '100%', background: `${C.red}40`, zIndex: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, padding: '0 2px' }}>
              <span style={{ fontSize: 6, color: C.text3 }}>TAP</span>
              <span style={{ fontSize: 6, color: C.text3 }}>SHORT</span>
              <span style={{ fontSize: 6, color: C.text3 }}>GOOD</span>
              <span style={{ fontSize: 6, color: C.green, fontWeight: 700 }}>PERFECT 💨</span>
              <span style={{ fontSize: 6, color: C.red }}>BLINKER 💀</span>
            </div>
            {/* Hold-to-puff button */}
            <div
              data-btn="true"
              onMouseDown={() => { handlePuffDown(); playFx('charge') }}
              onMouseUp={handlePuffUp}
              onMouseLeave={handlePuffUp}
              onTouchStart={(e) => { e.preventDefault(); handlePuffDown(); playFx('charge') }}
              onTouchEnd={handlePuffUp}
              style={{
                marginTop: 6, padding: kickCharging ? '16px 20px' : '14px 20px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                background: kickCharging ? `linear-gradient(135deg, ${zoneColor}30, ${zoneColor}10)` : `linear-gradient(135deg, ${C.cyan}25, ${C.cyan}08)`,
                border: `2px solid ${kickCharging ? zoneColor + '60' : C.cyan + '40'}`,
                fontSize: 15, fontWeight: 900,
                color: kickCharging ? zoneColor : C.cyan,
                animation: kickCharging ? 'none' : 'countPulse 1.2s infinite',
                boxShadow: kickCharging ? `0 0 30px ${zoneColor}30, inset 0 0 20px ${zoneColor}08` : `0 0 20px ${C.cyan}15`,
                transform: kickCharging ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s', userSelect: 'none', WebkitUserSelect: 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {kickCharging && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${kickPower}%`, background: `${zoneColor}12`, transition: 'width 0.06s linear', borderRadius: 16 }} />}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {kickCharging
                  ? (zone === 'perfect' ? '🎯 RELEASE NOW!' : zone === 'blinker' ? '💀 BLINKER! LET GO!' : zone === 'good' ? '💨 Almost... keep going!' : `⚽ CHARGING... ${elapsed.toFixed(1)}s`)
                  : '💨 HOLD TO KICK ⚽'}
                <div style={{ fontSize: 8, color: `${kickCharging ? zoneColor : C.cyan}80`, marginTop: 3 }}>
                  {kickCharging
                    ? (zone === 'perfect' ? `🎯 ${elapsed.toFixed(1)}s — SWEET SPOT! RELEASE!` : `${elapsed.toFixed(1)}s — Hold for 2.5-3.5s`)
                    : 'Hold & release in the SWEET SPOT 💨👑'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAVE READY ═══ */}
        {isSaveReady && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🧤</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.orange, textShadow: `0 0 15px ${C.orange}40` }}>YOUR TURN TO SAVE</span>
            </div>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 10, fontStyle: 'italic' }}>"AI is stepping up... look confident 😤"</div>
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
              style={{
                padding: '14px 36px', borderRadius: 14, cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.orange}20, ${C.orange}08)`,
                border: `1px solid ${C.orange}35`,
                fontSize: 15, fontWeight: 900, color: C.orange,
                boxShadow: `0 0 20px ${C.orange}15`,
                animation: 'countPulse 1.2s infinite',
              }}
            >BRING IT ON 🔥</div>
          </div>
        )}

        {/* ═══ SAVE COUNTDOWN ═══ */}
        {isSaveCountdown && (
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, animation: 'breathe 0.5s infinite' }}>💨</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: C.gold, textShadow: `0 0 15px ${C.gold}40` }}>AI winding up...</span>
            </div>
            <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Watch for the hint!</div>
          </div>
        )}

        {/* ═══ SAVE DIVE INSTRUCTION ═══ */}
        {isSaveDive && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: C.orange, animation: 'countPulse 0.4s infinite', textShadow: `0 0 15px ${C.orange}60` }}>🧤 DIVE NOW!</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: actionTimer <= 1 ? C.red : C.gold, animation: actionTimer <= 1 ? 'pulse 0.5s infinite' : 'none' }}>{actionTimer}s</span>
            </div>
            <div style={{ fontSize: 8, color: C.text3, marginTop: 1 }}>👆 TAP a zone!</div>
          </div>
        )}

        {/* ═══ BONUS OFFER ═══ */}
        {phase === 'bonus_offer' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 18, animation: 'gentleFloat 1s infinite' }}>⚡🎰⚡</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.gold, textShadow: `0 0 15px ${C.gold}40` }}>BONUS SHOT!</span>
            </div>
            <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>Tighter sweet spot · Double score if you nail it!</div>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 12, fontStyle: 'italic' }}>"{opponent.name}: 'No way you hit this one' 😏"</div>
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
                style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${C.gold}25, ${C.gold}08)`, border: `1px solid ${C.gold}40`, fontSize: 14, fontWeight: 900, color: C.gold, boxShadow: `0 0 20px ${C.gold}15`, animation: 'countPulse 1s infinite' }}
              >🔥 BRING IT</div>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); setBonusAvail(false); setPhase('final'); phaseRef.current = 'final'; if (!endSoundFiredRef.current) { endSoundFiredRef.current = true; playFx(score.you > score.ai ? 'win' : 'lose') }; awardGame({ won: score.you > score.ai, baseCoins: score.you > score.ai ? 80 : 12, baseXP: score.you > score.ai ? 20 : 8 }) }}
                style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}08`, border: `1px solid ${C.text3}20`, fontSize: 14, fontWeight: 700, color: C.text3 }}
              >Skip →</div>
            </div>
          </div>
        )}

        {/* ═══ FINAL RESULT ═══ */}
        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            {won && <div style={{ fontSize: 30, marginBottom: 6, animation: 'gentleFloat 1s infinite' }}>🎉🏆🎉</div>}
            {!won && !draw && <div style={{ fontSize: 30, marginBottom: 6 }}>😤💀😂</div>}
            {draw && <div style={{ fontSize: 30, marginBottom: 6 }}>🤝⚽🤝</div>}
            <div style={{ fontSize: 28, fontWeight: 900, color: won ? C.green : draw ? C.gold : C.red, marginBottom: 4, textShadow: `0 0 30px ${won ? C.green : draw ? C.gold : C.red}60`, animation: 'countPulse 0.8s ease' }}>
              {won ? 'YOU WIN!' : draw ? 'DRAW!' : 'DEFEATED'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>😎</div>
                <div style={{ fontSize: 9, color: C.cyan, fontWeight: 700 }}>Steve</div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', textShadow: `0 0 20px ${won ? C.green : draw ? C.gold : C.red}40` }}>
                {score.you} — {score.ai}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{opponent.emoji}</div>
                <div style={{ fontSize: 9, color: C.red, fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opponent.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.text2, marginBottom: 6, fontStyle: 'italic', maxWidth: 280 }}>
              "{won ? pick(WIN_MSGS) : draw ? "Fair game! Both high af apparently 😂" : pick(LOSE_MSGS)}"
            </div>
            <div style={{ padding: 10, borderRadius: 10, ...GLASS_CARD, marginBottom: 10, width: '100%', maxWidth: 260 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                <span style={{ color: C.text }}>Earned</span>
                <span style={{ color: C.gold }}>+{won ? 80 : draw ? 30 : 10} 🪙</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); startGame() }}
                style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${C.cyan}18, ${C.cyan}06)`, border: `1px solid ${C.cyan}30`, fontSize: 14, fontWeight: 800, color: C.cyan, boxShadow: `0 0 15px ${C.cyan}10` }}
              >🔄 Rematch</div>
              <div
                data-btn="true"
                onClick={(e) => { e.stopPropagation(); navigate('/arcade') }}
                style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${C.green}18, ${C.green}06)`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, boxShadow: `0 0 15px ${C.green}10` }}
              >💰 Collect</div>
            </div>
          </div>
        )}

        {/* Commentary */}
        {!isFinal && (
          <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', textAlign: 'center' }}>{commentary || kickComment}</div>
        )}

        {/* ─── Shoot taunts during shoot phase ─── */}
        {isShoot && !isFK2 && (
          <div style={{ fontSize: 9, color: C.text3, fontStyle: 'italic', textAlign: 'center', marginTop: 4, opacity: 0.7 }}>
            {pick(SHOOT_TAUNTS)}
          </div>
        )}
      </div>
    </div>
  )
}
