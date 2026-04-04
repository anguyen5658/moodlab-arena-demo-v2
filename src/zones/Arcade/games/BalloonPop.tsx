import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PLAYER_IMG = 'https://api.dicebear.com/9.x/adventurer/svg?seed=Steve420&backgroundColor=transparent&skinColor=f2d3b1'

const BP_AI_PLAYERS = [
  { name:"CautiousCarl",  emoji:"🐢", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CautiousCarl&backgroundColor=transparent",  strategy:"cautious" },
  { name:"YOLO Yolanda",  emoji:"🔥", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=YoloYolanda&backgroundColor=transparent",         strategy:"reckless" },
  { name:"RandomRick",    emoji:"🎲", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=RandomRick&backgroundColor=transparent",      strategy:"random"   },
  { name:"SmoothSam",     emoji:"😎", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=SmoothSam&backgroundColor=transparent",           strategy:"cautious" },
  { name:"MadMax420",     emoji:"💀", img:"https://api.dicebear.com/9.x/bottts-neutral/svg?seed=MadMax420&backgroundColor=transparent",       strategy:"reckless" },
  { name:"NervousNate",   emoji:"😰", img:"https://api.dicebear.com/9.x/adventurer/svg?seed=NervousNate&backgroundColor=transparent",         strategy:"cautious" },
]

const BP_COMMENTS = {
  small:   ["Baby puff 🍼","My grandma hits harder 👵","Whisper puff 🤫","Did you even puff?? 💀","Coward level: MAX 🐔"],
  big:     ["MADMAN! 💀","FULL SEND! 🫁","Balloon said YIKES 😳","LUNGS OF STEEL 💪","Risky business! 🔥"],
  blinker: ["BLINKER PUFF! Trying to end this game in one shot 💀","ABSOLUTE PSYCHOPATH 🫁💥","INSANE RISK!! ARE YOU OKAY?? 😱"],
  pop:     ["BOOOOM! 💥🎈💀","THE BALLOON HAS LEFT THE CHAT 💀","R.I.P. BALLOON 🪦","POP! 💥"],
  shaking: ["IT COULD GO ANY MOMENT! 😱","DANGER ZONE! 🚨","One more puff and it's OVER 😰"],
}

type BpPlayer = { name: string; emoji: string; img: string; isYou: boolean; isAI: boolean; alive: boolean; puffs: number; totalAir: number; strategy?: string }
type BpPhase = 'intro' | 'playing' | 'ai_turn' | 'popped' | 'result'

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const getBalloonColor = (pct: number) => pct < 30 ? '#4CAF50' : pct < 50 ? '#8BC34A' : pct < 65 ? '#FFEB3B' : pct < 75 ? '#FF9800' : pct < 85 ? '#FF5722' : '#F44336'

const spawnConfetti = (count: number, colors: string[]) =>
  Array.from({ length: count }, (_, i) => ({ id: Date.now() + i, x: Math.random() * 100, y: Math.random() * 40, size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 360 }))

export default function BalloonPop() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<BpPhase>('intro')
  const [players, setPlayers] = useState<BpPlayer[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [airLevel, setAirLevel] = useState(0)
  const [popThreshold, setPopThreshold] = useState(100)
  const [puffAmount, setPuffAmount] = useState(0)
  const [charging, setCharging] = useState(false)
  const [comment, setComment] = useState('')
  const [bpRound, setBpRound] = useState(0)
  const [loser, setLoser] = useState<BpPlayer | null>(null)
  const [shaking, setShaking] = useState(false)
  const [popping, setPopping] = useState(false)
  const [balloonColor, setBalloonColor] = useState('#4CAF50')
  const [history, setHistory] = useState<{ playerIdx: number; amount: number; totalAfter: number }[]>([])
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rot: number }[]>([])
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const puffStart = useRef(0)
  const chargingRef = useRef(false)
  const phaseRef = useRef<BpPhase>('intro')
  const playersRef = useRef<BpPlayer[]>([])
  const currentTurnRef = useRef(0)
  const airLevelRef = useRef(0)
  const thresholdRef = useRef(100)

  const triggerFlash = (type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }
  const triggerShake = () => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }

  const setPlayersSync = (p: BpPlayer[]) => { playersRef.current = p; setPlayers(p) }
  const setPhaseSync = (p: BpPhase) => { phaseRef.current = p; setPhase(p) }
  const setAirSync = (a: number) => { airLevelRef.current = a; setAirLevel(a) }
  const setTurnSync = (t: number) => { currentTurnRef.current = t; setCurrentTurn(t) }

  const processPuff = useCallback((pidx: number, amount: number, ps: BpPlayer[], air: number, threshold: number) => {
    const ca = Math.max(5, Math.min(30, amount))
    const newAir = air + ca
    const popped = newAir >= threshold
    const up = ps.map((p, i) => i === pidx ? { ...p, puffs: p.puffs + 1, totalAir: p.totalAir + ca } : p)
    const dAir = Math.min(newAir, threshold)
    const color = getBalloonColor((dAir / threshold) * 100)
    const nearPop = dAir > threshold * 0.7

    setPlayersSync(up)
    setAirSync(newAir)
    airLevelRef.current = newAir
    setBalloonColor(color)
    setHistory(h => [...h, { playerIdx: pidx, amount: ca, totalAfter: newAir }])
    setBpRound(r => r + 1)

    if (ca >= 20) setComment(pick(BP_COMMENTS.blinker))
    else if (ca <= 7) setComment(pick(BP_COMMENTS.small))
    else if (ca >= 15) setComment(pick(BP_COMMENTS.big))
    else setComment('Solid puff, playing smart 🧠')

    if (nearPop && !popped) { setShaking(true); if (dAir > threshold * 0.85) setTimeout(() => setComment(pick(BP_COMMENTS.shaking)), 600) }

    if (popped) {
      setPopping(true)
      setShaking(false)
      setLoser(up[pidx])
      setPhaseSync('popped')
      setComment(pick(BP_COMMENTS.pop))
      playFx('balloon_pop')
      playFx('lose')
      triggerShake()
      triggerFlash('miss')
      playFx('crowd')
      setTimeout(() => {
        setPopping(false)
        setPhaseSync('result')
        if (!up[pidx].isYou) {
          setConfetti(spawnConfetti(40, [C.pink, C.gold, C.cyan]))
          setTimeout(() => setConfetti([]), 2000)
          playFx('win')
          triggerFlash('goal')
        } else {
          playFx('laugh')
        }
        const bpWon = !up[pidx].isYou
        awardGame({ won: bpWon, baseCoins: bpWon ? 80 : 10, baseXP: bpWon ? 20 : 8 })
      }, 2000)
      return
    }

    const next = (pidx + 1) % up.length
    setTurnSync(next)
    if (up[next].isAI) {
      setPhaseSync('ai_turn')
      setTimeout(() => doAITurn(up, next, newAir, threshold), 1200 + Math.random() * 1500)
    } else {
      setPhaseSync('playing')
      setComment('YOUR TURN! Hold to puff 💨')
      playFx('select')
    }
  }, [playFx, awardGame])

  const doAITurn = useCallback((ps: BpPlayer[], idx: number, air: number, threshold: number) => {
    const strat = ps[idx].strategy
    const amt = strat === 'cautious' ? 5 + Math.floor(Math.random() * 4) : strat === 'reckless' ? 12 + Math.floor(Math.random() * 11) : 5 + Math.floor(Math.random() * 14)
    setPhaseSync('ai_turn')
    playFx('charge')
    setCharging(true)
    chargingRef.current = true
    setPuffAmount(0)
    const dur = 400 + (amt / 25) * 1800
    const st = Date.now()
    const iv = setInterval(() => setPuffAmount(Math.min(100, (Date.now() - st) / dur * 100)), 50)
    setTimeout(() => {
      clearInterval(iv)
      setCharging(false)
      chargingRef.current = false
      setPuffAmount(0)
      playFx('kick')
      processPuff(idx, amt, ps, air, threshold)
    }, dur)
  }, [playFx, processPuff])

  const startCharge = useCallback(() => {
    if (phaseRef.current !== 'playing' || chargingRef.current) return
    const cur = playersRef.current[currentTurnRef.current]
    if (!cur || cur.isAI) return
    chargingRef.current = true
    setCharging(true)
    setPuffAmount(0)
    puffStart.current = Date.now()
    playFx('balloon_inflate')
    if (chargeInterval.current) clearInterval(chargeInterval.current)
    chargeInterval.current = setInterval(() => {
      const e = (Date.now() - puffStart.current) / 1000
      setPuffAmount(Math.min(100, (e / 4.5) * 100))
      if (e >= 5.0) stopCharge()
    }, 50)
  }, [playFx])

  const stopCharge = useCallback(() => {
    if (!chargingRef.current) return
    chargingRef.current = false
    setCharging(false)
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    const e = (Date.now() - puffStart.current) / 1000
    let amt: number
    if (e < 1.0) amt = 5 + Math.round(Math.random() * 3)
    else if (e < 2.0) amt = 8 + Math.round(Math.random() * 6)
    else if (e < 4.0) amt = 14 + Math.round(Math.random() * 6)
    else amt = 20 + Math.round(Math.random() * 10)
    playFx('kick')
    setPuffAmount(0)
    processPuff(currentTurnRef.current, amt, playersRef.current, airLevelRef.current, thresholdRef.current)
  }, [playFx, processPuff])

  useEffect(() => {
    registerPuffHandlers(startCharge, stopCharge)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, startCharge, stopCharge])

  const startGame = useCallback(() => {
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
    chargingRef.current = false
    const aiCount = 3 + Math.floor(Math.random() * 3)
    const shuffled = [...BP_AI_PLAYERS].sort(() => Math.random() - 0.5)
    const aiP = shuffled.slice(0, aiCount).map(a => ({ ...a, isYou: false, isAI: true, alive: true, puffs: 0, totalAir: 0 }))
    const youIdx = Math.floor(Math.random() * (aiP.length + 1))
    const ps: BpPlayer[] = [...aiP]
    ps.splice(youIdx, 0, { name: 'You', emoji: '😤', img: PLAYER_IMG, isYou: true, isAI: false, alive: true, puffs: 0, totalAir: 0, strategy: 'human' })
    const threshold = 80 + Math.floor(Math.random() * 41)

    setPlayersSync(ps)
    setTurnSync(0)
    setAirSync(0)
    thresholdRef.current = threshold
    setPopThreshold(threshold)
    setPuffAmount(0)
    setCharging(false)
    setComment('')
    setBpRound(0)
    setLoser(null)
    setHistory([])
    setShaking(false)
    setPopping(false)
    setBalloonColor('#4CAF50')
    setConfetti([])
    setPhaseSync('intro')
    playFx('crowd')
    setTimeout(() => {
      setPhaseSync('playing')
      setComment('Let the game begin! 🎈')
      playFx('whistle')
      if (ps[0].isAI) setTimeout(() => doAITurn(ps, 0, 0, threshold), 1200)
    }, 2000)
  }, [playFx, doAITurn])

  useEffect(() => {
    startGame()
    return () => { if (chargeInterval.current) clearInterval(chargeInterval.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const curP = players[currentTurn]
  const isYourTurn = curP && curP.isYou && phase === 'playing'
  const airPct = Math.min(100, (airLevel / popThreshold) * 100)
  const balloonScale = 0.4 + (airPct / 100) * 1.6
  const nearPop = airPct > 70
  const dangerZone = airPct > 85
  const puffTier = puffAmount < 22 ? 'TAP 😐' : puffAmount < 44 ? 'SHORT 😤' : puffAmount < 89 ? 'LONG 🌬️' : 'BLINKER 🫁🔥'

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflow: 'hidden', animation: screenShake ? 'shake 0.4s ease' : 'none' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: dangerZone
        ? 'linear-gradient(180deg, #1a0000 0%, #3d0a0a 30%, #8b2020 55%, #2a0808 100%)'
        : nearPop ? 'linear-gradient(180deg, #0a0520 0%, #3d1a5e 30%, #a04070 55%, #2a1508 100%)'
        : 'linear-gradient(180deg, #0a0525 0%, #2d1b6e 32%, #8060d0 62%, #302060 92%, #150a30 100%)',
        transition: 'background 1.5s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,${dangerZone ? 0.7 : nearPop ? 0.5 : 0.35}) 100%)`, transition: 'all 1s ease', pointerEvents: 'none', zIndex: 2 }} />
      {dangerZone && phase !== 'popped' && phase !== 'result' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,0,0,0.08)', animation: 'bpDangerPulse 0.6s ease-in-out infinite', pointerEvents: 'none', zIndex: 3 }} />}
      {screenFlash && <div style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none', opacity: 0, background: screenFlash === 'goal' ? 'rgba(0,255,100,0.3)' : 'rgba(255,30,30,0.35)', animation: 'flashOverlay 0.4s ease forwards' }} />}
      {confetti.map(p => <div key={p.id} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`, zIndex: 210, pointerEvents: 'none', animation: 'confettiFall 1.5s ease-out forwards' }} />)}

      <div data-back="true" onClick={() => { if (chargeInterval.current) clearInterval(chargeInterval.current); navigate('/arcade') }} style={{ position: 'absolute', top: 12, left: 12, zIndex: 300, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: C.text2, cursor: 'pointer' }}>← Back</div>

      {/* Intro overlay */}
      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,18,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎈</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, background: `linear-gradient(135deg, ${C.pink}, ${C.gold}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>BALLOON POP</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 8, letterSpacing: 3, fontWeight: 700 }}>DON'T POP IT!</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {players.map((p, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', border: `2px solid ${p.isYou ? C.cyan : C.pink}40`, background: `${p.isYou ? C.cyan : C.pink}10` }}>
                <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: C.text3, animation: 'pulse 1s infinite' }}>{players.length} players · Getting ready...</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: '48px 16px 20px', zIndex: 10, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 6, zIndex: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 4, background: dangerZone ? `linear-gradient(135deg, ${C.red}, ${C.orange})` : `linear-gradient(135deg, ${C.pink}, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎈 BALLOON POP</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 2, letterSpacing: 1 }}>Round {bpRound + 1} · {players.length} players{nearPop ? ' · ⚠️ DANGER' : ''}</div>
        </div>

        {/* Player ring */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8, zIndex: 20 }}>
          {players.map((p, i) => {
            const isCur = i === currentTurn && phase !== 'popped' && phase !== 'result'
            const isL = loser && loser.name === p.name
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: isL ? 0.35 : 1, transform: isCur ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.4s' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', position: 'relative', border: `2px solid ${isCur ? (p.isYou ? C.cyan : C.orange) : isL ? C.red : 'rgba(255,255,255,0.1)'}`, boxShadow: isCur ? `0 0 16px ${p.isYou ? C.cyan : C.orange}40` : 'none' }}>
                  <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  {isL && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', fontSize: 20 }}>💀</div>}
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, color: isCur ? (p.isYou ? C.cyan : C.orange) : C.text3 }}>{p.isYou ? 'YOU' : p.name.slice(0, 8)}</div>
              </div>
            )
          })}
        </div>

        {/* Balloon area */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 220, height: 220, marginBottom: 4 }}>
          {phase !== 'popped' && phase !== 'result' && (
            <div style={{ position: 'absolute', width: 80 + airPct * 1.2, height: 80 + airPct * 1.2, borderRadius: '50%', background: `radial-gradient(circle, ${balloonColor}15, transparent 70%)`, border: `1px solid ${balloonColor}12`, animation: dangerZone ? 'bpDangerPulse 0.5s ease-in-out infinite' : 'pulse 3s infinite', pointerEvents: 'none' }} />
          )}
          {phase !== 'popped' && phase !== 'result' && (
            <div style={{ position: 'absolute', top: 8, right: 20, padding: '3px 8px', borderRadius: 10, background: `${balloonColor}15`, border: `1px solid ${balloonColor}25`, zIndex: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: balloonColor }}>{Math.round(airPct)}%</span>
            </div>
          )}
          {phase !== 'popped' && phase !== 'result' && (
            <div style={{ fontSize: 60, transform: `scale(${balloonScale})`, transition: charging ? 'transform 0.1s' : 'transform 0.5s', filter: `drop-shadow(0 0 ${10 + airPct * 0.3}px ${balloonColor}60)`, animation: shaking ? (dangerZone ? 'bpWobbleFast 0.15s infinite' : 'bpWobble 0.3s infinite') : charging ? 'bpInflate 0.3s infinite' : 'gentleFloat 3s infinite', userSelect: 'none' }}>🎈</div>
          )}
          {popping && <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 80, animation: 'bpExplode 0.6s ease-out forwards' }}>💥</div></div>}
          {phase === 'result' && <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}><div style={{ fontSize: 60, marginBottom: 8 }}>{loser && loser.isYou ? '💀' : '🎉'}</div><div style={{ fontSize: 18, fontWeight: 900, color: loser && loser.isYou ? C.red : C.green }}>{loser && loser.isYou ? 'YOU POPPED IT!' : (loser ? loser.name : '???') + ' POPPED IT!'}</div></div>}
        </div>

        {/* Commentary */}
        {comment && (
          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 14, background: 'rgba(6,16,30,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${dangerZone ? C.red : C.pink}18`, maxWidth: 320, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, fontStyle: 'italic' }}>"{comment}"</div>
          </div>
        )}

        {/* Audience reaction */}
        {phase !== 'intro' && phase !== 'result' && (
          <div style={{ display: 'flex', gap: 3, marginTop: 6, opacity: 0.7 }}>
            {['😮', '😬', '🫣', '🤭', '😱'].map((e, i) => (
              <div key={i} style={{ fontSize: nearPop ? (dangerZone ? 14 : 12) : 10, animation: dangerZone && i > 2 ? `bpWobble ${0.3 + i * 0.1}s infinite` : 'none', transition: 'font-size 0.3s', opacity: airPct > i * 20 ? 1 : 0.3 }}>{e}</div>
            ))}
            <div style={{ fontSize: 8, color: C.text3, alignSelf: 'center', marginLeft: 4 }}>{dangerZone ? 'CROWD PANICKING!' : nearPop ? 'Crowd nervous...' : 'Crowd watching...'}</div>
          </div>
        )}

        {/* Your turn puff button */}
        {isYourTurn && (
          <div style={{ width: '100%', marginTop: 8 }}>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: puffAmount + '%', height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${C.cyan},${C.pink})`, transition: 'width 0.05s' }} />
            </div>
            <div
              onMouseDown={startCharge} onMouseUp={stopCharge} onMouseLeave={() => { if (chargingRef.current) stopCharge() }}
              onTouchStart={(e) => { e.preventDefault(); startCharge() }} onTouchEnd={stopCharge}
              style={{ padding: '14px 0', borderRadius: 16, cursor: 'pointer', textAlign: 'center', userSelect: 'none', background: charging ? `linear-gradient(135deg,${C.orange}30,${C.red}20)` : `linear-gradient(135deg,${C.cyan}15,${C.pink}10)`, border: `2px solid ${charging ? C.orange : C.cyan}30`, transform: charging ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.2s' }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, color: charging ? C.orange : C.cyan }}>{charging ? '🎈 INFLATING...' : 'HOLD TO INFLATE 🎈'}</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 3 }}>{charging ? `Tier: ${puffTier} · Release to add air!` : 'Min 5% · Hold longer = more air'}</div>
            </div>
          </div>
        )}

        {/* AI turn indicator */}
        {phase === 'ai_turn' && curP && charging && (
          <div style={{ width: '100%', marginTop: 8 }}>
            <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ width: puffAmount + '%', height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${C.orange},${C.red})`, transition: 'width 0.05s linear' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 8, color: C.orange, marginTop: 4, animation: 'pulse 0.5s infinite' }}>{curP.name} is puffing... 💨</div>
          </div>
        )}

        {/* Result actions */}
        {phase === 'result' && (() => {
          const bpWon = loser && !loser.isYou
          const bpBaseCoins = bpWon ? 80 : 10
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, width: '100%', maxWidth: 260, animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>GAME REWARD</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: C.text }}>Earned</span>
                  <span style={{ color: C.gold }}>+{bpBaseCoins} 🪙</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, animation: 'fadeIn 0.5s ease' }}>
                <div data-btn="true" onClick={() => startGame()} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.pink}15`, border: `1px solid ${C.pink}30`, fontSize: 13, fontWeight: 800, color: C.pink }}>🔄 Play Again</div>
                <div data-btn="true" onClick={() => navigate('/arcade')} style={{ padding: '10px 24px', borderRadius: 12, cursor: 'pointer', background: `${C.text3}10`, border: `1px solid ${C.text3}20`, fontSize: 13, fontWeight: 800, color: C.text3 }}>Done</div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
