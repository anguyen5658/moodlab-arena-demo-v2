import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { PuffBar } from '../../../components/shared/PuffBar'

const HP_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

const HP_COMMENTS = {
  pass: ["Quick pass! Smart move", "Strategic skip! Sent it ahead!", "Away it goes... someone else's problem", "Fast hands! Bomb transferred", "YEET! That bomb is someone else's now"],
  skip: ["YEET! Skipped a player!", "Long throw! Jumped right over them!", "Power puff = power pass!", "Skipped the neighbor! Big brain play"],
  explode: ["BOOM! Too slow!", "KABOOM! Should've puffed faster!", "EXPLOSION! Held it too long!", "DETONATED! That's gonna leave a mark!", "BLEW UP! The bomb wins this round!"],
  win: ["SOLE SURVIVOR! The bomb fears you!", "Last one standing! Legendary!", "Champion! Everyone else got roasted!", "WINNER! The others are toast!"],
  tension: ["The fuse is getting shorter...", "Everyone's sweating now...", "Timer shrinking... danger rising!", "This round will be FAST!"],
}

const HP_AI = [
  { name: "BombBot", emoji: "🤖", color: "#FF6B8A" },
  { name: "HotHands", emoji: "🔥", color: "#FFD93D" },
  { name: "FuseRunner", emoji: "🧨", color: "#7CFF6B" },
  { name: "BlastZone", emoji: "💥", color: "#C084FC" },
  { name: "TickTock", emoji: "⏰", color: "#60A5FA" },
  { name: "KaBoom", emoji: "💣", color: "#FF4D8D" },
  { name: "PuffQuick", emoji: "💨", color: "#FB923C" },
]

const HP_PLAYER_COLORS = ["#00E5FF", "#FF6B8A", "#FFD93D", "#7CFF6B", "#C084FC", "#60A5FA", "#FF4D8D", "#FB923C"]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface Player {
  name: string
  emoji: string
  color: string
  isYou: boolean
  isAI: boolean
  isHuman: boolean
  alive: boolean
  deviceSlot?: number
}

type Phase = 'intro' | 'playing' | 'exploding' | 'next_round' | 'result' | null

