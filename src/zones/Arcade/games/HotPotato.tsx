import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PLAYER_IMG = 'https://api.dicebear.com/9.x/adventurer/svg?seed=Steve420&backgroundColor=transparent&skinColor=f2d3b1'

const HP_COMMENTS = {
  hold: ["The bomb chose you... personally 💣😂","PUFF FASTER! It's about to blow! 🫁💨","Tick tock... your turn! ⏰💣","Don't panic... actually, PANIC! 😱","Hot hands! Pass it NOW! 🔥"],
  pass: ["Quick pass! Smart move 💨","Strategic skip! Sent it ahead! 🧠","Away it goes... someone else's problem 😏","Fast hands! Bomb transferred 💣➡️","YEET! That bomb is someone else's now 🫡"],
  skip: ["Strategic skip! Sent it 2 players ahead! 🧠","Skipped the neighbor! Big brain play 🧠💨","Long puff = long throw! Clever! 🎯","Power pass! Jumped right over them! 💪"],
  explode: ["BOOM! You held it like a phone with low battery 📱💀","KABOOM! Too slow! 💣💥","EXPLOSION! Should've puffed faster! 🫁💀","BOOM! Your hands are too slow! 💣💀","Detonated! That's gonna leave a mark 😂💥","BLEW UP! The bomb wins this round 💣🏆"],
  aiPass: ["AI passed it in 0.3 seconds... they know something you don't 🤖","AI yeets the bomb instantly 🤖💨","Bot reflexes! Passed in a blink 🤖⚡","AI doesn't hesitate. Neither should you 🤖"],
  win: ["SOLE SURVIVOR! The bomb fears you! 👑💣","Last one standing! Legendary lungs! 🫁🏆","Champion! Everyone else got roasted 🔥👑","WINNER! The others are toast 🍞💀"],
  tension: ["The fuse is getting shorter... 🧨","Everyone's sweating now 😰","Timer shrinking... danger rising! ⚠️","This round will be FAST 💨⚡"],
}
const HP_AI = [
  { name:"BombBot",    emoji:"🤖", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=BombBot&backgroundColor=transparent"    },
  { name:"HotHands",   emoji:"🔥", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=HotHands&backgroundColor=transparent"      },
  { name:"FuseRunner", emoji:"🧨", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=FuseRunner&backgroundColor=transparent"    },
  { name:"BlastZone",  emoji:"💥", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=BlastZone&backgroundColor=transparent" },
  { name:"TickTock",   emoji:"⏰", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=TickTock&backgroundColor=transparent"      },
  { name:"KaBoom",     emoji:"💣", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=KaBoom&backgroundColor=transparent"    },
  { name:"PuffQuick",  emoji:"💨", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=PuffQuick&backgroundColor=transparent"     },
]

type Player = { name: string; emoji: string; img: string; isYou: boolean; isAI: boolean; alive: boolean }
type HpPhase = 'intro' | 'playing' | 'exploding' | 'next_round' | 'result'

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const spawnConfetti = (count: number, colors: string[]) =>
  Array.from({ length: count }, (_, i) => ({ id: Date.now() + i, x: Math.random() * 100, y: Math.random() * 40, size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 360 }))

export default function HotPotato() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<HpPhase>('intro')
  const [players, setPlayers] = useState<Player[]>([])
  const [currentHolder, setCurrentHolder] = useState(0)
  const [bombTimer, setBombTimer] = useState(0)
  const [maxTimer, setMaxTimer] = useState(5)
  const [hpRound, setHpRound] = useState(1)
  const [passing, setPassing] = useState(false)
  const [exploded, setExploded] = useState<Player | null>(null)
  const [hpComment, setHpComment] = useState('')
  const [puffHeld, setPuffHeld] = useState(false)
  const [puffPower, setPuffPower] = useState(0)
  const [winner, setWinner] = useState<Player | null>(null)
  const [eliminatedList, setEliminatedList] = useState<Player[]>([])
  const [fuse, setFuse] = useState(1)
  const [tension, setTension] = useState(0)
  const [passTarget, setPassTarget] = useState<number | null>(null)
  const [introStage, setIntroStage] = useState(0)
  const [explosionParticles, setExplosionParticles] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([])
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const hpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hpPuffRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hpPuffStart = useRef(0)
  const activeRef = useRef(false)
  const holderRef = useRef(0)
  const playersRef = useRef<Player[]>([])
  const roundRef = useRef(1)
  const puffHeldRef = useRef(false)
  const timerRefNull = useRef<ReturnType<typeof setInterval> | null>(null)

  const triggerFlash = (type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }
  const triggerShake = () => { setScreenShake(true); setTimeout(() => setScreenShake(false), 500) }

  const setHolder = (idx: number) => { holderRef.current = idx; setCurrentHolder(idx) }
  const setPlayersSync = (p: Player[]) => { playersRef.current = p; setPlayers(p) }

  const findNextAlive = (ps: Player[], fromIdx: number, skip = 0): number | null => {
    let found = 0
    for (let i = 1; i <= ps.length * 2; i++) {
      const ni = (fromIdx + i) % ps.length
      if (ps[ni].alive) {
        if (found >= skip) return ni
        found++
      }
    }
    return null
  }

  const passBomb = useCallback((ps: Player[], fromIdx: number, skipCount: number, round: number) => {
    if (hpTimerRef.current === null) return
    const target = findNextAlive(ps, fromIdx, skipCount)
    if (target === null) return
    setPassing(true)
    setPassTarget(target)
    if (skipCount > 0) { setHpComment(pick(HP_COMMENTS.skip)); playFx('laugh') }
    else { setHpComment(pick(HP_COMMENTS.pass)); playFx('bomb_pass') }
    setTimeout(() => {
      if (!activeRef.current) return
      setHolder(target)
      setPassing(false)
      setPassTarget(null)
      if (ps[target].isAI) {
        setTimeout(() => { if (activeRef.current && hpTimerRef.current) aiTurn(ps, target, round) }, 400 + Math.random() * 1200)
      }
    }, 350)
  }, [playFx])

  const aiTurn = useCallback((ps: Player[], idx: number, round: number) => {
    if (!activeRef.current || hpTimerRef.current === null) return
    const holdTime = 300 + Math.random() * 1500
    setHpComment(pick(HP_COMMENTS.aiPass))
    setTimeout(() => {
      if (!activeRef.current || hpTimerRef.current === null) return
      const skip = Math.random() < 0.15 ? 1 : 0
      passBomb(ps, idx, skip, round)
    }, holdTime)
  }, [passBomb])

  const explodeBomb = useCallback((ps: Player[], round: number) => {
    if (hpTimerRef.current) { clearInterval(hpTimerRef.current); hpTimerRef.current = null }
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null }
    setPuffHeld(false)
    puffHeldRef.current = false
    setPuffPower(0)
    setPhase('exploding')
    setHpComment(pick(HP_COMMENTS.explode))
    triggerShake()
    triggerFlash('miss')
    playFx('bomb_explode')

    const parts = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 + 20,
      y: Math.random() * 40 + 30,
      size: 4 + Math.random() * 8,
      color: ["#FF4444","#FF8800","#FFCC00","#FF6600"][Math.floor(Math.random() * 4)],
    }))
    setExplosionParticles(parts)
    setTimeout(() => setExplosionParticles([]), 1500)

    const victimIdx = holderRef.current
    const victim = ps[victimIdx]
    setExploded(victim)
    const updated = ps.map((p, i) => i === victimIdx ? { ...p, alive: false } : p)
    setPlayersSync(updated)
    setEliminatedList(el => [...el, victim])
    setTension(t => Math.min(100, t + 20))

    setTimeout(() => {
      if (!activeRef.current) return
      const aliveCount = updated.filter(p => p.alive).length
      if (aliveCount <= 1) {
        const w = updated.find(p => p.alive) || null
        setWinner(w)
        setPhase('result')
        if (w && w.isYou) {
          setConfetti(spawnConfetti(50, [C.orange, C.gold, C.red, '#FF69B4']))
          setTimeout(() => setConfetti([]), 2500)
          playFx('win')
          playFx('crowd')
          triggerFlash('goal')
        } else {
          playFx('crowd')
        }
        setHpComment(pick(HP_COMMENTS.win))
        const hpWon = w?.isYou ?? false
        awardGame({ won: hpWon, baseCoins: hpWon ? 60 : 10, baseXP: hpWon ? 20 : 8 })
      } else {
        setPhase('next_round')
        setHpComment(`${aliveCount} remain... next round! 🔥`)
        setTimeout(() => { if (activeRef.current) startRound(updated, round + 1) }, 2200)
      }
    }, 2200)
  }, [playFx, awardGame])

  const startRound = useCallback((ps: Player[], round: number) => {
    const alive = ps.filter(p => p.alive)
    if (alive.length <= 1) return
    const maxT = Math.max(3, 6 - (round - 1) * 0.4 + (Math.random() * 2 - 1))
    setMaxTimer(maxT)
    setBombTimer(0)
    setFuse(1)
    setHpRound(round)
    roundRef.current = round
    setPassing(false)
    setExploded(null)
    setPuffHeld(false)
    puffHeldRef.current = false
    setPuffPower(0)
    setPassTarget(null)
    const aliveIdxs = ps.map((p, i) => p.alive ? i : -1).filter(i => i >= 0)
    const startHolder = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)]
    setHolder(startHolder)
    setPhase('playing')
    if (round > 1) { setHpComment(pick(HP_COMMENTS.tension)); setTension(t => Math.min(100, t + (round - 1) * 15)) }
    else setHpComment('Bomb activated! 💣')
    playFx('bomb_tick')
    const startTime = Date.now()
    if (hpTimerRef.current) clearInterval(hpTimerRef.current)
    hpTimerRef.current = setInterval(() => {
      if (!activeRef.current) { clearInterval(hpTimerRef.current!); return }
      const elapsed = (Date.now() - startTime) / 1000
      const pct = Math.min(1, elapsed / maxT)
      setBombTimer(elapsed)
      setFuse(1 - pct)
      if (elapsed >= maxT) {
        clearInterval(hpTimerRef.current!)
        hpTimerRef.current = null
        explodeBomb(ps, round)
      }
    }, 50)
    if (ps[startHolder].isAI) {
      setTimeout(() => { if (activeRef.current) aiTurn(ps, startHolder, round) }, 600 + Math.random() * 800)
    }
  }, [playFx, explodeBomb, aiTurn])

  const startGame = useCallback(() => {
    activeRef.current = true
    if (hpTimerRef.current) { clearInterval(hpTimerRef.current); hpTimerRef.current = null }
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null }
    puffHeldRef.current = false
    const aiCount = 3 + Math.floor(Math.random() * 4)
    const shuffled = [...HP_AI].sort(() => Math.random() - 0.5).slice(0, aiCount)
    const ps: Player[] = shuffled.map(a => ({ ...a, isYou: false, isAI: true, alive: true }))
    const youIdx = Math.floor(Math.random() * (ps.length + 1))
    ps.splice(youIdx, 0, { name: 'You', emoji: '😤', img: PLAYER_IMG, isYou: true, isAI: false, alive: true })
    setPlayersSync(ps)
    holderRef.current = 0
    roundRef.current = 1
    setCurrentHolder(-1)
    setHpRound(1)
    setMaxTimer(5 + Math.random() * 3)
    setBombTimer(0)
    setHpComment('')
    setExploded(null)
    setWinner(null)
    setEliminatedList([])
    setFuse(1)
    setTension(0)
    setPuffHeld(false)
    setPuffPower(0)
    setPassTarget(null)
    setIntroStage(0)
    setPassing(false)
    setExplosionParticles([])
    setConfetti([])
    setPhase('intro')
    playFx('crowd')
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(1) }, 500)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(2) }, 1500)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(3); playFx('whistle') }, 2800)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(4) }, 3500)
    setTimeout(() => { if (!activeRef.current) return; startRound(ps, 1) }, 4200)
  }, [playFx, startRound])

  const startPuff = useCallback(() => {
    const ps = playersRef.current
    const ph = holderRef.current
    if (phase !== 'playing' && !activeRef.current) return
    if (puffHeldRef.current) return
    const cur = ps[ph]
    if (!cur || !cur.isYou) return
    puffHeldRef.current = true
    setPuffHeld(true)
    setPuffPower(0)
    hpPuffStart.current = Date.now()
    playFx('charge')
    if (hpPuffRef.current) clearInterval(hpPuffRef.current)
    hpPuffRef.current = setInterval(() => {
      const e = (Date.now() - hpPuffStart.current) / 1000
      setPuffPower(Math.min(100, (e / 3.0) * 100))
    }, 50)
  }, [playFx, phase])

  const stopPuff = useCallback(() => {
    if (!puffHeldRef.current) return
    puffHeldRef.current = false
    setPuffHeld(false)
    if (hpPuffRef.current) { clearInterval(hpPuffRef.current); hpPuffRef.current = null }
    const holdTime = (Date.now() - hpPuffStart.current) / 1000
    let skip = 0
    if (holdTime >= 3) skip = 2
    else if (holdTime >= 1) skip = 1
    setPuffPower(0)
    passBomb(playersRef.current, holderRef.current, skip, roundRef.current)
  }, [passBomb])

  useEffect(() => {
    registerPuffHandlers(startPuff, stopPuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, startPuff, stopPuff])

  useEffect(() => {
    startGame()
    return () => {
      activeRef.current = false
      if (hpTimerRef.current) clearInterval(hpTimerRef.current)
      if (hpPuffRef.current) clearInterval(hpPuffRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const curP = players[currentHolder]
  const isYourTurn = curP && curP.isYou && phase === 'playing' && !passing
  const aliveCount = players.filter(p => p.alive).length
  const fuseColor = fuse > 0.6 ? C.green : fuse > 0.3 ? C.orange : C.red
  const pulseSpeed = fuse > 0.6 ? '2s' : fuse > 0.3 ? '0.8s' : '0.3s'
  const isExploding = phase === 'exploding'
  const circleR = 100

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: screenShake ? 'shake 0.4s ease' : 'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; if (isYourTurn && !puffHeld) startPuff() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; if (puffHeld) stopPuff() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); if (isYourTurn && !puffHeld) startPuff() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-back],[data-btn]')) return; e.preventDefault(); if (puffHeld) stopPuff() }}
    >
      {/* Dark fire background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0400 0%, #1a0800 20%, #0f0502 50%, #080200 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'radial-gradient(ellipse at 50% 100%, rgba(255,100,0,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,${isExploding ? 0.8 : 0.5}) 100%)`, pointerEvents: 'none', zIndex: 2, transition: 'all 0.5s' }} />
      {isExploding && <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', background: 'rgba(255,50,0,0.3)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {explosionParticles.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size, borderRadius: '50%', background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}`, animation: 'confettiFall 0.8s ease-out forwards', pointerEvents: 'none', zIndex: 200 }} />)}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.25)' : 'rgba(255,50,50,0.2)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { activeRef.current = false; if (hpTimerRef.current) clearInterval(hpTimerRef.current); if (hpPuffRef.current) clearInterval(hpPuffRef.current); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 380, width: '100%', padding: '50px 16px 20px', gap: 8, zIndex: 10, overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, color: C.orange, textShadow: `0 0 20px ${C.orange}40` }}>💣 HOT POTATO</div>
        <div style={{ fontSize: 9, color: C.text3 }}>Round {hpRound} · {aliveCount} alive · Timer: {fuse > 0 ? Math.max(0, maxTimer - bombTimer).toFixed(1) + 's' : 'BOOM!'}</div>

        {/* Tension meter */}
        <div style={{ width: '80%', maxWidth: 260, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ width: tension + '%', height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${C.orange},${C.red})`, transition: 'width 0.3s' }} />
        </div>

        {/* Intro sequence */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', padding: '30px 0', animation: 'fadeIn 0.4s ease' }}>
            {introStage >= 1 && <div style={{ fontSize: 40, marginBottom: 8, animation: 'hpBombPulse 1s infinite' }}>💣</div>}
            {introStage >= 2 && <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 6 }}>{players.length} Players Enter the Circle</div>}
            {introStage >= 3 && <div style={{ fontSize: 24, fontWeight: 900, color: C.red, animation: 'countPulse 0.5s infinite' }}>GET READY!</div>}
            {introStage >= 4 && <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>Pass the bomb... or BOOM! 💥</div>}
          </div>
        )}

        {/* Player circle */}
        {phase !== 'intro' && (
          <div style={{ position: 'relative', width: circleR * 2 + 60, height: circleR * 2 + 60, flexShrink: 0, marginBottom: 8 }}>
            {/* Center bomb */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: isExploding ? 60 : 36, animation: isExploding ? 'hpExplosion 0.6s ease forwards' : `hpBombPulse ${pulseSpeed} infinite`, filter: isExploding ? 'brightness(2)' : 'none', zIndex: 20, transition: 'font-size 0.2s' }}>
              {isExploding ? '💥' : '💣'}
            </div>
            {/* Fuse visual */}
            {!isExploding && phase === 'playing' && (
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,24px)', width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', zIndex: 21 }}>
                <div style={{ width: (fuse * 100) + '%', height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${fuseColor},${C.red})`, transition: 'width 0.1s', boxShadow: `0 0 8px ${fuseColor}` }} />
              </div>
            )}
            {/* Players */}
            {players.map((p, i) => {
              const angle = (i / players.length) * Math.PI * 2 - Math.PI / 2
              const px = Math.cos(angle) * circleR + circleR + 30
              const py = Math.sin(angle) * circleR + circleR + 30
              const isHolder = i === currentHolder && !isExploding
              const isTarget = i === passTarget
              const isElim = !p.alive
              const isVictim = isExploding && i === currentHolder
              return (
                <div key={i} style={{ position: 'absolute', left: px - 24, top: py - 24, width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: isElim ? 0.3 : 1, filter: isElim ? 'grayscale(1)' : 'none', transform: isHolder ? 'scale(1.2)' : isTarget ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.35s', zIndex: isHolder ? 15 : 10 }}>
                  {isHolder && <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: `radial-gradient(circle, ${C.red}20, transparent)`, animation: `hpBombPulse ${pulseSpeed} infinite`, pointerEvents: 'none' }} />}
                  <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', border: `2px solid ${isVictim ? C.red : isHolder ? (p.isYou ? C.cyan : C.orange) : isElim ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}`, boxShadow: isHolder ? `0 0 15px ${p.isYou ? C.cyan : C.orange}50` : 'none', background: 'rgba(0,0,0,0.3)' }}>
                    {isElim
                      ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💀</div>
                      : <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    }
                  </div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: isHolder ? (p.isYou ? C.cyan : C.orange) : isElim ? C.text3 : C.text, textAlign: 'center', maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.isYou ? 'YOU' : p.name}</div>
                  {isHolder && !isExploding && <div style={{ fontSize: 12, animation: `hpBombPulse ${pulseSpeed} infinite` }}>💣</div>}
                  {isVictim && <div style={{ fontSize: 16, animation: 'hpExplosion 0.6s ease forwards' }}>💥</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* Commentary */}
        {hpComment && (
          <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 300, textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{hpComment}</div>
          </div>
        )}

        {/* Puff power meter */}
        {puffHeld && (
          <div style={{ width: '80%', maxWidth: 260, marginTop: 4 }}>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: puffPower + '%', height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${C.cyan},${puffPower > 66 ? C.orange : C.blue})`, transition: 'width 0.05s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 7, color: C.cyan }}>Quick pass</span>
              <span style={{ fontSize: 7, color: C.gold }}>Skip 1</span>
              <span style={{ fontSize: 7, color: C.orange }}>Skip 2!</span>
            </div>
          </div>
        )}

        {/* HOLD TO PASS button */}
        {isYourTurn && !puffHeld && (
          <div style={{ padding: '18px 0', borderRadius: 16, cursor: 'pointer', textAlign: 'center', width: '100%', maxWidth: 300, background: `linear-gradient(135deg,${C.orange}20,${C.red}10)`, border: `2px solid ${C.orange}30`, animation: `hpBombPulse ${pulseSpeed} infinite`, userSelect: 'none', WebkitUserSelect: 'none', marginTop: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: 2 }}>💣 HOLD TO PASS!</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>Quick tap = next · Hold = skip players!</div>
          </div>
        )}

        {/* Waiting for AI */}
        {phase === 'playing' && curP && curP.isAI && !passing && (
          <div style={{ textAlign: 'center', marginTop: 8, animation: 'pulse 0.6s infinite' }}>
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{curP.name} is holding the bomb... 💣🤖</div>
          </div>
        )}

        {/* Passing animation */}
        {passing && (
          <div style={{ textAlign: 'center', marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontSize: 14, color: C.gold, fontWeight: 700 }}>💣 Passing... ➡️</div>
          </div>
        )}

        {/* Exploding overlay */}
        {isExploding && exploded && (
          <div style={{ textAlign: 'center', marginTop: 12, animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>💥💀💥</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>{exploded.isYou ? 'YOU BLEW UP!' : `${exploded.name} EXPLODED!`}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{aliveCount} players remain</div>
          </div>
        )}

        {/* Next round */}
        {phase === 'next_round' && (
          <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.gold }}>Round {hpRound + 1} Coming...</div>
            <div style={{ fontSize: 10, color: C.text2 }}>Timer gets SHORTER! 😰</div>
          </div>
        )}

        {/* Result screen */}
        {phase === 'result' && (() => {
          const hpWon = winner?.isYou ?? false
          const hpBaseCoins = hpWon ? 60 : 10
          return (
            <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{hpWon ? '👑' : '💀'}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: hpWon ? C.green : C.red }}>{hpWon ? 'SOLE SURVIVOR!' : winner ? `${winner.name} WINS!` : 'Game Over!'}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>+{hpBaseCoins} coins!</div>
              <div style={{ marginTop: 12, textAlign: 'left', width: '100%', maxWidth: 260 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>ELIMINATION ORDER</div>
                {eliminatedList.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <span style={{ fontSize: 8, color: C.red }}>💀 #{i + 1}</span>
                    <span style={{ fontSize: 9, color: C.text2 }}>{p.isYou ? 'You' : p.name}</span>
                  </div>
                ))}
                {winner && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 8, color: C.gold }}>👑 Winner</span>
                  <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{winner.isYou ? 'You' : winner.name}</span>
                </div>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div data-btn="true" onClick={() => startGame()} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.orange}15`, border: `1px solid ${C.orange}30`, fontSize: 13, fontWeight: 800, color: C.orange }}>🔄 Play Again</div>
                <div data-btn="true" onClick={() => navigate('/arcade')} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
