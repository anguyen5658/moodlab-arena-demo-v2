// RPS (Rock Paper Scissors) — Puff Dojo V3
// Ported from moodlab-arena-v7.jsx lines ~14317-14705 + render block ~18989-19216
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { C } from '../../../constants'

// ─── Constants (lifted from monolith ~14317-14355) ─────────────
const RPS_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
const RPS_CHOICES = ['rock', 'paper', 'scissors'] as const
type RPSChoice = typeof RPS_CHOICES[number]
const RPS_EMOJI: Record<RPSChoice, string> = { rock: '\u270A', paper: '\u270B', scissors: '\u270C\uFE0F' }
const RPS_BEATS: Record<RPSChoice, RPSChoice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' }

interface RPSOpponent { name: string; emoji: string; taunt: string; style: string }
const RPS_OPPONENTS: RPSOpponent[] = [
  { name: 'Sensei Stoner', emoji: '\uD83E\uDDD8', taunt: 'My third eye sees your throw', style: 'balanced' },
  { name: 'Rocky Blaze', emoji: '\uD83E\uDEA8', taunt: 'Rock solid every time', style: 'rock_heavy' },
  { name: 'Scissor Hands', emoji: '\u2702\uFE0F', taunt: 'Snip snip, smokey', style: 'scissors_heavy' },
  { name: 'Paper Trail', emoji: '\uD83D\uDCC4', taunt: 'Roll it up and smoke it', style: 'paper_heavy' },
  { name: 'The Blinker', emoji: '\uD83D\uDCA8', taunt: 'MAXIMUM POWER always', style: 'blinker' },
  { name: 'Puff Master', emoji: '\uD83D\uDC51', taunt: 'I read you like a rolling paper', style: 'adaptive' },
]

const RPS_WIN_COMMENTS = [
  ['Paper wraps rock like a rolling paper!', 'Rock crushes scissors through the smoke!', 'Scissors cut through the haze!'],
  ['CLEAN WIN! That throw was precise!', 'The puff powered that throw HARD!', "AI didn't see that coming!"],
  ['POWER THROW! The dojo is shaking!', 'That throw is ON FIRE!', 'Blinker energy on that throw!'],
]
const RPS_LOSE_COMMENTS = [
  'AI read you like a menu at the dispensary', 'Outplayed! Time to recalibrate', "The bot's got smoke-vision",
  'That throw was weaker than mids', 'AI flexed HARD on that one', 'Counter-puffed! Better luck next round',
]
const RPS_TIE_COMMENTS = [
  'SAME THROW! Draw round, replay!', 'Mirror match! Nobody wins this one!', 'Identical minds... REPLAY!',
]
const RPS_BLINKER_COMMENTS = [
  'BLINKER THROW! MAXIMUM POWER!', 'ULTRA POWER! Maximum puff energy!', 'BLINKER RISK! High reward or high regret!',
]

const rpsGetAiChoice = (opp: RPSOpponent | null): RPSChoice => {
  if (!opp) return RPS_CHOICES[Math.floor(Math.random() * 3)]
  const r = Math.random()
  if (opp.style === 'rock_heavy') return r < 0.5 ? 'rock' : r < 0.75 ? 'paper' : 'scissors'
  if (opp.style === 'scissors_heavy') return r < 0.5 ? 'scissors' : r < 0.75 ? 'rock' : 'paper'
  if (opp.style === 'paper_heavy') return r < 0.5 ? 'paper' : r < 0.75 ? 'scissors' : 'rock'
  return RPS_CHOICES[Math.floor(Math.random() * 3)]
}

interface PowerInfo { label: string; tier: 'weak' | 'normal' | 'power' | 'strong' | 'ultra'; bonus: number; color: string }
const rpsGetPowerLabel = (power: number): PowerInfo => {
  if (power < 10) return { label: 'Tap', tier: 'weak', bonus: 0, color: (C as any).text3 }
  if (power < 40) return { label: 'Dry Puff', tier: 'normal', bonus: 5, color: C.cyan }
  if (power < 70) return { label: 'Real Puff', tier: 'power', bonus: 15, color: C.green }
  if (power < 90) return { label: 'Long Puff', tier: 'strong', bonus: 15, color: C.orange }
  return { label: 'BLINKER', tier: 'ultra', bonus: 20, color: C.red }
}

type RPSPhase = null | 'intro' | 'choose' | 'puff' | 'clash' | 'round_result' | 'final'
interface RoundResult {
  round: number; playerChoice: RPSChoice; aiChoice: RPSChoice
  result: 'win' | 'lose' | 'draw'; bonus: number; playerPower: number; aiPower: number
}

