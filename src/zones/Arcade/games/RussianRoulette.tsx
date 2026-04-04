import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const RR_AI = [
  {name:"Lucky Luke",emoji:"🤠",personality:"cocky"},
  {name:"Nervous Nick",emoji:"😰",personality:"nervous"},
  {name:"Bold Betty",emoji:"💪",personality:"brave"},
  {name:"Chill Chad",emoji:"😎",personality:"chill"},
  {name:"Sweaty Steve",emoji:"😓",personality:"scared"},
]
const RR_COMMENTS = {
  spin:["The revolver SPINS... 🔄","Round and round it goes...","Where it stops, nobody knows! 🎲","Fate is loading... 💀"],
  click:["*CLICK*... SAFE! 😮‍💨","Empty chamber! You live! ✨","The luck continues... 🍀","Phew! Not this time! 😅"],
  bang:["BANG! 💥🔫","IT FIRED! 💀","The chamber was LOADED! 💥","Game over for this one... 🪦"],
  dodge:["BLINKER DODGE! Puffed so hard the bullet got scared 💀","Your lungs are your guardian angel 👼💨","Smoke screen activated! 🫁💨🫁"],
  aiPuff:["AI pulls trigger like it's checking email 📧","Nervous Nick's hands are shaking...","Bold Betty doesn't even flinch 💪"],
  yourTurn:["YOUR TURN... Hold to puff for dodge chance 💨","It's you... puff long, puff hard 😰","The revolver is pointing at YOU 🔫"],
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const rrGetDodgeChance = (c: number) => c<10?0:c<25?3:c<50?8:c<80?15:30
const rrGetPuffTier = (c: number) => c<10?{name:'Tap',color:C.text3,emoji:'😐'}:c<25?{name:'Short',color:C.text2,emoji:'😤'}:c<50?{name:'Good',color:C.cyan,emoji:'💨'}:c<80?{name:'Long',color:C.gold,emoji:'🌬️'}:{name:'BLINKER',color:C.red,emoji:'🫁🔥'}

interface RRPlayer { name:string; emoji:string; isYou:boolean; isAI:boolean; alive:boolean; dodges:number; survived:number }

export default function RussianRoulette() {
  const navigate = useNavigate()
  const { playFx, awardGame, registerPuffHandlers } = useArena()

  const rrPuffStart = useRef(0)
  const rrPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeRef = useRef(false)

  const [phase, setPhase] = useState<string|null>(null)
  const [players, setPlayers] = useState<RRPlayer[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [bullet, setBullet] = useState(0)
  const [currentChamber, setCurrentChamber] = useState(0)
  const [comment, setComment] = useState('')
  const [eliminated, setEliminated] = useState<RRPlayer|null>(null)
  const [rrRound, setRrRound] = useState(0)
  const [spinAngle, setSpinAngle] = useState(0)
  const [puffCharge, setPuffCharge] = useState(0)
  const [dodgeResult, setDodgeResult] = useState<string|null>(null)
  const [introStage, setIntroStage] = useState(0)
  const [eliminatedList, setEliminatedList] = useState<RRPlayer[]>([])
  const [winner, setWinner] = useState<RRPlayer|null>(null)
  const [chambers, setChambers] = useState([false,false,false,false,false,false])
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<string|null>(null)

  const triggerShake = useCallback(() => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }, [])
  const triggerFlash = useCallback((type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }, [])

  // Refs for BLE handlers
  const phaseRef = useRef(phase)
  const playersRef = useRef(players)
  const currentTurnRef = useRef(currentTurn)
  const bulletRef = useRef(bullet)
  const currentChamberRef = useRef(currentChamber)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { currentTurnRef.current = currentTurn }, [currentTurn])
  useEffect(() => { bulletRef.current = bullet }, [bullet])
  useEffect(() => { currentChamberRef.current = currentChamber }, [currentChamber])

  const rrFindNextAlive = (ps: RRPlayer[], fromIdx: number) => {
    for (let i = 1; i <= ps.length; i++) {
      const ni = (fromIdx + i) % ps.length
      if (ps[ni].alive) return ni
    }
    return null
  }

  // Forward-declare resolveTurn to allow mutual recursion
  const resolveTurnRef = useRef<(ps: RRPlayer[], idx: number, bul: number, chamberPos: number, dodgeCharge: number) => void>(() => {})

  const startTurn = useCallback((ps: RRPlayer[], idx: number, bul: number, chamberPos: number) => {
    const p = ps[idx]
    if (!p.alive) {
      const next = rrFindNextAlive(ps, idx)
      if (next === null) return
      setCurrentTurn(next); currentTurnRef.current = next
      setTimeout(() => startTurn(ps, next, bul, chamberPos), 200)
      return
    }
    setCurrentTurn(idx); currentTurnRef.current = idx
    setPuffCharge(0); setDodgeResult(null)
    if (p.isAI) {
      setComment(pick(RR_COMMENTS.aiPuff)); playFx('select')
      setTimeout(() => {
        setPhase('pulling'); phaseRef.current = 'pulling'
        setTimeout(() => resolveTurnRef.current(ps, idx, bul, chamberPos, Math.random() * 60), 800)
      }, 1200 + Math.random() * 800)
    } else {
      setComment(pick(RR_COMMENTS.yourTurn))
      setPhase('player_turn'); phaseRef.current = 'player_turn'
      playFx('select')
    }
  }, [playFx])

  const resolveTurn = useCallback((ps: RRPlayer[], idx: number, bul: number, chamberPos: number, dodgeCharge: number) => {
    const newChamber = (chamberPos + 1) % 6
    const isLoaded = newChamber === bul
    setCurrentChamber(newChamber); currentChamberRef.current = newChamber
    setRrRound(r => r+1)
    const dodgePct = rrGetDodgeChance(dodgeCharge)
    const dodged = isLoaded && Math.random() * 100 < dodgePct
    setChambers(ch => { const c=[...ch]; c[newChamber]=true; return c })
    playFx('gun_click')
    if (isLoaded && !dodged) {
      setPhase('bang'); phaseRef.current = 'bang'
      setComment(pick(RR_COMMENTS.bang)); setEliminated(ps[idx])
      triggerShake(); triggerFlash('miss'); playFx('gun_bang')
      const up = ps.map((p,i) => i===idx ? {...p,alive:false} : p)
      setPlayers(up); playersRef.current = up
      setEliminatedList(el => [...el, ps[idx]])
      setTimeout(() => {
        const aliveCount = up.filter(p => p.alive).length
        if (aliveCount <= 1) {
          const win = up.find(p => p.alive) || null
          setWinner(win); setPhase('winner'); phaseRef.current = 'winner'
          if (win?.isYou) { playFx('win'); playFx('crowd'); triggerFlash('goal') }
          else playFx('crowd')
        } else {
          const nb = Math.floor(Math.random() * 6)
          setBullet(nb); bulletRef.current = nb
          setCurrentChamber(0); currentChamberRef.current = 0
          setChambers([false,false,false,false,false,false])
          setPhase('spinning'); phaseRef.current = 'spinning'
          setSpinAngle(a => a + 720 + Math.random() * 720)
          setComment('Respinning... ' + aliveCount + ' remain 😰')
          playFx('revolver_spin')
          setTimeout(() => {
            const next = rrFindNextAlive(up, idx)
            if (next !== null) { setPhase('player_turn'); phaseRef.current = 'player_turn'; startTurn(up, next, nb, 0) }
          }, 2200)
        }
      }, 2500)
    } else if (isLoaded && dodged) {
      setDodgeResult('dodged'); setPhase('click'); phaseRef.current = 'click'
      setComment(pick(RR_COMMENTS.dodge)); playFx('win'); triggerFlash('save')
      const up = ps.map((p,i) => i===idx ? {...p,dodges:p.dodges+1,survived:p.survived+1} : p)
      setPlayers(up); playersRef.current = up
      setTimeout(() => {
        const nb = Math.floor(Math.random() * 6)
        setBullet(nb); bulletRef.current = nb
        setCurrentChamber(0); currentChamberRef.current = 0
        setChambers([false,false,false,false,false,false])
        setPhase('spinning'); phaseRef.current = 'spinning'
        setSpinAngle(a => a + 720 + Math.random() * 720)
        playFx('revolver_spin')
        setTimeout(() => {
          const next = rrFindNextAlive(up, idx)
          if (next !== null) { setPhase('player_turn'); phaseRef.current = 'player_turn'; startTurn(up, next, nb, 0) }
        }, 2200)
      }, 2000)
    } else {
      setPhase('click'); phaseRef.current = 'click'
      setComment(pick(RR_COMMENTS.click)); playFx('select')
      const up = ps.map((p,i) => i===idx ? {...p,survived:p.survived+1} : p)
      setPlayers(up); playersRef.current = up
      setTimeout(() => {
        const next = rrFindNextAlive(up, idx)
        if (next !== null) { setPhase('player_turn'); phaseRef.current = 'player_turn'; startTurn(up, next, bul, newChamber) }
      }, 1800)
    }
  }, [playFx, triggerShake, triggerFlash, startTurn])

  useEffect(() => { resolveTurnRef.current = resolveTurn }, [resolveTurn])

  const rrStopPuff = useCallback(() => {
    if (phaseRef.current !== 'puffing') return
    if (rrPuffInterval.current) { clearInterval(rrPuffInterval.current); rrPuffInterval.current = null }
    const charge = Math.min(100, ((Date.now() - rrPuffStart.current) / 5000) * 100)
    setPuffCharge(charge); setPhase('pulling'); phaseRef.current = 'pulling'
    const tier = rrGetPuffTier(charge)
    setComment(tier.name + ' puff! ' + tier.emoji + ' (' + rrGetDodgeChance(charge) + '% dodge)')
    if (charge >= 80) playFx('laugh')
    setTimeout(() => resolveTurnRef.current(playersRef.current, currentTurnRef.current, bulletRef.current, currentChamberRef.current, charge), 600)
  }, [playFx])

  const rrStartPuff = useCallback(() => {
    if (phaseRef.current !== 'player_turn') return
    const cur = playersRef.current[currentTurnRef.current]
    if (!cur || cur.isAI) return
    setPhase('puffing'); phaseRef.current = 'puffing'
    setPuffCharge(0); rrPuffStart.current = Date.now(); playFx('charge')
    rrPuffInterval.current = setInterval(() => {
      const e = (Date.now() - rrPuffStart.current) / 1000
      setPuffCharge(Math.min(100, (e / 5.0) * 100))
      if (e >= 5.5) rrStopPuff()
    }, 50)
  }, [playFx, rrStopPuff])

  const startGame = useCallback(() => {
    const aiCount = 3 + Math.floor(Math.random() * 3)
    const shuffled = [...RR_AI].sort(() => Math.random() - 0.5).slice(0, aiCount)
    const ps: RRPlayer[] = shuffled.map(a => ({...a, isYou:false, isAI:true, alive:true, dodges:0, survived:0}))
    const youIdx = Math.floor(Math.random() * (ps.length + 1))
    ps.splice(youIdx, 0, {name:'You', emoji:'😤', isYou:true, isAI:false, alive:true, dodges:0, survived:0})
    const bul = Math.floor(Math.random() * 6)
    setPlayers(ps); playersRef.current = ps
    setCurrentTurn(0); currentTurnRef.current = 0
    setBullet(bul); bulletRef.current = bul
    setCurrentChamber(0); currentChamberRef.current = 0
    setComment(''); setEliminated(null); setRrRound(0); setSpinAngle(0)
    setPuffCharge(0); setDodgeResult(null); setIntroStage(0)
    setEliminatedList([]); setWinner(null)
    setChambers([false,false,false,false,false,false])
    setPhase('intro'); phaseRef.current = 'intro'; playFx('crowd')
    activeRef.current = true
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(1) }, 600)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(2) }, 1800)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(3) }, 3500)
    setTimeout(() => { if (!activeRef.current) return; setIntroStage(4); playFx('whistle') }, 5000)
    setTimeout(() => {
      if (!activeRef.current) return
      setPhase('spinning'); phaseRef.current = 'spinning'
      setSpinAngle(1080 + Math.random() * 720)
      setComment(pick(RR_COMMENTS.spin)); playFx('revolver_spin')
      setTimeout(() => {
        if (!activeRef.current) return
        setPhase('player_turn'); phaseRef.current = 'player_turn'
        startTurn(ps, 0, bul, 0)
      }, 2500)
    }, 6500)
  }, [playFx, startTurn])

  const endGame = useCallback(() => {
    activeRef.current = false
    if (rrPuffInterval.current) { clearInterval(rrPuffInterval.current); rrPuffInterval.current = null }
    const won = winner?.isYou || false
    awardGame({ won, baseCoins: won ? 30 : 5, baseXP: won ? 20 : 8 })
    navigate('/arcade')
  }, [winner, awardGame, navigate])

  useEffect(() => {
    registerPuffHandlers(rrStartPuff, rrStopPuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, rrStartPuff, rrStopPuff])

  useEffect(() => () => {
    activeRef.current = false
    if (rrPuffInterval.current) clearInterval(rrPuffInterval.current)
  }, [])

  const curP = players[currentTurn]
  const isYourTurn = curP?.isYou && phase === 'player_turn'
  const isPuffing = phase === 'puffing'
  const puffTier = rrGetPuffTier(puffCharge)

  const handleScreenDown = useCallback(() => {
    if (phaseRef.current === 'player_turn' && playersRef.current[currentTurnRef.current]?.isYou) rrStartPuff()
  }, [rrStartPuff])
  const handleScreenUp = useCallback(() => {
    if (phaseRef.current === 'puffing') rrStopPuff()
  }, [rrStopPuff])

  if (!phase) {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, background:'linear-gradient(180deg, #050208, #0a0510, #12091a)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ fontSize:48 }}>🔫</div>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:3, color:C.red, textShadow:`0 0 20px ${C.red}40` }}>RUSSIAN ROULETTE</div>
        <div style={{ fontSize:13, color:C.text2, textAlign:'center', maxWidth:280 }}>Hold to puff before pulling the trigger.<br/>Longer puff = higher dodge chance (max 30%)</div>
        <div onClick={startGame} style={{ padding:'14px 36px', borderRadius:14, cursor:'pointer', background:`${C.red}15`, border:`2px solid ${C.red}40`, fontSize:16, fontWeight:900, color:C.red }}>🎲 PLAY</div>
        <div onClick={() => navigate('/arcade')} style={{ fontSize:12, color:C.text3, cursor:'pointer', marginTop:8 }}>← Back</div>
      </div>
    )
  }

  return (
    <div
      style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', animation:screenShake?'shake 0.4s ease':'none' }}
      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; handleScreenDown() }}
      onMouseUp={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; handleScreenUp() }}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; e.preventDefault(); handleScreenDown() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; handleScreenUp() }}
    >
      {/* Background */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, #050208 0%, #0a0510 15%, #12091a 50%, #080510 100%)', zIndex:0 }}/>
      {/* Smoke wisps */}
      {[...Array(8)].map((_,i) => <div key={'rrsmk'+i} style={{ position:'absolute', left:(5+i*12)+'%', top:(20+Math.sin(i*1.3)*30)+'%', width:60+i*20, height:30+i*10, borderRadius:'50%', background:`radial-gradient(ellipse, rgba(180,160,140,${0.03+Math.sin(i)*0.015}), transparent 70%)`, animation:`rrSmokeFloat ${8+i*2}s ease-in-out infinite`, animationDelay:i*1.2+'s', filter:'blur(15px)', pointerEvents:'none', zIndex:1 }}/>)}
      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,${phase==='bang'?0.9:isPuffing?0.7:0.45}) 100%)`, pointerEvents:'none', zIndex:3, transition:'all 0.5s' }}/>
      {phase === 'bang' && <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', background:'rgba(180,0,0,0.2)', animation:'duelRedPulse 0.3s ease-in-out infinite' }}/>}
      {screenFlash && <div style={{ position:'absolute', inset:0, zIndex:200, pointerEvents:'none', opacity:0, background:screenFlash==='goal'?'rgba(0,255,100,0.25)':'rgba(255,50,50,0.2)', animation:'flashOverlay 0.4s ease forwards' }}/>}

      {/* Intro overlay */}
      {phase === 'intro' && introStage < 4 && (
        <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(5,2,8,0.9)', animation:'fadeIn 0.3s ease' }}>
          {introStage >= 1 && <div style={{ fontSize:40, marginBottom:16, animation:'goalBurst 0.6s ease both' }}>🔫</div>}
          {introStage >= 2 && <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:C.red, textShadow:`0 0 30px ${C.red}60`, animation:'goalBurst 0.6s ease both' }}>RUSSIAN ROULETTE</div>}
          {introStage >= 3 && <div style={{ fontSize:13, color:C.text2, marginTop:12, textAlign:'center', maxWidth:260, animation:'fadeIn 0.5s ease both' }}>{players.length} souls enter... only one leaves<br/>Hold to puff for a dodge chance!</div>}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', maxWidth:380, width:'100%', padding:'50px 16px 20px', gap:12, zIndex:10, overflowY:'auto', flex:1 }}>
        <div style={{ fontSize:16, fontWeight:900, letterSpacing:3, color:C.red, textShadow:`0 0 20px ${C.red}40` }}>🎲 RUSSIAN ROULETTE</div>
        <div style={{ fontSize:9, color:C.text3 }}>Round {rrRound+1} · Chamber {currentChamber+1}/6 · {players.filter(p=>p.alive).length} alive</div>

        {/* Players */}
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:8 }}>
          {players.map((p,i) => {
            const isCur = i === currentTurn && phase !== 'bang' && phase !== 'winner'
            const isOut = !p.alive
            return (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, opacity:isOut?0.3:1, transform:isCur?'scale(1.2)':'scale(1)', transition:'all 0.3s' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${isCur?(p.isYou?C.cyan:C.orange):isOut?C.red:'rgba(255,255,255,0.08)'}15`, border:`2px solid ${isCur?(p.isYou?C.cyan:C.orange):isOut?C.red+'40':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:isCur?`0 0 15px ${p.isYou?C.cyan:C.orange}40`:'' }}>
                  {isOut ? '💀' : p.emoji}
                </div>
                <div style={{ fontSize:8, fontWeight:700, color:isCur?(p.isYou?C.cyan:C.orange):C.text3 }}>{p.isYou?'YOU':p.name.slice(0,8)}</div>
                {isCur && <div style={{ fontSize:6, color:C.red, animation:'pulse 0.5s infinite' }}>TURN</div>}
              </div>
            )
          })}
        </div>

        {/* Revolver */}
        <div style={{ position:'relative', width:120, height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:70, transform:`rotate(${spinAngle}deg)`, transition:phase==='spinning'?'transform 2s cubic-bezier(0.17,0.67,0.12,0.99)':'transform 0.3s', filter:`drop-shadow(0 0 20px ${C.red}40)` }}>🔫</div>
          {phase === 'spinning' && <div style={{ position:'absolute', fontSize:10, color:C.gold, fontWeight:800, animation:'pulse 0.3s infinite' }}>SPINNING...</div>}
        </div>

        {/* Chamber display */}
        <div style={{ display:'flex', gap:4 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} style={{ width:16, height:16, borderRadius:'50%', background:chambers[i]?`${C.text3}40`:i===currentChamber&&phase!=='spinning'?`${C.gold}30`:'rgba(255,255,255,0.06)', border:`1px solid ${chambers[i]?C.text3+'30':i===currentChamber&&phase!=='spinning'?C.gold+'50':'rgba(255,255,255,0.08)'}` }}/>
          ))}
        </div>

        {/* Comment */}
        {comment && (
          <div style={{ textAlign:'center', padding:'8px 20px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', animation:'fadeIn 0.3s ease' }}>
            <div style={{ fontSize:12, fontWeight:700, color:phase==='bang'?C.red:phase==='click'?C.green:C.text }}>{comment}</div>
          </div>
        )}

        {/* Your turn puff button */}
        {isYourTurn && (
          <div style={{ width:'100%', maxWidth:320 }}>
            {/* Simple puff meter */}
            <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:8 }}>
              <div style={{ width:`${puffCharge}%`, height:'100%', borderRadius:5, background:puffTier.color, transition:'width 0.05s' }}/>
            </div>
            <div data-btn
              onClick={rrStartPuff} onTouchStart={(e) => { e.preventDefault(); rrStartPuff() }}
              style={{ padding:'16px 40px', borderRadius:16, cursor:'pointer', textAlign:'center', background:`${C.red}15`, border:`2px solid ${C.red}30`, animation:'countPulse 1s infinite', userSelect:'none', WebkitUserSelect:'none', marginTop:6 }}
            >
              <div style={{ fontSize:18, fontWeight:900, color:C.red, letterSpacing:2 }}>💨 PUFF TO PULL TRIGGER</div>
              <div style={{ fontSize:9, color:C.text3, marginTop:3 }}>One chamber... six slots...</div>
            </div>
          </div>
        )}
        {isPuffing && (
          <div style={{ width:'100%', maxWidth:320 }}>
            <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:4 }}>
              <div style={{ width:`${puffCharge}%`, height:'100%', borderRadius:5, background:puffTier.color, transition:'width 0.05s' }}/>
            </div>
            <div style={{ textAlign:'center', fontSize:11, color:puffTier.color, fontWeight:800 }}>{puffTier.name} {puffTier.emoji} — {rrGetDodgeChance(puffCharge)}% dodge</div>
            <div style={{ textAlign:'center', fontSize:10, color:C.text3, marginTop:4 }}>Release to fire!</div>
          </div>
        )}

        {/* Phase-specific reactions */}
        {phase === 'click' && <div style={{ textAlign:'center', animation:'fadeIn 0.3s ease' }}><div style={{ fontSize:50, animation:'goalBurst 0.5s ease' }}>😮‍💨</div><div style={{ fontSize:14, fontWeight:800, color:C.green }}>SAFE!</div></div>}
        {phase === 'bang' && <div style={{ textAlign:'center', animation:'shake 0.5s ease' }}><div style={{ fontSize:60, animation:'goalBurst 0.5s ease' }}>💥</div><div style={{ fontSize:18, fontWeight:900, color:C.red, textShadow:`0 0 30px ${C.red}` }}>BANG!</div></div>}

        {/* Winner / End */}
        {phase === 'winner' && winner && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, animation:'fadeIn 0.5s ease' }}>
            <div style={{ fontSize:48 }}>{winner.isYou ? '🏆' : '💀'}</div>
            <div style={{ fontSize:22, fontWeight:900, color:winner.isYou?C.gold:C.red, textShadow:`0 0 20px ${winner.isYou?C.gold:C.red}60`, letterSpacing:3 }}>
              {winner.isYou ? 'SURVIVOR! 👑' : winner.name + ' WINS'}
            </div>
            <div style={{ fontSize:11, color:C.text2 }}>Survived {rrRound} round{rrRound!==1?'s':''}</div>
            <div style={{ display:'flex', gap:10 }}>
              <div data-btn onClick={(e) => { e.stopPropagation(); startGame() }} style={{ padding:'10px 24px', borderRadius:12, cursor:'pointer', background:`${C.red}15`, border:`1px solid ${C.red}30`, fontSize:13, fontWeight:800, color:C.red }}>🔄 Again</div>
              <div data-btn onClick={(e) => { e.stopPropagation(); endGame() }} style={{ padding:'10px 24px', borderRadius:12, cursor:'pointer', background:`${C.text3}10`, border:`1px solid ${C.text3}20`, fontSize:13, fontWeight:800, color:C.text3 }}>Done ✓</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