export const HotPotatoGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentHolder, setCurrentHolder] = useState(-1)
  const [round, setRound] = useState(1)
  const [maxTimer, setMaxTimer] = useState(5)
  const [bombTimer, setBombTimer] = useState(0)
  const [fuse, setFuse] = useState(1)
  const [comment, setComment] = useState('')
  const [exploded, setExploded] = useState<Player | null>(null)
  const [winner, setWinner] = useState<Player | null>(null)
  const [eliminatedList, setEliminatedList] = useState<Player[]>([])
  const [puffHeld, setPuffHeld] = useState(false)
  const [puffPower, setPuffPower] = useState(0)
  const [passing, setPassing] = useState(false)
  const [passTarget, setPassTarget] = useState<number | null>(null)
  const [sweetSpot] = useState({ min: 55, max: 80 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStartRef = useRef<number>(0)
  const bombArcProgressRef = useRef<number>(0)
  const activeRef = useRef<{ v: boolean }>({ v: false })
  const startedRef = useRef(false)

  const phaseRef = useRef<Phase>(null)
  const playersRef = useRef<Player[]>([])
  const holderRef = useRef(-1)
  const fuseRef = useRef(1)
  const passingRef = useRef(false)
  const passTargetRef = useRef<number | null>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { holderRef.current = currentHolder }, [currentHolder])
  useEffect(() => { fuseRef.current = fuse }, [fuse])
  useEffect(() => { passingRef.current = passing }, [passing])
  useEffect(() => { passTargetRef.current = passTarget }, [passTarget])

  const findNextAlive = useCallback((list: Player[], fromIdx: number, skip = 0): number | null => {
    let found = 0
    for (let i = 1; i <= list.length * 2; i++) {
      const ni = (fromIdx + i) % list.length
      if (list[ni].alive) {
        if (found >= skip) return ni
        found++
      }
    }
    return null
  }, [])

  const passBombRef = useRef<(list: Player[], fromIdx: number, skipCount: number, currentRound: number) => void>(() => {})
  const aiTurnRef = useRef<(list: Player[], idx: number, currentRound: number) => void>(() => {})
  const explodeBombRef = useRef<(list: Player[], currentRound: number) => void>(() => {})
  const startRoundRef = useRef<(list: Player[], currentRound: number) => void>(() => {})

  passBombRef.current = (list, fromIdx, skipCount, currentRound) => {
    if (timerRef.current === null) return
    const target = findNextAlive(list, fromIdx, skipCount)
    if (target === null) return
    setPassing(true)
    setPassTarget(target)
    bombArcProgressRef.current = 0
    if (skipCount > 0) {
      setComment(pick(HP_COMMENTS.skip))
      audio.playFx('laugh')
    } else {
      setComment(pick(HP_COMMENTS.pass))
      audio.playFx('bomb_pass')
    }
    setTimeout(() => {
      if (!activeRef.current.v) return
      setCurrentHolder(target)
      setPassing(false)
      setPassTarget(null)
      bombArcProgressRef.current = 0
      if (list[target].isAI) {
        setTimeout(() => { if (activeRef.current.v && timerRef.current) aiTurnRef.current(list, target, currentRound) }, 400 + Math.random() * 1200)
      }
    }, 400)
  }

  aiTurnRef.current = (list, idx, currentRound) => {
    if (!activeRef.current.v || !timerRef.current) return
    const holdTime = 500 + Math.random() * 1500
    setComment(`${list[idx].name} holds the bomb...`)
    setTimeout(() => {
      if (!activeRef.current.v || !timerRef.current) return
      const skip = Math.random() < 0.15 ? 1 : 0
      passBombRef.current(list, idx, skip, currentRound)
    }, holdTime)
  }

  explodeBombRef.current = (currentPlayers, currentRound) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (puffRef.current) { clearInterval(puffRef.current); puffRef.current = null }
    setPuffHeld(false)
    setPuffPower(0)
    setPhase('exploding')
    setComment(pick(HP_COMMENTS.explode))
    audio.playFx('bomb_explode')
    setCurrentHolder(prevHolder => {
      const victim = currentPlayers[prevHolder]
      if (!victim) return prevHolder
      setExploded(victim)
      const updated = currentPlayers.map((p, i) => i === prevHolder ? { ...p, alive: false } : p)
      setPlayers(updated)
      setEliminatedList(el => [...el, victim])
      setTimeout(() => {
        if (!activeRef.current.v) return
        const aliveCount = updated.filter(p => p.alive).length
        if (aliveCount <= 1) {
          const w = updated.find(p => p.alive) || null
          setWinner(w)
          setPhase('result')
          if (w && w.isYou) {
            player.spawnConfetti(50, [C.orange, C.gold, C.red, C.pink])
            audio.playFx('win')
            audio.playFx('crowd')
          } else {
            audio.playFx('lose')
          }
          setComment(pick(HP_COMMENTS.win))
        } else {
          setPhase('next_round')
          setComment(`${aliveCount} remain... next round!`)
          setTimeout(() => { if (activeRef.current.v) startRoundRef.current(updated, currentRound + 1) }, 2200)
        }
      }, 2200)
      return prevHolder
    })
  }

  startRoundRef.current = (list, currentRound) => {
    const alive = list.filter(p => p.alive)
    if (alive.length <= 1) return
    const maxT = Math.max(3, 8 - (currentRound - 1) * 0.5 + (Math.random() * 2 - 1))
    setMaxTimer(maxT)
    setBombTimer(0)
    setFuse(1)
    setRound(currentRound)
    setPassing(false)
    setExploded(null)
    setPuffHeld(false)
    setPuffPower(0)
    setPassTarget(null)
    bombArcProgressRef.current = 0
    const aliveIdxs = list.map((p, i) => p.alive ? i : -1).filter(i => i >= 0)
    const startHolder = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)]
    setCurrentHolder(startHolder)
    setPhase('playing')
    setComment(currentRound > 1 ? pick(HP_COMMENTS.tension) : 'Bomb activated!')
    audio.playFx('bomb_tick')
    const startTime = Date.now()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (!activeRef.current.v) { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } ; return }
      const elapsed = (Date.now() - startTime) / 1000
      const pct = Math.min(1, elapsed / maxT)
      setBombTimer(elapsed)
      setFuse(1 - pct)
      if (elapsed >= maxT) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        explodeBombRef.current(list, currentRound)
      }
    }, 50)
    if (list[startHolder].isAI) setTimeout(() => { if (activeRef.current.v) aiTurnRef.current(list, startHolder, currentRound) }, 600 + Math.random() * 800)
  }

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    activeRef.current = { v: true }
    const mpCount = (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) ? (ble.ssPlayerCount || 0) : 0
    const aiCount = 8 - (mpCount > 0 ? mpCount : 1)
    const shuffled = [...HP_AI].sort(() => Math.random() - 0.5).slice(0, aiCount)
    const list: Player[] = []
    if (mpCount > 0) {
      list.push({ name: ble.partyPlayerNames[0] || 'You', emoji: '😤', color: HP_PLAYER_COLORS[0], isYou: true, isAI: false, isHuman: false, alive: true, deviceSlot: 0 })
      for (let s = 1; s < mpCount; s++) {
        list.push({ name: ble.partyPlayerNames[s] || `P${s + 1}`, emoji: '🎮', color: HP_PLAYER_COLORS[s], isYou: false, isAI: false, isHuman: true, alive: true, deviceSlot: s })
      }
      shuffled.forEach(a => list.push({ ...a, isYou: false, isAI: true, isHuman: false, alive: true }))
    } else {
      const aiPlayers: Player[] = shuffled.map(a => ({ ...a, isYou: false, isAI: true, isHuman: false, alive: true }))
      const youIdx = Math.floor(Math.random() * (aiPlayers.length + 1))
      aiPlayers.splice(youIdx, 0, { name: 'You', emoji: '😤', color: '#00E5FF', isYou: true, isAI: false, isHuman: false, alive: true })
      list.push(...aiPlayers)
    }
    setPlayers(list)
    setCurrentHolder(-1)
    setRound(1)
    setMaxTimer(5 + Math.random() * 3)
    setBombTimer(0)
    setComment('')
    setExploded(null)
    setWinner(null)
    setEliminatedList([])
    setFuse(1)
    setPuffHeld(false)
    setPuffPower(0)
    setPassTarget(null)
    setPassing(false)
    setPhase('intro')
    audio.playFx('crowd')
    setTimeout(() => { if (activeRef.current.v) startRoundRef.current(list, 1) }, 4200)
  }, [audio, ble])

  const tapPass = useCallback(() => {
    if (phaseRef.current !== 'playing' || puffHeld || passingRef.current) return
    const cur = playersRef.current[holderRef.current]
    if (!cur || (!cur.isYou && !cur.isHuman)) return
    passBombRef.current(playersRef.current, holderRef.current, 0, round)
    audio.playFx('tap')
  }, [puffHeld, round, audio])

  const startPuffHold = useCallback(() => {
    if (phaseRef.current !== 'playing' || puffHeld) return
    const cur = playersRef.current[holderRef.current]
    if (!cur || (!cur.isYou && !cur.isHuman)) return
    setPuffHeld(true)
    setPuffPower(0)
    puffStartRef.current = Date.now()
    audio.playFx('charge')
    if (puffRef.current) clearInterval(puffRef.current)
    puffRef.current = setInterval(() => {
      const e = (Date.now() - puffStartRef.current) / 1000
      setPuffPower(Math.min(100, (e / 3.0) * 100))
    }, 50)
  }, [puffHeld, audio])

  const stopPuffHold = useCallback(() => {
    if (!puffHeld) return
    setPuffHeld(false)
    if (puffRef.current) { clearInterval(puffRef.current); puffRef.current = null }
    const holdTime = (Date.now() - puffStartRef.current) / 1000
    let skip = 0
    if (holdTime >= 3) skip = 2
    else if (holdTime >= 1.5) skip = 1
    setPuffPower(0)
    passBombRef.current(playersRef.current, holderRef.current, skip, round)
  }, [puffHeld, round])

  const endGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    activeRef.current.v = false
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (puffRef.current) { clearInterval(puffRef.current); puffRef.current = null }
    const won = winner && winner.isYou
    const baseR = won ? 60 : 10
    audio.playFx(won ? 'win' : 'lose')
    player.recordGameResult(!!won, baseR, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'arcade', gameActive: game.gameActive })
    player.notify(won ? `💣 Survived! +${baseR} coins!` : `💀 Exploded! +${baseR}`, won ? C.green : C.red)
    setPhase(null)
    game.exitGame()
  }, [audio, player, ble, game, winner])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / HP_DPR
    const H = canvas.height / HP_DPR
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(HP_DPR, HP_DPR)
    const now = Date.now()
    const list = playersRef.current
    const holderIdx = holderRef.current
    const f = fuseRef.current
    const isExploding = phaseRef.current === 'exploding'
    const isIntro = phaseRef.current === 'intro'
    const isPassing = passingRef.current
    const pTarget = passTargetRef.current

    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7)
    bgGrad.addColorStop(0, '#0f0820')
    bgGrad.addColorStop(0.5, '#080412')
    bgGrad.addColorStop(1, '#020108')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H * 0.45
    const radius = Math.min(W, H) * 0.32
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,100,0,0.08)'
    ctx.lineWidth = 2
    ctx.stroke()
    if (f < 0.4) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,50,0,${0.15 * (1 - f)})`
      ctx.lineWidth = 3
      ctx.stroke()
    }

    if (isIntro || list.length === 0) {
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FF8800'
      const pulse = 1 + 0.1 * Math.sin(now / 200)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(pulse, pulse)
      ctx.fillText('💣', 0, 0)
      ctx.restore()
      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = '#FFA500'
      ctx.fillText('HOT POTATO', cx, cy + 50)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText(`${list.length || 8} players entering...`, cx, cy + 72)
      ctx.restore()
      return
    }

    const total = list.length
    for (let i = 0; i < total; i++) {
      const p = list[i]
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius
      const isHolder = i === holderIdx && !isExploding
      const isVictim = isExploding && i === holderIdx
      const isElim = !p.alive
      const isTarget = i === pTarget
      const dotR = isHolder ? 18 : isTarget ? 16 : 14
      if (isElim) {
        ctx.beginPath()
        ctx.arc(px, py, dotR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(60,60,60,0.4)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(100,100,100,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(px - 6, py - 6)
        ctx.lineTo(px + 6, py + 6)
        ctx.moveTo(px + 6, py - 6)
        ctx.lineTo(px - 6, py + 6)
        ctx.strokeStyle = 'rgba(255,50,50,0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 4)
        continue
      }
      if (isHolder) {
        const glowColor = p.isYou ? 'rgba(0,229,255,0.25)' : 'rgba(255,100,0,0.25)'
        const pulseR = dotR + 6 + 3 * Math.sin(now / 150)
        ctx.beginPath()
        ctx.arc(px, py, pulseR, 0, Math.PI * 2)
        ctx.fillStyle = glowColor
        ctx.fill()
      }
      if (isVictim) {
        const pulseR = dotR + 10 + 8 * Math.sin(now / 80)
        ctx.beginPath()
        ctx.arc(px, py, pulseR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,50,0,0.35)'
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(px, py, dotR, 0, Math.PI * 2)
      const pColor = p.color || HP_PLAYER_COLORS[i % HP_PLAYER_COLORS.length]
      if (isHolder) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, dotR)
        g.addColorStop(0, pColor)
        g.addColorStop(1, pColor + '80')
        ctx.fillStyle = g
      } else if (isTarget) {
        ctx.fillStyle = pColor + '90'
      } else {
        ctx.fillStyle = pColor + '60'
      }
      ctx.fill()
      ctx.strokeStyle = isHolder ? (p.isYou ? '#00E5FF' : '#FF8800') : isVictim ? '#FF0000' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth = isHolder ? 2.5 : 1.5
      ctx.stroke()
      ctx.font = `${dotR * 0.9}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText(p.emoji, px, py)
      ctx.font = 'bold 9px sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isHolder ? (p.isYou ? '#00E5FF' : '#FFA500') : 'rgba(255,255,255,0.6)'
      ctx.fillText(p.isYou ? 'YOU' : p.name, px, py + dotR + 4)
      if (isHolder && !isExploding) {
        const bombPulse = 1 + 0.15 * Math.sin(now / 120)
        ctx.save()
        ctx.translate(px, py - dotR - 10)
        ctx.scale(bombPulse, bombPulse)
        ctx.font = '16px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText('💣', 0, 0)
        ctx.restore()
      }
      if (isVictim) {
        ctx.font = '32px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText('💥', px, py)
      }
    }

    if (isPassing && pTarget !== null && holderIdx >= 0) {
      const fromAngle = (holderIdx / total) * Math.PI * 2 - Math.PI / 2
      const toAngle = (pTarget / total) * Math.PI * 2 - Math.PI / 2
      const fx = cx + Math.cos(fromAngle) * radius
      const fy = cy + Math.sin(fromAngle) * radius
      const tx = cx + Math.cos(toAngle) * radius
      const ty = cy + Math.sin(toAngle) * radius
      bombArcProgressRef.current = Math.min(1, bombArcProgressRef.current + 0.06)
      const t = bombArcProgressRef.current
      const midX = (fx + tx) / 2
      const midY = (fy + ty) / 2 - 40
      const bx = (1 - t) * (1 - t) * fx + 2 * (1 - t) * t * midX + t * t * tx
      const by = (1 - t) * (1 - t) * fy + 2 * (1 - t) * t * midY + t * t * ty
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('💣', bx, by)
    }

    const barY = 8, barH = 6, barW = W - 40, barX = 20
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(barX, barY, barW, barH)
    const fuseW = barW * Math.max(0, f)
    const fuseColor = f > 0.6 ? '#34D399' : f > 0.3 ? '#FB923C' : '#FF4444'
    if (fuseW > 0) {
      ctx.fillStyle = fuseColor
      ctx.fillRect(barX, barY, fuseW, barH)
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'hotpotato') return
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
    if (game.gameActive?.id !== 'hotpotato') return
    const down = () => startPuffHold()
    const up = () => stopPuffHold()
    ble.registerPuffHandlers('hotpotato', down, up)
    // Turn-based MP: only bomb holder's device slot fires
    if (ble.mpActive && (ble.ssPlayerCount || 0) >= 2) {
      const handlers: { [slot: number]: { down: (() => void) | null; up: (() => void) | null } } = {}
      const pList = playersRef.current
      const holder = holderRef.current
      for (let s = 0; s < (ble.ssPlayerCount || 2); s++) {
        const p = pList.find(pp => (pp as any).deviceSlot === s)
        if (p && pList.indexOf(p) === holder && !p.isAI) {
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
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (puffRef.current) { clearInterval(puffRef.current); puffRef.current = null }
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, currentHolder, ble.mpActive])

  if (!phase || game.gameActive?.id !== 'hotpotato') return null

  const curP = players[currentHolder]
  const isYourTurn = curP && curP.isYou && phase === 'playing' && !passing
  const aliveCount = players.filter(p => p.alive).length
  const isExploding = phase === 'exploding'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(255,100,0,0.1)' }}>
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
            <span style={{ fontSize: 10, fontWeight: 800, color: C.orange }}>💣 HOT POTATO</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text3 }}>{aliveCount}/{players.length} alive</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>Round {round}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px' }}>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ width: `${fuse * 100}%`, height: '100%', borderRadius: 3, transition: 'width 0.1s', background: fuse > 0.6 ? `linear-gradient(90deg,${C.green},${C.cyan})` : fuse > 0.3 ? `linear-gradient(90deg,${C.orange},${C.gold})` : `linear-gradient(90deg,${C.red},#FF0000)`, boxShadow: fuse <= 0.3 ? `0 0 8px ${C.red}` : 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
            <span style={{ fontSize: 7, color: C.text3 }}>Fuse</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: fuse > 0.3 ? C.text2 : C.red, fontFamily: 'monospace' }}>{fuse > 0 ? `${Math.max(0, maxTimer - bombTimer).toFixed(1)}s` : 'BOOM!'}</span>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={Math.round(420 * HP_DPR)} height={Math.round(600 * HP_DPR)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {isExploding && exploded && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,0,0,0.6)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💥💀💥</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{exploded.isYou ? 'YOU BLEW UP!' : `${exploded.name} EXPLODED!`}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>{aliveCount} players remain</div>
          </div>
        )}

        {phase === 'next_round' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 55, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,4,0,0.7)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>Round {round + 1} Coming...</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>Timer gets SHORTER!</div>
          </div>
        )}

        {phase === 'result' && (() => {
          const hpWon = winner && winner.isYou
          const baseR = hpWon ? 60 : 10
          return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{hpWon ? '👑' : '💀'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: hpWon ? C.green : C.red }}>{hpWon ? 'SOLE SURVIVOR!' : winner ? `${winner.name} WINS!` : 'Game Over!'}</div>
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
                <div onClick={() => { setPhase(null); startedRef.current = false; startGame(); startedRef.current = true }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange, touchAction: 'none' }}>Play Again</div>
                <div onClick={endGame} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3, touchAction: 'none' }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Controls at bottom */}
      {phase === 'playing' && (
        <div style={{ position: 'relative', zIndex: 60, flexShrink: 0, padding: '8px 12px 14px', background: 'rgba(6,16,30,0.98)', borderTop: '1px solid rgba(255,100,0,0.08)' }}>
          {puffHeld && (
            <div style={{ marginBottom: 6 }}>
              <PuffBar power={puffPower} charging={true} sweetSpot={sweetSpot} blinkerUsed={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 7, color: C.cyan }}>Quick pass</span>
                <span style={{ fontSize: 7, color: C.gold }}>Skip 1</span>
                <span style={{ fontSize: 7, color: C.orange }}>YEET skip 2!</span>
              </div>
            </div>
          )}
          {isYourTurn && !puffHeld && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={(e) => { e.stopPropagation(); tapPass() }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.orange}25,${C.red}12)`, border: `2px solid ${C.orange}40`, userSelect: 'none', touchAction: 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>TAP PASS</div>
                <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Normal speed</div>
              </div>
              <div
                onMouseDown={(e) => { e.stopPropagation(); startPuffHold() }}
                onMouseUp={(e) => { e.stopPropagation(); stopPuffHold() }}
                onMouseLeave={stopPuffHold}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startPuffHold() }}
                onTouchEnd={(e) => { e.stopPropagation(); stopPuffHold() }}
                onTouchCancel={(e) => { e.stopPropagation(); stopPuffHold() }}
                style={{ flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: `linear-gradient(135deg,${C.cyan}20,${C.purple}10)`, border: `2px solid ${C.cyan}30`, userSelect: 'none', touchAction: 'none' }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: C.cyan, letterSpacing: 1 }}>PUFF PASS</div>
                <div style={{ fontSize: 8, color: C.text3, marginTop: 2 }}>Hold = faster</div>
              </div>
            </div>
          )}
          {phase === 'playing' && curP && curP.isAI && !passing && (
            <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.15)' }}>
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{curP.name} holds the bomb...</span>
            </div>
          )}
          {passing && (
            <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 10, background: 'rgba(255,217,61,0.08)', border: '1px solid rgba(255,217,61,0.15)' }}>
              <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>Passing...</span>
            </div>
          )}
          {comment && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: C.text3, fontStyle: 'italic' }}>{comment}</div>}
        </div>
      )}
    </div>
  )
}