export const RPSGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()
  const { gameActive, exitGame } = game
  const { recordGameResult, spawnConfetti, notify } = player
  const { registerPuffHandlers, registerSlotPuffHandlers, bleConnected, mpActive, ssPlayerCount } = ble
  const { playFx, gameSoundsMuted } = audio

  // ─── State (lifted from monolith ~1662-1679) ────────────────
  const [rpsPhase, setRpsPhase] = useState<RPSPhase>(null)
  const [rpsRound, setRpsRound] = useState(0)
  const [rpsScore, setRpsScore] = useState<{ you: number; ai: number }>({ you: 0, ai: 0 })
  const [rpsPlayerChoice, setRpsPlayerChoice] = useState<RPSChoice | null>(null)
  const [rpsAiChoice, setRpsAiChoice] = useState<RPSChoice | null>(null)
  const [rpsPuffPower, setRpsPuffPower] = useState(0)
  const [rpsAiPuffPower, setRpsAiPuffPower] = useState(0)
  const [rpsResult, setRpsResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [rpsStreak, setRpsStreak] = useState(0)
  const [, setRpsComment] = useState('')
  const [rpsIntro, setRpsIntro] = useState(0)
  const [rpsPuffHeld, setRpsPuffHeld] = useState(false)
  const [rpsClashAnim, setRpsClashAnim] = useState(false)
  const [, setRpsPointsAwarded] = useState(0)
  const [rpsRoundResults, setRpsRoundResults] = useState<RoundResult[]>([])
  const [rpsOpponent, setRpsOpponent] = useState<RPSOpponent | null>(null)
  const [commentary, setCommentary] = useState('')

  // ─── Refs (lifted from monolith ~1680-1686, 14546-14547) ────
  const rpsRoundRef = useRef(0)
  const rpsPlayerChoiceRef = useRef<RPSChoice | null>(null)
  const rpsPuffStart = useRef(0)
  const rpsPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const rpsCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const rpsAnimRef = useRef<number | null>(null)
  const rpsAuraRef = useRef(0)
  const rpsClashT = useRef(0)
  const rpsSlowMo = useRef(0)
  const rpsPuffActiveRef = useRef(false)
  const rpsResolveRef = useRef<any>(null)
  const rpsActiveGuard = useRef<{ v: boolean } | null>(null)
  const startedRef = useRef(false)

  // Live refs for canvas draw closures (keep draw callback stable)
  const phaseRef = useRef<RPSPhase>(null); phaseRef.current = rpsPhase
  const aiChoiceRef = useRef<RPSChoice | null>(null); aiChoiceRef.current = rpsAiChoice
  const aiPwrRef = useRef(0); aiPwrRef.current = rpsAiPuffPower
  const resultRef = useRef<'win' | 'lose' | 'draw' | null>(null); resultRef.current = rpsResult
  const roundResultsRef = useRef<RoundResult[]>([]); roundResultsRef.current = rpsRoundResults
  const puffHeldRef = useRef(false); puffHeldRef.current = rpsPuffHeld
  const clashAnimRef = useRef(false); clashAnimRef.current = rpsClashAnim

  // ─── Canvas Draw (verbatim from monolith ~14358-14484) ──────
  const rpsDrawCanvas = useCallback(() => {
    const canvas = rpsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / RPS_DPR, H = canvas.height / RPS_DPR
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(RPS_DPR, RPS_DPR)
    const t = Date.now() * 0.001
    const aura = rpsAuraRef.current
    const clash = rpsClashT.current
    const slowMo = rpsSlowMo.current

    // Dark dojo background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#0a0a1a'); bg.addColorStop(0.3, '#12082a')
    bg.addColorStop(0.6, '#1a0e2a'); bg.addColorStop(1, '#0a0812')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Wooden floor
    const floorY = H * 0.68
    const floor = ctx.createLinearGradient(0, floorY, 0, H)
    floor.addColorStop(0, '#2a1a0a'); floor.addColorStop(0.3, '#3a2210')
    floor.addColorStop(0.7, '#2a1808'); floor.addColorStop(1, '#1a0e04')
    ctx.fillStyle = floor; ctx.fillRect(0, floorY, W, H - floorY)

    ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 1
    for (let i = 0; i < 8; i++) { const y = floorY + i * (H - floorY) / 7; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Shoji screens
    const wallH = floorY * 0.7
    ctx.fillStyle = 'rgba(240,230,210,0.04)'
    for (let i = 0; i < 5; i++) { const x = i * (W / 4) - W * 0.06; ctx.fillRect(x, floorY * 0.1, W * 0.28, wallH) }
    ctx.strokeStyle = 'rgba(100,70,30,0.15)'; ctx.lineWidth = 1.5
    for (let i = 0; i < 5; i++) {
      const x = i * (W / 4) - W * 0.06; ctx.strokeRect(x, floorY * 0.1, W * 0.28, wallH)
      ctx.beginPath(); ctx.moveTo(x + W * 0.14, floorY * 0.1); ctx.lineTo(x + W * 0.14, floorY * 0.1 + wallH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, floorY * 0.1 + wallH * 0.5); ctx.lineTo(x + W * 0.28, floorY * 0.1 + wallH * 0.5); ctx.stroke()
    }

    // Dust
    for (let i = 0; i < 12; i++) {
      const px = (i * 37 + Math.sin(t * 0.3 + i) * 30) % W
      const py = (i * 29 + Math.cos(t * 0.4 + i * 1.7) * 20) % (floorY * 0.8) + floorY * 0.1
      ctx.fillStyle = `rgba(255,230,180,${0.03 + Math.sin(t + i) * 0.02})`
      ctx.beginPath(); ctx.arc(px, py, 1 + i % 2, 0, Math.PI * 2); ctx.fill()
    }

    // Fighters
    const fY = floorY - 8
    const youX = W * 0.25, aiX = W * 0.75
    const drawFighter = (x: number, y: number, col: string, choice: RPSChoice | null, power: number, isClashing: boolean, label: string) => {
      const bodyH = 40, headR = 12
      ctx.fillStyle = col + '40'; ctx.fillRect(x - 8, y - bodyH, 16, bodyH)
      ctx.fillStyle = col + '60'; ctx.beginPath(); ctx.arc(x, y - bodyH - headR + 2, headR, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = col + '80'; ctx.fillRect(x - 10, y - bodyH * 0.45, 20, 4)
      if (power > 0) {
        const aR = 20 + power * 0.4
        const aGrad = ctx.createRadialGradient(x, y - bodyH * 0.5, 0, x, y - bodyH * 0.5, aR)
        aGrad.addColorStop(0, col + '30'); aGrad.addColorStop(0.5, col + '10'); aGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = aGrad; ctx.beginPath(); ctx.arc(x, y - bodyH * 0.5, aR, 0, Math.PI * 2); ctx.fill()
        if (power > 30) {
          for (let p = 0; p < Math.min(6, Math.floor(power / 15)); p++) {
            const pa = t * 2 + p * 1.05; const pr = 18 + Math.sin(pa * 1.5) * 8 + power * 0.12
            ctx.fillStyle = col + '40'; ctx.beginPath(); ctx.arc(x + Math.cos(pa) * pr, y - bodyH * 0.5 + Math.sin(pa) * pr * 0.7, 2 + power * 0.02, 0, Math.PI * 2); ctx.fill()
          }
        }
      }
      if (choice) {
        ctx.font = 'bold ' + Math.round(28 + (isClashing ? Math.sin(t * 15) * 4 : 0)) + 'px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(RPS_EMOJI[choice], x, y - bodyH - headR * 2 - 14)
      }
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillStyle = col; ctx.fillText(label, x, y + 6)
    }
    const pChoice = rpsPlayerChoiceRef.current
    const aChoice = aiChoiceRef.current
    drawFighter(youX, fY, '#00E5FF', pChoice, aura, !!clash, 'YOU')
    drawFighter(aiX, fY, '#FF4444', aChoice, aiPwrRef.current * (clash ? 1 : 0), !!clash, 'AI')

    // Clash VFX
    if (clash > 0) {
      const cx = W * 0.5, cy = fY - 30
      const impactR = 15 + clash * 25
      const impGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, impactR)
      impGrad.addColorStop(0, 'rgba(255,200,50,0.6)'); impGrad.addColorStop(0.4, 'rgba(255,150,30,0.3)'); impGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = impGrad; ctx.beginPath(); ctx.arc(cx, cy, impactR, 0, Math.PI * 2); ctx.fill()
      for (let i = 0; i < 8; i++) {
        const sa = i * Math.PI / 4 + t * 3; const sr = impactR * 0.6 + Math.sin(t * 10 + i) * 8
        ctx.strokeStyle = 'rgba(255,220,80,0.5)'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(sa) * 6, cy + Math.sin(sa) * 6)
        ctx.lineTo(cx + Math.cos(sa) * sr, cy + Math.sin(sa) * sr); ctx.stroke()
      }
      ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255,200,50,0.9)'; ctx.fillText('CLASH!', cx, cy - impactR - 10)
    }

    // Slow-mo result overlay
    if (slowMo > 0) {
      const rr = resultRef.current
      const cx = W * 0.5, cy = H * 0.35
      ctx.fillStyle = `rgba(0,0,0,${0.3 * slowMo})`; ctx.fillRect(0, 0, W, H)
      ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = rr === 'win' ? 'rgba(52,211,153,0.9)' : rr === 'lose' ? 'rgba(255,68,68,0.9)' : 'rgba(255,217,61,0.9)'
      ctx.fillText(rr === 'win' ? 'YOU WIN!' : rr === 'lose' ? 'DEFEATED!' : 'DRAW!', cx, cy)
    }

    // Score display
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('Round ' + Math.min(rpsRoundRef.current + 1, 5) + '/5', W * 0.5, 8)
    for (let i = 0; i < 5; i++) {
      const rr = roundResultsRef.current[i]
      const dx = W * 0.5 + (i - 2) * 20
      ctx.fillStyle = rr ? (rr.result === 'win' ? 'rgba(52,211,153,0.7)' : rr.result === 'lose' ? 'rgba(255,68,68,0.7)' : 'rgba(255,217,61,0.7)') : 'rgba(255,255,255,0.1)'
      ctx.beginPath(); ctx.arc(dx, 26, 6, 0, Math.PI * 2); ctx.fill()
      if (rr) { ctx.font = 'bold 7px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D', dx, 23) }
    }
    ctx.restore()

    // Update animated refs
    if (puffHeldRef.current) rpsAuraRef.current = Math.min(100, (rpsAuraRef.current || 0) + 2)
    else rpsAuraRef.current = Math.max(0, (rpsAuraRef.current || 0) - 3)
    if (clashAnimRef.current) rpsClashT.current = Math.min(1, (rpsClashT.current || 0) + 0.06)
    else rpsClashT.current = Math.max(0, (rpsClashT.current || 0) - 0.04)
    if (phaseRef.current === 'round_result' || phaseRef.current === 'final') rpsSlowMo.current = Math.min(1, (rpsSlowMo.current || 0) + 0.04)
    else rpsSlowMo.current = Math.max(0, (rpsSlowMo.current || 0) - 0.06)
  }, [])

  // ─── Animation Loop (Rule 4 — restart every render) ─────────
  useEffect(() => {
    if (!rpsPhase) return
    if (rpsAnimRef.current) cancelAnimationFrame(rpsAnimRef.current)
    const loop = () => { rpsDrawCanvas(); rpsAnimRef.current = requestAnimationFrame(loop) }
    rpsAnimRef.current = requestAnimationFrame(loop)
    return () => {
      if (rpsAnimRef.current) { cancelAnimationFrame(rpsAnimRef.current); rpsAnimRef.current = null }
    }
  })

  // ─── Start Game (from monolith startRps ~14486) ─────────────
  const startRps = useCallback(() => {
    gameSoundsMuted.current = false
    const opp = RPS_OPPONENTS[Math.floor(Math.random() * RPS_OPPONENTS.length)]
    setRpsOpponent(opp)
    setRpsRound(0); rpsRoundRef.current = 0
    setRpsScore({ you: 0, ai: 0 })
    setRpsPlayerChoice(null); rpsPlayerChoiceRef.current = null
    setRpsAiChoice(null)
    setRpsPuffPower(0)
    setRpsAiPuffPower(0)
    setRpsResult(null)
    setRpsStreak(0)
    setRpsComment('')
    setRpsClashAnim(false)
    setRpsPointsAwarded(0)
    setRpsRoundResults([])
    setRpsPuffHeld(false)
    rpsAuraRef.current = 0; rpsClashT.current = 0; rpsSlowMo.current = 0
    const guard = { v: true }
    rpsActiveGuard.current = guard
    ;(window as any)._rpsP2 = { choice: null, puffPower: 0, puffStart: 0, puffHeld: false, interval: null }
    setRpsPhase('intro')
    setRpsIntro(1)
    playFx('crowd')
    setCommentary('Welcome to the Puff Dojo! ' + opp.emoji)
    setTimeout(() => { if (!guard.v) return; setRpsIntro(2); setCommentary(opp.name + ': "' + opp.taunt + '"') }, 1000)
    setTimeout(() => { if (!guard.v) return; setRpsIntro(3); playFx('whistle'); setCommentary('Best of 5 -- First to 3 wins! FIGHT!') }, 2000)
    setTimeout(() => { if (!guard.v) return; setRpsIntro(4); playFx('crowd') }, 2800)
    setTimeout(() => { if (!guard.v) return; setRpsPhase('choose'); setRpsIntro(0); setRpsRound(0); rpsRoundRef.current = 0; setCommentary('Round 1 -- Choose your throw!') }, 3500)
  }, [gameSoundsMuted, playFx])

  // ─── Pick Choice ─────────────────────────────────────────────
  const rpsPickChoice = (choice: RPSChoice) => {
    if (phaseRef.current !== 'choose') return
    setRpsPlayerChoice(choice)
    rpsPlayerChoiceRef.current = choice
    playFx('click')
    setCommentary('Now CHARGE your puff power! Hold or puff!')
    setRpsPhase('puff')
    setRpsPuffPower(0)
    setRpsAiPuffPower(0)
    rpsAuraRef.current = 0
  }

  // ─── Puff Start/Stop (from monolith ~14533-14669) ───────────
  const rpsStartPuff = useCallback(() => {
    if (rpsPuffActiveRef.current) return
    if (phaseRef.current !== 'puff') return
    rpsPuffActiveRef.current = true
    setRpsPuffHeld(true)
    rpsPuffStart.current = Date.now()
    rpsPuffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - rpsPuffStart.current) / 1000
      const pwr = Math.min(100, elapsed * 20)
      setRpsPuffPower(pwr)
    }, 30)
  }, [])

  const rpsStopPuff = useCallback(() => {
    if (!rpsPuffActiveRef.current) return
    rpsPuffActiveRef.current = false
    setRpsPuffHeld(false)
    if (rpsPuffInterval.current) { clearInterval(rpsPuffInterval.current); rpsPuffInterval.current = null }
    const elapsed = (Date.now() - rpsPuffStart.current) / 1000
    const finalPower = Math.min(100, elapsed * 20)
    setRpsPuffPower(finalPower)
    if (!rpsActiveGuard.current?.v) return
    const opp = rpsOpponent || RPS_OPPONENTS[0]
    // MP: use P2's actual choice/power if available
    const p2d = (mpActive && (window as any)._rpsP2) ? (window as any)._rpsP2 : null
    const aiChoice: RPSChoice = (p2d && p2d.choice) ? p2d.choice : rpsGetAiChoice(opp)
    setRpsAiChoice(aiChoice)
    let aiPwr = (p2d && p2d.choice) ? p2d.puffPower : (30 + Math.random() * 40)
    if (!p2d?.choice && opp.style === 'blinker') aiPwr = 80 + Math.random() * 20
    setRpsAiPuffPower(aiPwr)
    if (p2d) { (window as any)._rpsP2 = { choice: null, puffPower: 0, puffStart: 0, puffHeld: false, interval: null } }
    const playerPwrInfo = rpsGetPowerLabel(finalPower)
    const aiPwrInfo = rpsGetPowerLabel(aiPwr)
    const pc = rpsPlayerChoiceRef.current!
    rpsResolveRef.current = { pc, aiChoice, finalPower, aiPwr, playerPwrInfo, aiPwrInfo, opp }
    setRpsPhase('clash')
    setRpsClashAnim(true)
    rpsClashT.current = 0
    playFx('explosion')
    if (playerPwrInfo.tier === 'ultra') setCommentary(RPS_BLINKER_COMMENTS[Math.floor(Math.random() * RPS_BLINKER_COMMENTS.length)])
    else setCommentary('CLASH!')

    setTimeout(() => {
      if (!rpsActiveGuard.current?.v) return
      setRpsClashAnim(false)
      const d = rpsResolveRef.current; if (!d) return
      const { pc: ppc, aiChoice: aic, finalPower: fp, aiPwr: ap, playerPwrInfo: ppI } = d
      let result: 'win' | 'lose' | 'draw'
      if (ppc === aic) {
        result = 'draw'
        setCommentary(RPS_TIE_COMMENTS[Math.floor(Math.random() * RPS_TIE_COMMENTS.length)])
      } else if (RPS_BEATS[ppc as RPSChoice] === aic) {
        result = 'win'
        if (ppI.tier === 'ultra') spawnConfetti(40)
        else if (ppI.tier === 'power') spawnConfetti(20)
        const ci = ppI.tier === 'power' || ppI.tier === 'ultra' ? 2 : ppI.tier === 'normal' ? 1 : 0
        setCommentary(RPS_WIN_COMMENTS[ci][Math.floor(Math.random() * RPS_WIN_COMMENTS[ci].length)])
        playFx('success')
      } else {
        result = 'lose'
        setCommentary(RPS_LOSE_COMMENTS[Math.floor(Math.random() * RPS_LOSE_COMMENTS.length)])
        playFx('miss')
      }
      setRpsResult(result)
      setRpsPointsAwarded(ppI.bonus)
      setRpsStreak(prev => { const ns = result === 'win' ? prev + 1 : 0; if (ns >= 3) playFx('streak_fire'); return ns })
      setRpsScore(prev => {
        const ns = { ...prev }
        if (result === 'win') ns.you += 1
        else if (result === 'lose') ns.ai += 1
        return ns
      })
      setRpsRoundResults(prev => [...prev, { round: rpsRoundRef.current, playerChoice: ppc, aiChoice: aic, result, bonus: ppI.bonus, playerPower: fp, aiPower: ap }])
      setRpsPhase('round_result')
      rpsSlowMo.current = 0

      setTimeout(() => {
        if (!rpsActiveGuard.current?.v) return
        setRpsScore(prev => {
          if (prev.you >= 3) {
            setRpsPhase('final')
            const bonusMult = 1 + (ppI.bonus / 100)
            const baseCoins = Math.round(80 * bonusMult)
            playFx('win'); spawnConfetti(50)
            setCommentary('CHAMPION! You dominated the Puff Dojo!')
            notify('CHAMPION! +' + baseCoins + ' coins!', C.gold)
            recordGameResult(true, 30, 20, { bleConnected, zone: 'arcade', gameActive })
            return prev
          }
          if (prev.ai >= 3) {
            setRpsPhase('final')
            playFx('lose')
            setCommentary('Defeated... ' + (rpsResolveRef.current?.opp?.name || 'AI') + ' was too strong!')
            recordGameResult(false, 5, 8, { bleConnected, zone: 'arcade', gameActive })
            return prev
          }
          const nextRound = rpsRoundRef.current + 1
          if (nextRound >= 5) {
            setRpsPhase('final')
            if (prev.you > prev.ai) { playFx('win'); spawnConfetti(50); setCommentary('CHAMPION!'); recordGameResult(true, 30, 20, { bleConnected, zone: 'arcade', gameActive }) }
            else if (prev.ai > prev.you) { playFx('lose'); setCommentary('Defeated!'); recordGameResult(false, 5, 8, { bleConnected, zone: 'arcade', gameActive }) }
            else { playFx('crowd'); setCommentary('DRAW! Equal warriors!'); recordGameResult(false, 5, 8, { bleConnected, zone: 'arcade', gameActive }) }
            return prev
          }
          if (result === 'draw') {
            setRpsPlayerChoice(null); rpsPlayerChoiceRef.current = null
            setRpsAiChoice(null)
            setRpsPuffPower(0); setRpsResult(null)
            setRpsPhase('choose')
            setCommentary('DRAW! Replay Round ' + (rpsRoundRef.current + 1) + '!')
          } else {
            setRpsRound(nextRound); rpsRoundRef.current = nextRound
            setRpsPlayerChoice(null); rpsPlayerChoiceRef.current = null
            setRpsAiChoice(null)
            setRpsPuffPower(0); setRpsResult(null)
            setRpsPhase('choose')
            setCommentary('Round ' + (nextRound + 1) + ' -- Choose your throw!')
          }
          return prev
        })
      }, 2500)
    }, 1200)
  }, [mpActive, rpsOpponent, playFx, spawnConfetti, recordGameResult, bleConnected, gameActive, notify])

  // ─── End Game / Cleanup (Rule 8: gameSoundsMuted FIRST) ─────
  const rpsEndGame = useCallback(() => {
    gameSoundsMuted.current = true
    if (rpsPuffInterval.current) { clearInterval(rpsPuffInterval.current); rpsPuffInterval.current = null }
    if (rpsAnimRef.current) { cancelAnimationFrame(rpsAnimRef.current); rpsAnimRef.current = null }
    if (rpsActiveGuard.current) { rpsActiveGuard.current.v = false; rpsActiveGuard.current = null }
    const p2 = (window as any)._rpsP2
    if (p2?.interval) clearInterval(p2.interval)
    ;(window as any)._rpsP2 = null
    rpsPuffActiveRef.current = false
    setRpsPhase(null)
    exitGame()
  }, [exitGame, gameSoundsMuted])

  // ─── Auto-start on mount ────────────────────────────────────
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startRps()
    return () => {
      gameSoundsMuted.current = true
      if (rpsPuffInterval.current) clearInterval(rpsPuffInterval.current)
      if (rpsAnimRef.current) cancelAnimationFrame(rpsAnimRef.current)
      if (rpsActiveGuard.current) rpsActiveGuard.current.v = false
      const p2 = (window as any)._rpsP2
      if (p2?.interval) clearInterval(p2.interval)
      ;(window as any)._rpsP2 = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── BLE Handler Registration (Rule 3: lazy wrappers) ───────
  useEffect(() => {
    const down = () => rpsStartPuff()
    const up = () => rpsStopPuff()
    registerPuffHandlers('rps', down, up)
    // 1v1 MP: Slot 0 = P1 (existing), Slot 1 = P2 (puff duration = choice)
    if (mpActive && (ssPlayerCount || 0) >= 2) {
      if (!window._rpsP2) {
        window._rpsP2 = { puffStart: 0, puffDuration: 0, choice: null }
      }
      const handlers: { [slot: number]: { down: (() => void) | null; up: (() => void) | null } } = {}
      handlers[0] = { down, up }
      handlers[1] = {
        down: () => { window._rpsP2!.puffStart = Date.now() },
        up: () => {
          const dur = (Date.now() - (window._rpsP2!.puffStart || 0)) / 1000
          window._rpsP2!.puffDuration = dur
          // short = rock, medium = paper, long = scissors
          if (dur < 1.0) window._rpsP2!.choice = 'rock'
          else if (dur < 2.5) window._rpsP2!.choice = 'paper'
          else window._rpsP2!.choice = 'scissors'
        },
      }
      // Remaining slots get null
      for (let s = 2; s < (ssPlayerCount || 2); s++) {
        handlers[s] = { down: null, up: null }
      }
      registerSlotPuffHandlers(handlers)
    }
    return () => {
      registerPuffHandlers(null, null, null)
      window._rpsP2 = undefined
    }
  }, [registerPuffHandlers, registerSlotPuffHandlers, rpsStartPuff, rpsStopPuff, mpActive, ssPlayerCount])

  if (!rpsPhase) return null

  const opp = rpsOpponent || RPS_OPPONENTS[0]
  const pwrInfo = rpsGetPowerLabel(rpsPuffPower)
  const isIntro = rpsPhase === 'intro'
  const isChoose = rpsPhase === 'choose'
  const isPuff = rpsPhase === 'puff'
  const isClash = rpsPhase === 'clash'
  const isRoundResult = rpsPhase === 'round_result'
  const isFinal = rpsPhase === 'final'
  const youWinFinal = rpsScore.you >= 3
  const youLoseFinal = rpsScore.ai >= 3

  const rpsFinalOverlay = isFinal ? (() => {
    const won = youWinFinal
    const lost = youLoseFinal
    const draw = !won && !lost
    const bonusMult = 1 + ((rpsResolveRef.current?.playerPwrInfo?.bonus || 0) / 100)
    const baseR = won ? Math.round(80 * bonusMult) : draw ? 40 : 20
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(12px)' }}>
        <div style={{ fontSize: 50, marginBottom: 8 }}>{won ? '\uD83C\uDFC6' : lost ? '\uD83D\uDC80' : '\uD83E\uDD1D'}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: won ? C.green : lost ? C.red : C.gold }}>{won ? 'CHAMPION!' : lost ? 'DEFEATED' : 'DRAW!'}</div>
        <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{won ? 'You dominated the Puff Dojo!' : lost ? (opp.name + ' was too strong!') : 'Equal warriors in the dojo!'}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 8 }}>{rpsScore.you} - {rpsScore.ai}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8, marginBottom: 8 }}>
          {rpsRoundResults.map((rr, i) => (
            <div key={'rrf' + i} style={{
              padding: '4px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700,
              background: `${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}15`,
              color: rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold,
              border: `1px solid ${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}30`,
            }}>
              R{i + 1}: {RPS_EMOJI[rr.playerChoice]} {rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D'}
            </div>
          ))}
        </div>
        {rpsStreak >= 2 && <div style={{ fontSize: 11, color: C.green, marginBottom: 4 }}>Win streak: {rpsStreak}</div>}
        <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', maxWidth: 260, textAlign: 'center', marginBottom: 8 }}>{commentary}</div>
        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: '80%', maxWidth: 260, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: (C as any).text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
            <span style={{ color: C.text }}>Earned</span>
            <span style={{ color: C.gold }}>+{baseR} \uD83E\uDE99</span>
          </div>
          {won && (rpsResolveRef.current?.playerPwrInfo?.bonus || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.green, marginTop: 4 }}>
              <span>Puff bonus</span><span>+{rpsResolveRef.current.playerPwrInfo.bonus}%</span>
            </div>
          )}
          {!bleConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.orange, marginTop: 4 }}>
              <span>Without device</span><span>70%</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div data-btn="true" onClick={(e) => { e.stopPropagation(); startedRef.current = false; rpsEndGame() }}
            style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', touchAction: 'none', background: `${(C as any).purple || C.cyan}15`, border: `1px solid ${(C as any).purple || C.cyan}30`, fontSize: 13, fontWeight: 800, color: (C as any).purple || C.cyan }}>
            Done
          </div>
        </div>
      </div>
    )
  })() : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {/* HEADER */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, background: 'rgba(6,16,30,0.98)', borderBottom: '1px solid rgba(192,132,252,0.12)' }}>
        <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span></span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>{bleConnected ? 'Puff' : 'Connect'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)' }}>
              <span style={{ fontSize: 9 }}>🪙</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>{player.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '2px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div onClick={() => { playFx('click'); rpsEndGame() }} data-btn="true"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '3px 8px', borderRadius: 8, touchAction: 'none', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.text2 }}>{'\u2190'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>Back</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: (C as any).purple || C.cyan }}>{'\uD83E\uDD4B'} PUFF DOJO</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>You: {rpsScore.you}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>AI: {rpsScore.ai}</span>
          </div>
        </div>
        <div style={{ padding: '2px 12px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: (C as any).text3, marginRight: 4 }}>First to 3</span>
            {[0, 1, 2, 3, 4].map(i => {
              const rr = rpsRoundResults[i]
              const col = rr ? (rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold) : 'rgba(255,255,255,0.12)'
              return (
                <div key={'rri' + i} style={{
                  width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 800, color: rr ? '#fff' : (C as any).text3,
                  background: rr ? col + '30' : col, border: `1px solid ${rr ? col + '50' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s',
                }}>
                  {rr ? (rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'D') : (i + 1)}
                </div>
              )
            })}
            {rpsStreak >= 2 && <span style={{ fontSize: 8, fontWeight: 800, color: C.green, marginLeft: 4 }}>x{rpsStreak}</span>}
          </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; if (isPuff) rpsStartPuff() }}
        onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; rpsStopPuff() }}
        onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; e.stopPropagation(); e.preventDefault(); if (isPuff) rpsStartPuff() }}
        onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; rpsStopPuff() }}
        onTouchCancel={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; rpsStopPuff() }}>
        <canvas ref={rpsCanvasRef} width={Math.round(420 * RPS_DPR)} height={Math.round(600 * RPS_DPR)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {!isFinal && (
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textShadow: '0 0 8px rgba(255,68,68,0.3)' }}>vs {opp.emoji} {opp.name}</div>
          </div>
        )}
        {commentary && !isFinal && (
          <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '4px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 300, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>{commentary}</div>
          </div>
        )}

        {rpsFinalOverlay}

        {/* CONTROLS SLOT (bottom) */}
        {!isFinal && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', padding: '0 12px' }}>
            {isIntro && (
              <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(255,217,61,0.06)', border: `1px solid ${C.gold}20` }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, letterSpacing: 1 }}>
                  {rpsIntro >= 4 ? 'FIGHT!' : rpsIntro >= 3 ? 'BEST OF 5!' : rpsIntro >= 2 ? '"' + opp.taunt + '"' : 'VS ' + opp.name}
                </div>
              </div>
            )}
            {isChoose && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {RPS_CHOICES.map(ch => {
                  const chCol = ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red
                  return (
                    <div key={ch} data-btn="true"
                      onClick={(e) => { e.stopPropagation(); rpsPickChoice(ch) }}
                      onTouchStart={(e) => { e.stopPropagation(); e.preventDefault() }}
                      onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); rpsPickChoice(ch) }}
                      style={{
                        width: 80, height: 80, borderRadius: 14, cursor: 'pointer', touchAction: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                        background: `linear-gradient(135deg, ${chCol}15, ${chCol}08)`,
                        border: `2px solid ${chCol}35`,
                        boxShadow: `0 4px 16px ${chCol}12`,
                        userSelect: 'none', WebkitUserSelect: 'none',
                      }}>
                      <div style={{ fontSize: 32 }}>{RPS_EMOJI[ch]}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: chCol, textTransform: 'uppercase' }}>{ch}</div>
                    </div>
                  )
                })}
              </div>
            )}
            {isPuff && (
              <div style={{ width: '100%', textAlign: 'center', padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>{rpsPlayerChoice ? RPS_EMOJI[rpsPlayerChoice] : ''}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.text2 }}>{(rpsPlayerChoice || '').toUpperCase()} chosen</span>
                </div>
                {/* Inline puff power bar */}
                <div style={{ width: '90%', maxWidth: 300, margin: '0 auto 4px' }}>
                  <div style={{ height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: `1px solid ${rpsPuffHeld ? pwrInfo.color + '60' : 'rgba(255,255,255,0.1)'}`, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${rpsPuffPower}%`, background: `linear-gradient(90deg, ${C.cyan}, ${pwrInfo.color})`, transition: 'width 0.05s linear' }} />
                    <div style={{ position: 'absolute', right: 6, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 9, fontWeight: 900, color: '#fff', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>{Math.round(rpsPuffPower)}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: pwrInfo.color }}>{pwrInfo.label} {rpsPuffPower >= 90 ? '\uD83D\uDC80' : ''} +{pwrInfo.bonus}%</div>
                {rpsPuffHeld && <div style={{ fontSize: 9, color: C.gold }}>Charging... release to clash!</div>}
                {!rpsPuffHeld && rpsPuffPower === 0 && <div style={{ fontSize: 9, color: (C as any).text3 }}>Hold anywhere or puff to charge</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 2, fontSize: 7, color: (C as any).text3 }}>
                  <span>Tap: +0%</span><span>Puff: +5%</span><span>Real: +15%</span><span>Blinker: +20%</span>
                </div>
              </div>
            )}
            {isClash && (
              <div style={{ textAlign: 'center', padding: '6px 16px', borderRadius: 12, background: 'rgba(255,200,50,0.1)', border: '1px solid rgba(255,200,50,0.2)' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.gold, letterSpacing: 2 }}>CLASH!</div>
              </div>
            )}
            {isRoundResult && (
              <div style={{ textAlign: 'center', padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontSize: 28 }}>{rpsPlayerChoice ? RPS_EMOJI[rpsPlayerChoice] : ''}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: (C as any).text3 }}>vs</span>
                  <span style={{ fontSize: 28 }}>{rpsAiChoice ? RPS_EMOJI[rpsAiChoice] : '?'}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: rpsResult === 'win' ? C.green : rpsResult === 'lose' ? C.red : C.gold }}>
                  {rpsResult === 'win' ? 'YOU WIN!' : rpsResult === 'lose' ? 'DEFEATED!' : 'DRAW - REPLAY!'}
                </div>
                {rpsResult === 'win' && <div style={{ fontSize: 10, color: C.green }}>+{pwrInfo.bonus}% coin bonus</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
