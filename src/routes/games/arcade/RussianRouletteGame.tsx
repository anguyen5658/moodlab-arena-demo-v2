import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { PuffBar } from '../../../components/shared/PuffBar'

const RR_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const RR_PLAYER_COLORS = ['#FF6B8A', '#00E5FF', '#FFD93D', '#7CFF6B', '#C084FC', '#FF8800']

const RR_AI = [
  { name: 'Lucky Luke', emoji: '🤠' },
  { name: 'Nervous Nick', emoji: '😰' },
  { name: 'Bold Betty', emoji: '💪' },
  { name: 'Chill Chad', emoji: '😎' },
  { name: 'Sweaty Steve', emoji: '😓' },
]

const RR_COMMENTS = {
  spin: ['The revolver SPINS... 🔄', 'Round and round it goes...', 'Where it stops, nobody knows! 🎲', 'Fate is loading... 💀'],
  click: ['*CLICK*... SAFE! 😮‍💨', 'Empty chamber! You live! ✨', 'The luck continues... 🍀', 'Phew! Not this time!'],
  bang: ['BANG! 💥🔫', 'IT FIRED! 💀', 'The chamber was LOADED! 💥', 'Game over for this one... 🪦'],
  dodge: ['BLINKER DODGE! 💀', 'Your lungs are your guardian angel 👼', 'Smoke screen activated! 🫁💨', 'The cloud of smoke saved you!! 🌫️'],
  aiPuff: ["AI pulls trigger like it's checking email 📧", "Nervous Nick's hands are shaking...", "Bold Betty doesn't even flinch 💪", 'Chill Chad yawns and pulls 🥱', 'Lucky Luke tips his hat 🤠'],
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const rrGetDodgeChance = (chargePercent: number): number => {
  if (chargePercent < 10) return 0
  if (chargePercent < 25) return 3
  if (chargePercent < 50) return 8
  if (chargePercent < 80) return 15
  return 30
}

const rrGetPuffTier = (chargePercent: number) => {
  if (chargePercent < 10) return { name: 'Tap', color: C.text3, emoji: '😐' }
  if (chargePercent < 25) return { name: 'Short', color: C.text2, emoji: '😤' }
  if (chargePercent < 50) return { name: 'Good', color: C.cyan, emoji: '💨' }
  if (chargePercent < 80) return { name: 'Long', color: C.gold, emoji: '🌬️' }
  return { name: 'BLINKER', color: C.red, emoji: '🫁🔥' }
}

interface Player {
  name: string
  emoji: string
  isYou: boolean
  isAI: boolean
  isHuman: boolean
  alive: boolean
  dodges: number
  survived: number
  color: string
  deviceSlot?: number
}

type Phase = 'intro' | 'spinning' | 'player_turn' | 'puffing' | 'pulling' | 'click' | 'bang' | 'result' | null

export const RussianRouletteGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [chamber, setChamber] = useState(0)
  const [currentChamber, setCurrentChamber] = useState(0)
  const [comment, setComment] = useState('')
  const [eliminated, setEliminated] = useState<Player | null>(null)
  const [round, setRound] = useState(0)
  const [spinAngle, setSpinAngle] = useState(0)
  const [tension, setTension] = useState(0)
  const [puffCharge, setPuffCharge] = useState(0)
  const [eliminatedList, setEliminatedList] = useState<Player[]>([])
  const [winner, setWinner] = useState<Player | null>(null)
  const [chambers, setChambers] = useState<boolean[]>([false, false, false, false, false, false])
  const [sweetSpot] = useState({ min: 55, max: 80 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const puffIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStartRef = useRef<number>(0)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)

  const phaseRef = useRef<Phase>(null)
  const playersRef = useRef<Player[]>([])
  const currentTurnRef = useRef(0)
  const chamberRef = useRef(0)
  const currentChamberRef = useRef(0)
  const chambersRef = useRef<boolean[]>([false, false, false, false, false, false])
  const spinAngleRef = useRef(0)
  const tensionRef = useRef(0)
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { currentTurnRef.current = currentTurn }, [currentTurn])
  useEffect(() => { chamberRef.current = chamber }, [chamber])
  useEffect(() => { currentChamberRef.current = currentChamber }, [currentChamber])
  useEffect(() => { chambersRef.current = chambers }, [chambers])
  useEffect(() => { spinAngleRef.current = spinAngle }, [spinAngle])
  useEffect(() => { tensionRef.current = tension }, [tension])

  const findNextAlive = useCallback((list: Player[], fromIdx: number): number | null => {
    for (let i = 1; i <= list.length; i++) {
      const ni = (fromIdx + i) % list.length
      if (list[ni].alive) return ni
    }
    return null
  }, [])

  const startTurnRef = useRef<(list: Player[], idx: number, bullet: number, chamberPos: number) => void>(() => {})
  const resolveTurnRef = useRef<(list: Player[], idx: number, bullet: number, chamberPos: number, dodgeCharge: number) => void>(() => {})

  resolveTurnRef.current = (list, idx, bullet, chamberPos, dodgeCharge) => {
    const newChamber = (chamberPos + 1) % 6
    const isLoaded = newChamber === bullet
    setCurrentChamber(newChamber)
    setRound(r => r + 1)
    const dodgePct = rrGetDodgeChance(dodgeCharge)
    const dodged = isLoaded && Math.random() * 100 < dodgePct
    setChambers(ch => { const c = [...ch]; c[newChamber] = true; return c })
    audio.playFx('gun_click')
    if (isLoaded && !dodged) {
      setPhase('bang')
      setComment(pick(RR_COMMENTS.bang))
      setEliminated(list[idx])
      audio.playFx('gun_bang')
      const up = list.map((p, i) => i === idx ? { ...p, alive: false } : p)
      setPlayers(up)
      setEliminatedList(el => [...el, list[idx]])
      setTension(t => Math.min(100, t + 20))
      setTimeout(() => {
        if (!activeRef.current.v) return
        const aliveCount = up.filter(p => p.alive).length
        if (aliveCount <= 1) {
          const w = up.find(p => p.alive) || null
          setWinner(w)
          setPhase('result')
          if (w && w.isYou) {
            player.spawnConfetti(50, [C.gold, C.green, C.cyan, C.pink])
            audio.playFx('win')
            audio.playFx('crowd')
          } else {
            audio.playFx('lose')
          }
        } else {
          const nb = Math.floor(Math.random() * 6)
          setChamber(nb)
          setCurrentChamber(0)
          setChambers([false, false, false, false, false, false])
          setPhase('spinning')
          setSpinAngle(a => a + 720 + Math.random() * 720)
          setComment(`Respinning... ${aliveCount} remain`)
          audio.playFx('revolver_spin')
          setTimeout(() => {
            if (!activeRef.current.v) return
            const next = findNextAlive(up, idx)
            if (next !== null) {
              setPhase('player_turn')
              startTurnRef.current(up, next, nb, 0)
            }
          }, 2200)
        }
      }, 2500)
    } else if (isLoaded && dodged) {
      setPhase('click')
      setComment(pick(RR_COMMENTS.dodge))
      audio.playFx('win')
      if (dodgeCharge >= 80) audio.playFx('laugh')
      const up = list.map((p, i) => i === idx ? { ...p, dodges: p.dodges + 1, survived: p.survived + 1 } : p)
      setPlayers(up)
      setTension(t => Math.min(100, t + 15))
      setTimeout(() => {
        if (!activeRef.current.v) return
        const nb = Math.floor(Math.random() * 6)
        setChamber(nb)
        setCurrentChamber(0)
        setChambers([false, false, false, false, false, false])
        setPhase('spinning')
        setSpinAngle(a => a + 720 + Math.random() * 720)
        setComment('Respinning after dodge...')
        audio.playFx('revolver_spin')
        setTimeout(() => {
          if (!activeRef.current.v) return
          const next = findNextAlive(up, idx)
          if (next !== null) {
            setPhase('player_turn')
            startTurnRef.current(up, next, nb, 0)
          }
        }, 2200)
      }, 2000)
    } else {
      setPhase('click')
      setComment(pick(RR_COMMENTS.click))
      audio.playFx('select')
      const up = list.map((p, i) => i === idx ? { ...p, survived: p.survived + 1 } : p)
      setPlayers(up)
      setTension(t => Math.min(100, t + 8))
      setTimeout(() => {
        if (!activeRef.current.v) return
        const next = findNextAlive(up, idx)
        if (next !== null) {
          setPhase('player_turn')
          startTurnRef.current(up, next, bullet, newChamber)
        }
      }, 1800)
    }
  }

  startTurnRef.current = (list, idx, bullet, chamberPos) => {
    const p = list[idx]
    if (!p.alive) {
      const next = findNextAlive(list, idx)
      if (next === null) return
      setCurrentTurn(next)
      setTimeout(() => startTurnRef.current(list, next, bullet, chamberPos), 200)
      return
    }
    setCurrentTurn(idx)
    setPuffCharge(0)
    if (p.isAI) {
      setComment(pick(RR_COMMENTS.aiPuff))
      audio.playFx('select')
      setTimeout(() => {
        if (!activeRef.current.v) return
        setPhase('pulling')
        setTimeout(() => {
          if (!activeRef.current.v) return
          resolveTurnRef.current(list, idx, bullet, chamberPos, Math.random() * 60)
        }, 800)
      }, 1200 + Math.random() * 800)
    } else {
      const rrTurnName = p.isYou ? 'YOUR' : `${p.name}'s`
      setComment(`${rrTurnName} TURN... Hold to puff for dodge chance!`)
      setPhase('player_turn')
      audio.playFx('select')
    }
  }

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    const mpCount = (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) ? (ble.ssPlayerCount || 0) : 0
    const list: Player[] = []
    if (mpCount > 0) {
      list.push({ name: ble.partyPlayerNames[0] || 'You', emoji: '😤', isYou: true, isAI: false, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[0], deviceSlot: 0 })
      for (let s = 1; s < mpCount; s++) {
        list.push({ name: ble.partyPlayerNames[s] || `P${s + 1}`, emoji: '🎮', isYou: false, isAI: false, isHuman: true, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[s], deviceSlot: s })
      }
      const shuffled = [...RR_AI].sort(() => Math.random() - 0.5).slice(0, 6 - mpCount)
      shuffled.forEach((a, i) => list.push({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[(mpCount + i) % 6] }))
    } else {
      const shuffled = [...RR_AI].sort(() => Math.random() - 0.5).slice(0, 5)
      const aiPlayers: Player[] = shuffled.map((a, i) => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[(i + 1) % 6] }))
      const youIdx = Math.floor(Math.random() * (aiPlayers.length + 1))
      aiPlayers.splice(youIdx, 0, { name: 'You', emoji: '😤', isYou: true, isAI: false, isHuman: false, alive: true, dodges: 0, survived: 0, color: RR_PLAYER_COLORS[0] })
      list.push(...aiPlayers)
    }
    const bullet = Math.floor(Math.random() * 6)
    setPlayers(list)
    setCurrentTurn(0)
    setChamber(bullet)
    setCurrentChamber(0)
    setComment('')
    setEliminated(null)
    setRound(0)
    setSpinAngle(0)
    setTension(0)
    setPuffCharge(0)
    setEliminatedList([])
    setWinner(null)
    setChambers([false, false, false, false, false, false])
    setPhase('intro')
    audio.playFx('crowd')
    setTimeout(() => {
      if (!activeRef.current.v) return
      setPhase('spinning')
      setSpinAngle(1080 + Math.random() * 720)
      setComment(pick(RR_COMMENTS.spin))
      audio.playFx('revolver_spin')
      setTimeout(() => {
        if (!activeRef.current.v) return
        setPhase('player_turn')
        setTension(10)
        startTurnRef.current(list, 0, bullet, 0)
      }, 2500)
    }, 4000)
  }, [audio, ble])

  const stopPuff = useCallback(() => {
    if (phaseRef.current !== 'puffing') return
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    const charge = Math.min(100, ((Date.now() - puffStartRef.current) / 5000) * 100)
    setPuffCharge(charge)
    setPhase('pulling')
    const tier = rrGetPuffTier(charge)
    setComment(`${tier.name} puff! ${tier.emoji} (${rrGetDodgeChance(charge)}% dodge)`)
    if (charge >= 80) audio.playFx('laugh')
    setTimeout(() => {
      if (!activeRef.current.v) return
      resolveTurnRef.current(playersRef.current, currentTurnRef.current, chamberRef.current, currentChamberRef.current, charge)
    }, 600)
  }, [audio])

  const startPuff = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return
    const cur = playersRef.current[currentTurnRef.current]
    if (!cur || cur.isAI) return
    setPhase('puffing')
    setPuffCharge(0)
    puffStartRef.current = Date.now()
    audio.playFx('charge')
    if (puffIntervalRef.current) clearInterval(puffIntervalRef.current)
    puffIntervalRef.current = setInterval(() => {
      const e = (Date.now() - puffStartRef.current) / 1000
      setPuffCharge(Math.min(100, (e / 5.0) * 100))
      if (e >= 5.5) stopPuff()
    }, 50)
  }, [audio, stopPuff])

  const tapPull = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return
    resolveTurnRef.current(playersRef.current, currentTurnRef.current, chamberRef.current, currentChamberRef.current, 0)
  }, [])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
    const won = winner && winner.isYou
    const baseR = won ? 30 : 5
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(!!won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(won ? `SURVIVOR! +${baseR} coins!` : `Eliminated! +${baseR}`, won ? C.green : C.red)
    setPhase(null)
    game.exitGame()
  }, [audio, player, ble, game, winner])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / RR_DPR
    const H = canvas.height / RR_DPR
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(RR_DPR, RR_DPR)
    const now = Date.now()
    const list = playersRef.current
    const curIdx = currentTurnRef.current
    const p = phaseRef.current

    const bgGrad = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, Math.max(W, H) * 0.8)
    bgGrad.addColorStop(0, '#12091a')
    bgGrad.addColorStop(0.3, '#0d0815')
    bgGrad.addColorStop(0.6, '#0a0510')
    bgGrad.addColorStop(1, '#050208')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    const vigI = p === 'bang' ? 0.9 : p === 'puffing' ? 0.7 : 0.45
    const vigGrad = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.15, W / 2, H * 0.42, W * 0.65)
    vigGrad.addColorStop(0, 'transparent')
    vigGrad.addColorStop(1, `rgba(0,0,0,${vigI})`)
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, W, H)

    const t = tensionRef.current
    if (t > 30) {
      const tAlpha = 0.05 + (t / 100) * 0.15
      const tR = t > 60 ? '180,30,30' : '120,40,20'
      ctx.strokeStyle = `rgba(${tR},${tAlpha})`
      ctx.lineWidth = 20
      ctx.strokeRect(-10, -10, W + 20, H + 20)
    }

    const cx = W / 2, cy = H * 0.42, tableR = Math.min(W, H) * 0.26
    ctx.beginPath()
    ctx.ellipse(cx, cy, tableR, tableR * 0.6, 0, 0, Math.PI * 2)
    const tableGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy, tableR)
    tableGrad.addColorStop(0, '#1a1510')
    tableGrad.addColorStop(0.7, '#0f0c08')
    tableGrad.addColorStop(1, '#080604')
    ctx.fillStyle = tableGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(120,80,40,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const gunPulse = 1 + 0.03 * Math.sin(now / 300)
    const gunAngle = (spinAngleRef.current || 0) * (Math.PI / 180)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(gunPulse, gunPulse)
    ctx.rotate(gunAngle)
    ctx.font = '36px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔫', 0, 0)
    ctx.restore()

    if (p === 'spinning') {
      const sAlpha = 0.6 + 0.4 * Math.sin(now / 150)
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(255,217,61,${sAlpha})`
      ctx.fillText('SPINNING...', cx, cy + 28)
    }

    for (let c = 0; c < 6; c++) {
      const cAngle = (c / 6) * Math.PI * 2 - Math.PI / 2
      const cR = 22
      const dotX = cx + Math.cos(cAngle) * cR
      const dotY = cy + Math.sin(cAngle) * cR
      const isRevealed = chambersRef.current[c]
      const isCurrent = c === currentChamberRef.current
      ctx.beginPath()
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
      if (isRevealed) {
        ctx.fillStyle = c === chamberRef.current ? '#FF3333' : '#33FF33'
      } else if (isCurrent) {
        ctx.fillStyle = 'rgba(255,217,61,0.7)'
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
      }
      ctx.fill()
    }

    const total = list.length
    const seatR = tableR + 35
    for (let i = 0; i < total; i++) {
      const pl = list[i]
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      const px = cx + Math.cos(angle) * seatR
      const py = cy + Math.sin(angle) * (seatR * 0.65)
      const isCur = i === curIdx && p !== 'bang' && p !== 'result'
      const isElim = !pl.alive
      const dotR = isCur ? 20 : 16
      if (isElim) {
        ctx.beginPath()
        ctx.arc(px, py, dotR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(40,40,40,0.5)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(80,80,80,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💀', px, py)
        ctx.font = 'bold 7px sans-serif'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fillText(pl.isYou ? 'YOU' : pl.name, px, py + dotR + 3)
        continue
      }
      if (isCur) {
        const glowC = pl.isYou ? 'rgba(0,229,255,0.2)' : 'rgba(255,136,0,0.2)'
        const pulseR = dotR + 5 + 3 * Math.sin(now / 180)
        ctx.beginPath()
        ctx.arc(px, py, pulseR, 0, Math.PI * 2)
        ctx.fillStyle = glowC
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(px, py, dotR, 0, Math.PI * 2)
      const pColor = pl.color || RR_PLAYER_COLORS[i % 6]
      ctx.fillStyle = isCur ? pColor : pColor + '80'
      ctx.fill()
      ctx.strokeStyle = isCur ? (pl.isYou ? '#00E5FF' : '#FF8800') : 'rgba(255,255,255,0.12)'
      ctx.lineWidth = isCur ? 2.5 : 1.5
      ctx.stroke()
      ctx.font = `${dotR * 0.85}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(pl.emoji, px, py)
      ctx.font = 'bold 8px sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isCur ? (pl.isYou ? '#00E5FF' : '#FFA500') : 'rgba(255,255,255,0.5)'
      ctx.fillText(pl.isYou ? 'YOU' : pl.name, px, py + dotR + 3)
    }

    if (p === 'bang') {
      const bangAlpha = 0.15 + 0.1 * Math.sin(now / 80)
      ctx.fillStyle = `rgba(255,0,0,${bangAlpha})`
      ctx.fillRect(0, 0, W, H)
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FF0000'
      ctx.fillText('💥', cx, cy - 50)
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('BANG!', cx, cy - 20)
    }
    if (p === 'click') {
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#33FF88'
      ctx.fillText('*click*', cx, cy - 45)
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText('SAFE', cx, cy - 25)
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'russian') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      drawCanvas()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [drawCanvas])

  useEffect(() => {
    if (game.gameActive?.id !== 'russian') return
    const down = () => startPuff()
    const up = () => stopPuff()
    ble.registerPuffHandlers('russian', down, up)
    // Turn-based MP: only current turn player's device slot fires; AI turns get null
    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      const handlers: { [slot: number]: { down: (() => void) | null; up: (() => void) | null } } = {}
      const pList = playersRef.current
      const curTurn = currentTurnRef.current
      for (let s = 0; s < (ble.ssPlayerCount || 2); s++) {
        const p = pList.find(pp => (pp as any).deviceSlot === s)
        if (p && pList.indexOf(p) === curTurn && !p.isAI) {
          handlers[s] = { down, up }
        } else {
          handlers[s] = { down: null, up: null }
        }
      }
      ble.registerSlotPuffHandlers(handlers)
    }
    return () => {
      audio.gameSoundsMuted.current = true
      activeRef.current.v = false
      if (puffIntervalRef.current) { clearInterval(puffIntervalRef.current); puffIntervalRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, currentTurn, ble.mpActive])

  if (!phase || game.gameActive?.id !== 'russian') return null

  const curP = players[currentTurn]
  const isYourTurn = curP && curP.isYou && phase === 'player_turn'
  const isPuffing = phase === 'puffing'
  const aliveCount = players.filter(p => p.alive).length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(255,50,50,0.1)' }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: ble.bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${ble.bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ble.bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: ble.bleConnected ? C.green : C.orange }}>{ble.bleConnected ? 'Puff' : 'Connect'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>🪙</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{player.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={() => { audio.playFx('tap'); endGame() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0, touchAction: 'none' }}>
            <span style={{ fontSize: 10, color: C.text2 }}>←</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.red }}>🔫 RUSSIAN ROULETTE</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/6 alive</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {round + 1}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: curP ? (curP.isYou ? C.cyan : C.orange) : C.text3 }}>
            {phase === 'intro' ? 'Preparing...' : phase === 'spinning' ? 'Spinning chamber...' : phase === 'result' ? 'Game Over' : curP ? (curP.isYou ? 'YOUR TURN' : `${curP.name}'s turn`) : '...'}
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * RR_DPR)} height={Math.round(600 * RR_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {phase === 'bang' && eliminated && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,0,0,0.6)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💥💀💥</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{eliminated.isYou ? 'YOU GOT HIT!' : `${eliminated.name} ELIMINATED!`}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
          </div>
        )}

        {phase === 'result' && (() => {
          const rrWon = winner && winner.isYou
          const baseR = rrWon ? 30 : 5
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{rrWon ? '👑' : '💀'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: rrWon ? C.green : C.red }}>{rrWon ? 'SOLE SURVIVOR!' : winner ? `${winner.name} WINS!` : 'Game Over!'}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>+{baseR} coins</div>
              <div style={{ marginTop: 14, textAlign: 'left', width: '80%', maxWidth: 260 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
                {eliminatedList.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
                    <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? 'You' : p.name}</span>
                  </div>
                ))}
                {winner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <span style={{ fontSize: 8, color: C.gold }}>👑 Winner</span>
                    <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{winner.isYou ? 'You' : winner.name}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.red}15`, border: `1px solid ${C.red}30`, fontSize: 13, fontWeight: 800, color: C.red, touchAction: 'none' }}>Play Again</div>
                <div onClick={endGame} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>

      <div style={{ position: 'relative', zIndex: 60, flexShrink: 0, padding: '8px 12px 14px', background: 'rgba(6,16,30,0.98)', borderTop: '1px solid rgba(255,50,50,0.08)' }}>
        {isPuffing && (
          <div style={{ marginBottom: 6 }}>
            <PuffBar power={puffCharge} charging={true} sweetSpot={sweetSpot} blinkerUsed={false} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 7, color: C.text3 }}>Tap (0%)</span>
              <span style={{ fontSize: 7, color: C.cyan }}>Short (3%)</span>
              <span style={{ fontSize: 7, color: C.gold }}>Long (15%)</span>
              <span style={{ fontSize: 7, color: C.red }}>BLINKER (80%)</span>
            </div>
          </div>
        )}
        {isYourTurn && !isPuffing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={(e) => { e.stopPropagation(); tapPull() }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(255,50,50,0.15),rgba(200,0,0,0.08))', border: '2px solid rgba(255,50,50,0.3)', userSelect: 'none', touchAction: 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.red, letterSpacing: 1 }}>TAP PULL</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>No dodge bonus</div>
            </div>
            <div
              onMouseDown={(e) => { e.stopPropagation(); startPuff() }}
              onMouseUp={(e) => { e.stopPropagation(); stopPuff() }}
              onMouseLeave={stopPuff}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startPuff() }}
              onTouchEnd={(e) => { e.stopPropagation(); stopPuff() }}
              onTouchCancel={(e) => { e.stopPropagation(); stopPuff() }}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,229,255,0.12),rgba(192,132,252,0.06))', border: '2px solid rgba(0,229,255,0.2)', userSelect: 'none', touchAction: 'none' }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>PUFF PULL</div>
              <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Hold = dodge %</div>
            </div>
          </div>
        )}
        {phase !== 'result' && curP && curP.isAI && phase !== 'intro' && phase !== 'spinning' && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.15)' }}>
            <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} pulls the trigger...</span>
          </div>
        )}
        {phase === 'spinning' && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,217,61,0.08)', border: '1px solid rgba(255,217,61,0.15)' }}>
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>Chamber spinning...</span>
          </div>
        )}
        {comment && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: C.text3, fontStyle: 'italic' }}>{comment}</div>}
      </div>
    </div>
  )
}
