import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const RPS_OPPONENTS = [
  { name: "Sensei Stoner", emoji: "🧘", taunt: "My third eye sees your throw", style: "balanced" },
  { name: "Rocky Blaze", emoji: "🪨", taunt: "Rock solid every time", style: "rock_heavy" },
  { name: "Scissor Hands", emoji: "✂️", taunt: "Snip snip, smokey", style: "scissors_heavy" },
  { name: "Paper Trail", emoji: "📄", taunt: "Roll it up and smoke it", style: "paper_heavy" },
  { name: "The Blinker", emoji: "💨", taunt: "MAXIMUM POWER always", style: "blinker" },
  { name: "Puff Master", emoji: "👑", taunt: "I read you like a rolling paper", style: "adaptive" },
]

const RPS_CHOICES = ["rock", "paper", "scissors"] as const
type RpsChoice = typeof RPS_CHOICES[number]
const RPS_EMOJI: Record<RpsChoice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" }
const RPS_BEATS: Record<RpsChoice, RpsChoice> = { rock: "scissors", paper: "rock", scissors: "paper" }

const RPS_WIN_COMMENTS = [
  ["Paper wraps rock like a rolling paper! 📄🪨", "Rock crushes scissors through the smoke! 🪨✂️", "Scissors cut through the haze! ✂️💨"],
  ["CLEAN WIN! That throw was precise 🎯", "The puff powered that throw HARD 💪💨", "AI didn't see that coming! 👀"],
  ["POWER THROW! The dojo is shaking! 🔥🏯", "That rock is ON FIRE! 🔥🪨", "Blinker energy on that throw! 💨💨💨"],
]
const RPS_LOSE_COMMENTS = [
  "AI read you like a menu at the dispensary 😤", "Outplayed! Time to take another hit 💨", "The bot's got smoke-vision 🤖💨",
  "That throw was weaker than mids 😬", "AI flexed HARD on that one 💀", "Counter-puffed! Better luck next round 🌬️",
]
const RPS_TIE_COMMENTS = [
  "SAME THROW! Puff power decides it! 💨⚡", "Mirror match! Who puffed harder?! 🪞", "Identical minds... comparing puff power! 🧠💨",
]
const RPS_BLINKER_COMMENTS = [
  "BLINKER THROW! That rock is on FIRE! 🔥🪨", "ULTRA POWER! Maximum puff energy! 💨💨💨", "BLINKER RISK! High reward or high regret! ⚡💀",
]

function getAiChoice(opp: typeof RPS_OPPONENTS[0]): RpsChoice {
  const r = Math.random()
  if (opp.style === "rock_heavy") return r < 0.5 ? "rock" : r < 0.75 ? "paper" : "scissors"
  if (opp.style === "scissors_heavy") return r < 0.5 ? "scissors" : r < 0.75 ? "rock" : "paper"
  if (opp.style === "paper_heavy") return r < 0.5 ? "paper" : r < 0.75 ? "scissors" : "rock"
  return RPS_CHOICES[Math.floor(Math.random() * 3)]
}

function getPowerLabel(power: number) {
  if (power < 10) return { label: "Tap", tier: "weak", points: 1, color: C.text3 }
  if (power < 40) return { label: "Short", tier: "normal", points: 2, color: C.cyan }
  if (power < 70) return { label: "Perfect", tier: "power", points: 3, color: C.green }
  if (power < 90) return { label: "Long", tier: "strong", points: 4, color: C.orange }
  return { label: "BLINKER", tier: "ultra", points: 5, color: C.red }
}

type Phase = 'intro' | 'choose' | 'puff' | 'clash' | 'round_result' | 'final'
type RoundResult = { round: number; playerChoice: RpsChoice; aiChoice: RpsChoice; result: string; pts: number; playerPower: number; aiPower: number }

export default function PuffRPS() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<Phase>('intro')
  const [opponent, setOpponent] = useState(RPS_OPPONENTS[0])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [playerChoice, setPlayerChoice] = useState<RpsChoice | null>(null)
  const [aiChoice, setAiChoice] = useState<RpsChoice | null>(null)
  const [puffPower, setPuffPower] = useState(0)
  const [aiPuffPower, setAiPuffPower] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [introStep, setIntroStep] = useState(0)
  const [puffHeld, setPuffHeld] = useState(false)
  const [clashAnim, setClashAnim] = useState(false)
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [commentary, setCommentary] = useState('')
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const puffStart = useRef(0)
  const puffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffActiveRef = useRef(false)
  const playerChoiceRef = useRef<RpsChoice | null>(null)
  const resolveRef = useRef<ReturnType<typeof getPowerLabel> & { pc: RpsChoice; aiChoice: RpsChoice; finalPower: number; aiPwr: number; aiPwrInfo: ReturnType<typeof getPowerLabel> } | null>(null)
  const roundRef = useRef(0)
  const scoreRef = useRef({ you: 0, ai: 0 })
  const streakRef = useRef(0)
  const activeRef = useRef(true)
  const opponentRef = useRef(RPS_OPPONENTS[0])

  const spawnConfetti = (count = 40) => {
    const colors = [C.gold, C.cyan, C.green, C.pink, C.orange]
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
    }))
    setConfetti(particles)
    setTimeout(() => setConfetti([]), 2000)
  }

  const triggerFlash = (type: string) => {
    setScreenFlash(type)
    setTimeout(() => setScreenFlash(null), 400)
  }

  const triggerShake = () => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 400)
  }

  const startGame = useCallback(() => {
    const opp = RPS_OPPONENTS[Math.floor(Math.random() * RPS_OPPONENTS.length)]
    setOpponent(opp)
    opponentRef.current = opp
    activeRef.current = true
    setRound(0)
    roundRef.current = 0
    setScore({ you: 0, ai: 0 })
    scoreRef.current = { you: 0, ai: 0 }
    setStreak(0)
    streakRef.current = 0
    setPlayerChoice(null)
    playerChoiceRef.current = null
    setAiChoice(null)
    setPuffPower(0)
    setAiPuffPower(0)
    setResult(null)
    setClashAnim(false)
    setPointsAwarded(0)
    setRoundResults([])
    setPuffHeld(false)
    setPhase('intro')
    setIntroStep(1)
    playFx('crowd')
    setCommentary(`Welcome to the Puff Dojo! ${opp.emoji}`)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(2); setCommentary(`${opp.name}: "${opp.taunt}"`) }, 1000)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(3); playFx('whistle'); setCommentary('Best of 5 rounds... FIGHT!') }, 2000)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(4); triggerFlash('goal'); playFx('crowd') }, 2800)
    setTimeout(() => { if (!activeRef.current) return; setPhase('choose'); setIntroStep(0); setCommentary('Round 1 — Choose your throw!') }, 3500)
  }, [playFx])

  const pickChoice = (ch: RpsChoice) => {
    if (phase !== 'choose') return
    setPlayerChoice(ch)
    playerChoiceRef.current = ch
    playFx('select')
    setCommentary('Now HOLD TO POWER UP your throw! 💪')
    setPhase('puff')
    setPuffPower(0)
    setAiPuffPower(0)
  }

  const startPuff = useCallback(() => {
    if (puffActiveRef.current) return
    puffActiveRef.current = true
    setPuffHeld(true)
    puffStart.current = Date.now()
    puffInterval.current = setInterval(() => {
      const elapsed = (Date.now() - puffStart.current) / 1000
      setPuffPower(Math.min(100, elapsed * 20))
    }, 30)
  }, [])

  const stopPuff = useCallback(() => {
    if (!puffActiveRef.current) return
    puffActiveRef.current = false
    setPuffHeld(false)
    if (puffInterval.current) { clearInterval(puffInterval.current); puffInterval.current = null }
    const elapsed = (Date.now() - puffStart.current) / 1000
    const finalPower = Math.min(100, elapsed * 20)
    setPuffPower(finalPower)
    if (!activeRef.current) return

    const opp = opponentRef.current
    const aiCh = getAiChoice(opp)
    setAiChoice(aiCh)
    let aiPwr = 30 + Math.random() * 40
    if (opp.style === 'blinker') aiPwr = 80 + Math.random() * 20
    setAiPuffPower(aiPwr)

    const playerPwrInfo = getPowerLabel(finalPower)
    const aiPwrInfo = getPowerLabel(aiPwr)
    const pc = playerChoiceRef.current!
    resolveRef.current = { ...playerPwrInfo, pc, aiChoice: aiCh, finalPower, aiPwr, aiPwrInfo }

    setPhase('clash')
    setClashAnim(true)
    triggerShake()
    playFx('punch_clash')
    if (playerPwrInfo.tier === 'ultra') setCommentary(RPS_BLINKER_COMMENTS[Math.floor(Math.random() * RPS_BLINKER_COMMENTS.length)])
    else setCommentary('CLASH! 💥')

    setTimeout(() => {
      if (!activeRef.current) return
      setClashAnim(false)
      const d = resolveRef.current
      if (!d) return
      const { pc, aiChoice: aiCh, finalPower, aiPwr, playerPwrInfo: pwrInfo, aiPwrInfo } = { ...d, playerPwrInfo: d }
      let res: string, pts = 0

      if (pc === aiCh) {
        if (finalPower > aiPwr + 5) { res = 'win'; pts = d.points; setCommentary(`TIE BROKEN by puff power! You puffed harder! ${finalPower > aiPwr + 30 ? 'DOMINANT! 💨💨' : 'Barely! 😮'}`) }
        else if (aiPwr > finalPower + 5) { res = 'lose'; pts = 0; setCommentary('TIE BROKEN by puff power! AI puffed harder! 😤💨') }
        else { res = 'tie'; pts = 1; setCommentary(RPS_TIE_COMMENTS[Math.floor(Math.random() * RPS_TIE_COMMENTS.length)]) }
      } else if (RPS_BEATS[pc] === aiCh) {
        res = 'win'; pts = d.points
        if (d.tier === 'ultra') { pts = 5; triggerFlash('goal'); spawnConfetti(40) }
        else if (d.tier === 'power') { triggerFlash('goal'); spawnConfetti(20) }
        const ci = d.tier === 'power' || d.tier === 'ultra' ? 2 : d.tier === 'normal' ? 1 : 0
        setCommentary(RPS_WIN_COMMENTS[ci][Math.floor(Math.random() * RPS_WIN_COMMENTS[ci].length)])
        playFx('goal')
      } else {
        if (d.tier === 'ultra') { res = 'lose'; pts = -3; setCommentary('BLINKER BACKFIRE! AI gets +3 bonus! 💀🔥'); triggerFlash('miss') }
        else { res = 'lose'; pts = 0; setCommentary(RPS_LOSE_COMMENTS[Math.floor(Math.random() * RPS_LOSE_COMMENTS.length)]) }
        playFx('miss'); triggerShake()
      }

      setResult(res)
      setPointsAwarded(pts)
      const newStreak = res === 'win' ? streakRef.current + 1 : 0
      setStreak(newStreak)
      streakRef.current = newStreak

      const newScore = { ...scoreRef.current }
      if (res === 'win') newScore.you += pts
      else if (res === 'lose' && pts < 0) newScore.ai += Math.abs(pts)
      else if (res === 'lose') newScore.ai += aiPwrInfo.tier === 'ultra' ? 5 : aiPwrInfo.tier === 'power' ? 3 : 2
      else if (res === 'tie') { newScore.you += 1; newScore.ai += 1 }
      setScore(newScore)
      scoreRef.current = newScore

      const rr: RoundResult = { round: roundRef.current, playerChoice: pc, aiChoice: aiCh, result: res, pts, playerPower: finalPower, aiPower: aiPwr }
      setRoundResults(prev => [...prev, rr])
      setPhase('round_result')

      setTimeout(() => {
        if (!activeRef.current) return
        const nextRound = roundRef.current + 1
        if (nextRound >= 5) {
          setPhase('final')
          const s = scoreRef.current
          if (s.you > s.ai) { playFx('win'); spawnConfetti(50); triggerFlash('goal'); setCommentary('CHAMPION! You dominated the Puff Dojo! 🏆💨'); awardGame({ won: true, baseCoins: 80, baseXP: 20 }) }
          else if (s.ai > s.you) { playFx('lose'); triggerFlash('miss'); setCommentary('Defeated... The opponent was too strong! 💀'); awardGame({ won: false, baseCoins: 10, baseXP: 8 }) }
          else { playFx('crowd'); setCommentary('DRAW! Equal warriors in the dojo! 🤝'); awardGame({ won: false, baseCoins: 20, baseXP: 10 }) }
        } else {
          setRound(nextRound)
          roundRef.current = nextRound
          setPlayerChoice(null)
          playerChoiceRef.current = null
          setAiChoice(null)
          setPuffPower(0)
          setResult(null)
          setPhase('choose')
          setCommentary(`Round ${nextRound + 1} — Choose your throw!`)
        }
      }, 2500)
    }, 1200)
  }, [playFx, awardGame])

  const handlePuffDown = useCallback(() => {
    if (phase === 'puff') startPuff()
  }, [phase, startPuff])

  const handlePuffUp = useCallback(() => {
    stopPuff()
  }, [stopPuff])

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

  const pwrInfo = getPowerLabel(puffPower)
  const aiPwrInfo = getPowerLabel(aiPuffPower)
  const isIntro = phase === 'intro'
  const isChoose = phase === 'choose'
  const isPuff = phase === 'puff'
  const isClash = phase === 'clash'
  const isRoundResult = phase === 'round_result'
  const isFinal = phase === 'final'
  const youWinFinal = score.you > score.ai
  const youLoseFinal = score.ai > score.you

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; if (isPuff) startPuff() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; stopPuff() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); if (isPuff) startPuff() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); stopPuff() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0520 0%, #12083a 20%, #1a0e4a 40%, #0f0830 65%, #080418 100%)' }} />
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.purple}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${C.cyan}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
      {isClash && clashAnim && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: 'rgba(255,200,50,0.3)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.25)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />
      ))}

      <div data-back="true" onClick={() => { activeRef.current = false; navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 6, zIndex: 10, overflowY: 'auto', flex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isFinal ? 'FINAL RESULT' : 'PUFF DOJO'}
          </div>
          <div style={{ fontSize: 9, color: C.text3 }}>
            Round {Math.min(round + 1, 5)}/5 {" "} You: {score.you} vs AI: {score.ai}
            {streak > 1 && ` | Streak: ${streak}`}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '90%', maxWidth: 280, marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, minWidth: 24, textAlign: 'right' }}>{score.you}</div>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: ((score.you / (score.you + score.ai + 1)) * 100) + '%', background: `linear-gradient(90deg,${C.cyan},${C.purple})`, borderRadius: 3, transition: 'width 0.5s' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: ((score.ai / (score.you + score.ai + 1)) * 100) + '%', background: `linear-gradient(90deg,${C.orange},${C.red})`, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.red, minWidth: 24 }}>{score.ai}</div>
        </div>

        {/* Round indicators */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[0, 1, 2, 3, 4].map(i => {
            const rr = roundResults[i]
            const bg = rr ? (rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold) : 'rgba(255,255,255,0.08)'
            const label = rr ? (rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'T') : (i + 1)
            return <div key={'rr' + i} style={{ width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: rr ? '#fff' : C.text3, background: rr ? bg + '30' : bg, border: `1px solid ${rr ? bg + '50' : 'rgba(255,255,255,0.1)'}` }}>{label}</div>
          })}
        </div>

        {/* INTRO */}
        {isIntro && (
          <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.4s ease' }}>
            {introStep >= 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', animation: 'slideInLeft 0.6s ease' }}>
                  <div style={{ fontSize: 40, marginBottom: 4 }}>😤</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.cyan }}>YOU</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.gold, animation: 'pulse 1s infinite' }}>VS</div>
                <div style={{ textAlign: 'center', animation: 'slideInRight 0.6s ease', opacity: introStep >= 2 ? 1 : 0 }}>
                  <div style={{ fontSize: 40, marginBottom: 4 }}>{opponent.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.red }}>{opponent.name}</div>
                </div>
              </div>
            )}
            {introStep >= 2 && <div style={{ fontSize: 12, color: C.text2, fontStyle: 'italic', marginBottom: 8 }}>"{opponent.taunt}"</div>}
            {introStep >= 3 && <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, animation: 'countPulse 0.5s infinite' }}>BEST OF 5!</div>}
            {introStep >= 4 && <div style={{ fontSize: 28, fontWeight: 900, color: C.green, marginTop: 8, animation: 'countPulse 0.3s infinite' }}>FIGHT!</div>}
          </div>
        )}

        {/* CHOOSE */}
        {isChoose && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease', width: '100%' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text2, marginBottom: 12 }}>Choose your throw!</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              {RPS_CHOICES.map(ch => (
                <div key={ch} onClick={(e) => { e.stopPropagation(); pickChoice(ch) }}
                  style={{ width: 90, height: 100, borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: `linear-gradient(135deg, ${ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red}12, ${ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red}06)`, border: `2px solid ${ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red}30` }}>
                  <div style={{ fontSize: 36 }}>{RPS_EMOJI[ch]}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ch === 'rock' ? C.orange : ch === 'paper' ? C.cyan : C.red, textTransform: 'uppercase' }}>{ch}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: C.text3 }}>vs {opponent.emoji} {opponent.name}</div>
          </div>
        )}

        {/* PUFF */}
        {isPuff && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease', width: '100%' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{playerChoice && RPS_EMOJI[playerChoice]}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text2, marginBottom: 4 }}>You chose {playerChoice?.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>Now HOLD to charge puff power!</div>
            {/* Power bar */}
            <div style={{ width: '80%', maxWidth: 260, margin: '0 auto 8px', height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, width: puffPower + '%', background: `linear-gradient(90deg, ${C.cyan}, ${pwrInfo.color})`, borderRadius: 10, transition: 'none' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: pwrInfo.color, marginBottom: 4 }}>{pwrInfo.label} {puffPower >= 90 && '💀'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: pwrInfo.color }}>+{pwrInfo.points}</div>
            {puffHeld && <div style={{ fontSize: 10, color: C.gold, marginTop: 6, animation: 'pulse 0.5s infinite' }}>Charging... release to throw!</div>}
            {!puffHeld && puffPower === 0 && <div style={{ fontSize: 10, color: C.text3, marginTop: 6 }}>Hold anywhere to charge</div>}
          </div>
        )}

        {/* CLASH */}
        {isClash && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', animation: clashAnim ? 'slideInLeft 0.4s ease' : 'none' }}>
                <div style={{ fontSize: 48, animation: clashAnim ? 'countPulse 0.3s infinite' : 'none' }}>{playerChoice && RPS_EMOJI[playerChoice]}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, marginTop: 4 }}>YOU</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, animation: clashAnim ? 'countPulse 0.2s infinite' : 'none' }}>{clashAnim ? '💥' : 'VS'}</div>
              <div style={{ textAlign: 'center', animation: clashAnim ? 'slideInRight 0.4s ease' : 'none' }}>
                <div style={{ fontSize: 48, animation: clashAnim ? 'countPulse 0.3s infinite' : 'none' }}>{aiChoice ? RPS_EMOJI[aiChoice] : '?'}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.red, marginTop: 4 }}>AI</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, animation: 'pulse 0.5s infinite' }}>CLASH!</div>
          </div>
        )}

        {/* ROUND RESULT */}
        {isRoundResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 42 }}>{playerChoice && RPS_EMOJI[playerChoice]}</div>
                <div style={{ fontSize: 9, color: C.cyan, fontWeight: 700, marginTop: 2 }}>YOU ({pwrInfo.label})</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text3 }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 42 }}>{aiChoice ? RPS_EMOJI[aiChoice] : '?'}</div>
                <div style={{ fontSize: 9, color: C.red, fontWeight: 700, marginTop: 2 }}>AI ({aiPwrInfo.label})</div>
              </div>
            </div>
            {result === 'win' && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 28, fontWeight: 900, color: C.green, animation: 'countPulse 0.8s infinite' }}>YOU WIN! 🏆</div><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>+{pointsAwarded} pts</div></div>}
            {result === 'lose' && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 28, fontWeight: 900, color: C.red, animation: 'shake 0.4s ease' }}>DEFEATED 💀</div>{pointsAwarded < 0 && <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Blinker backfire! -{Math.abs(pointsAwarded)}</div>}</div>}
            {result === 'tie' && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 24, fontWeight: 900, color: C.gold }}>TIE!</div><div style={{ fontSize: 11, color: C.text2 }}>Puff power decided it</div><div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginTop: 2 }}>+{pointsAwarded} pts</div></div>}
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginTop: 6, maxWidth: 260, margin: '6px auto' }}>{commentary}</div>
          </div>
        )}

        {/* FINAL */}
        {isFinal && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
            {youWinFinal && <div><div style={{ fontSize: 56, marginBottom: 8, animation: 'countPulse 1s infinite' }}>🏆</div><div style={{ fontSize: 26, fontWeight: 900, color: C.green, marginBottom: 4 }}>CHAMPION!</div><div style={{ fontSize: 13, color: C.text2, marginBottom: 2 }}>You dominated the Puff Dojo!</div></div>}
            {youLoseFinal && <div><div style={{ fontSize: 56, marginBottom: 8 }}>💀</div><div style={{ fontSize: 26, fontWeight: 900, color: C.red, marginBottom: 4 }}>DEFEATED</div><div style={{ fontSize: 13, color: C.text2, marginBottom: 2 }}>{opponent.name} was too strong!</div></div>}
            {!youWinFinal && !youLoseFinal && <div><div style={{ fontSize: 56, marginBottom: 8 }}>🤝</div><div style={{ fontSize: 26, fontWeight: 900, color: C.gold, marginBottom: 4 }}>DRAW!</div><div style={{ fontSize: 13, color: C.text2, marginBottom: 2 }}>Equal warriors in the dojo!</div></div>}
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>{score.you} - {score.ai}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
              {roundResults.map((rr, i) => (
                <div key={'rrf' + i} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: `${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}15`, color: rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold, border: `1px solid ${rr.result === 'win' ? C.green : rr.result === 'lose' ? C.red : C.gold}30` }}>
                  R{i + 1}: {RPS_EMOJI[rr.playerChoice]} {rr.result === 'win' ? 'W' : rr.result === 'lose' ? 'L' : 'T'}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.text2, fontStyle: 'italic', marginBottom: 12 }}>{commentary}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 13, fontWeight: 800, color: C.purple }}>🥋 Rematch</div>
              <div data-btn="true" onClick={(e) => { e.stopPropagation(); navigate('/arcade') }} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done ✓</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
