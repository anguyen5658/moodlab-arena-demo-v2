import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const PP_HIT = ["Nice return! 🏓","Puff power! 💨","Clean shot! ✨","Smoked it! 🔥","Right back atcha! 🎯","THC reflexes! 💚"]
const PP_SMASH = ["SMASH! Sound barrier broken 💥","OBLITERATED! 🌟","NUCLEAR PUFF! ☢️💨","That ball has a family! 😱","Perfect center BOOM! 💣"]
const PP_RALLY = ["Rally {n}! Lungs are an engine 🫁🏎️","Rally {n}! INSANE 🤯","Rally {n}! Crowd ROARING 📣","{n} hits! Legendary 🔥🔥🔥"]
const PP_SY = ["YOU SCORE! 🎉","GOOOAL! 🥅💨","AI needs firmware update 🤖","POINT! Puff powered 💨🏆","Ball faster than your delivery 📦"]
const PP_SA = ["AI scores! 😤","Missed it! 💨","AI sneaks past! 🤖","Better positioning! 🎯","Machine strikes back! 🤖⚡"]

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

interface GObj {
  bx: number; by: number; dx: number; dy: number
  py: number; ay: number; rally: number; trail: {x:number;y:number;age:number}[]
  scoreY: number; scoreA: number; paused: boolean; smash: boolean; lastT: number
}

export default function PuffPong() {
  const navigate = useNavigate()
  const { playFx, awardGame, registerPuffHandlers } = useArena()

  const ppG = useRef<GObj>({ bx:50, by:50, dx:2.2, dy:1.2, py:50, ay:50, rally:0, trail:[], scoreY:0, scoreA:0, paused:false, smash:false, lastT:0 })
  const ppRaf = useRef<number | null>(null)
  const ppMoveInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<'intro'|'playing'|'result'|null>(null)
  const [introStep, setIntroStep] = useState(0)
  const [ballX, setBallX] = useState(50)
  const [ballY, setBallY] = useState(50)
  const [paddleY, setPaddleY] = useState(50)
  const [aiPaddleY, setAiPaddleY] = useState(50)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [rally, setRally] = useState(0)
  const [trail, setTrail] = useState<{x:number;y:number;age:number}[]>([])
  const [speed, setSpeed] = useState(0)
  const [impact, setImpact] = useState<{x:number;y:number}|null>(null)
  const [smash, setSmash] = useState(false)
  const [comment, setComment] = useState('')
  const [puffHeld, setPuffHeld] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<'goal'|'miss'|null>(null)

  const triggerShake = useCallback(() => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }, [])
  const triggerFlash = useCallback((type: 'goal'|'miss') => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }, [])

  const ppStartLoop = useCallback(() => {
    const g = ppG.current
    g.lastT = performance.now()
    if (ppMoveInterval.current) clearInterval(ppMoveInterval.current)
    ppMoveInterval.current = setInterval(() => {
      if (!g.paused) { g.py = Math.min(90, g.py + 0.6); setPaddleY(g.py) }
    }, 80)

    const loop = (now: number) => {
      if (g.paused) return
      const dt = Math.min((now - g.lastT) / 16.667, 3)
      g.lastT = now
      let nx = g.bx + g.dx * dt, ny = g.by + g.dy * dt, ndx = g.dx, ndy = g.dy
      g.trail.push({ x: g.bx, y: g.by, age: 0 })
      if (g.trail.length > 18) g.trail.shift()
      g.trail.forEach(t => t.age++)
      if (ny <= 2) { ny = 2; ndy = Math.abs(ndy); playFx('pong_wall') }
      if (ny >= 98) { ny = 98; ndy = -Math.abs(ndy); playFx('pong_wall') }
      const aiSpd = 0.04 + Math.min(Math.abs(g.dx) * 0.005, 0.04)
      g.ay += (ny - g.ay) * aiSpd * dt
      g.ay = Math.max(10, Math.min(90, g.ay))
      const spd = Math.sqrt(ndx * ndx + ndy * ndy)
      // Player paddle collision (left side)
      if (nx <= 6 && g.bx > 6) {
        const hd = Math.abs(ny - g.py)
        if (hd < 18) {
          const ho = (ny - g.py) / 18, sm = hd < 2
          ndx = Math.abs(ndx) * (sm ? 1.6 : 1.05)
          ndy = g.dy + ho * 2.5
          nx = 7
          g.rally++; g.smash = sm
          playFx('pong_hit')
          setImpact({ x: 6, y: ny }); setTimeout(() => setImpact(null), 300)
          if (sm) { setSmash(true); triggerShake(); setComment(pick(PP_SMASH)); setTimeout(() => setSmash(false), 500) }
          else setComment(pick(PP_HIT))
          if (g.rally > 0 && g.rally % 10 === 0) { setComment(pick(PP_RALLY).replace('{n}', String(g.rally))); playFx('crowd') }
          setRally(g.rally)
        } else {
          g.scoreA++
          setScore({ you: g.scoreY, ai: g.scoreA })
          triggerShake(); triggerFlash('miss'); playFx('pong_score')
          setComment(pick(PP_SA)); g.rally = 0; setRally(0)
          if (g.scoreA >= 5) { g.paused = true; setPhase('result'); playFx('lose'); return }
          nx = 50; ny = 50; ndx = 2.2; ndy = 1.2 * (Math.random() > 0.5 ? 1 : -1); g.trail = []
        }
      }
      // AI paddle collision (right side)
      if (nx >= 94 && g.bx < 94) {
        const hd = Math.abs(ny - g.ay)
        if (hd < 10) {
          ndx = -Math.abs(ndx) * 1.03; ndy = g.dy + (ny - g.ay) * 0.12; nx = 93
          g.rally++; setRally(g.rally); playFx('pong_hit')
          setImpact({ x: 94, y: ny }); setTimeout(() => setImpact(null), 300)
        } else {
          g.scoreY++
          setScore({ you: g.scoreY, ai: g.scoreA })
          triggerFlash('goal'); triggerShake(); playFx('pong_score')
          setComment(pick(PP_SY)); g.rally = 0; setRally(0)
          if (g.scoreY >= 5) {
            g.paused = true; setPhase('result'); playFx('win')
            return
          }
          nx = 50; ny = 50; ndx = -2.2; ndy = 1.2 * (Math.random() > 0.5 ? 1 : -1); g.trail = []
        }
      }
      if (Math.abs(ndx) > 5.5) ndx = 5.5 * Math.sign(ndx)
      if (Math.abs(ndy) > 5.5) ndy = 5.5 * Math.sign(ndy)
      g.bx = nx; g.by = ny; g.dx = ndx; g.dy = ndy
      setBallX(nx); setBallY(ny); setAiPaddleY(g.ay); setSpeed(spd); setTrail([...g.trail])
      ppRaf.current = requestAnimationFrame(loop)
    }
    ppRaf.current = requestAnimationFrame(loop)
  }, [playFx, triggerShake, triggerFlash])

  const startGame = useCallback(() => {
    if (ppRaf.current) cancelAnimationFrame(ppRaf.current)
    if (ppMoveInterval.current) { clearInterval(ppMoveInterval.current); ppMoveInterval.current = null }
    const g = ppG.current
    g.bx=50; g.by=50; g.dx=2.2; g.dy=1.2; g.py=50; g.ay=50; g.rally=0; g.trail=[]
    g.scoreY=0; g.scoreA=0; g.paused=false; g.smash=false; g.lastT=0
    setBallX(50); setBallY(50); setPaddleY(50); setAiPaddleY(50)
    setScore({ you: 0, ai: 0 }); setRally(0); setTrail([]); setSpeed(0)
    setImpact(null); setSmash(false); setComment(''); setPuffHeld(false)
    setIntroStep(1); setPhase('intro'); playFx('whistle')
    setTimeout(() => setIntroStep(2), 500)
    setTimeout(() => setIntroStep(3), 1000)
    setTimeout(() => setIntroStep(4), 1500)
    setTimeout(() => {
      setIntroStep(5); setComment('SERVE!'); playFx('crowd')
      setTimeout(() => { setPhase('playing'); setIntroStep(0); setComment(''); ppStartLoop() }, 600)
    }, 2000)
  }, [playFx, ppStartLoop])

  const movePaddle = useCallback((dir: number) => {
    const g = ppG.current
    g.py = Math.max(10, Math.min(90, g.py + dir * 6))
    setPaddleY(g.py)
  }, [])

  const puffUp = useCallback(() => {
    setPuffHeld(true)
    const g = ppG.current
    if (ppMoveInterval.current) clearInterval(ppMoveInterval.current)
    ppMoveInterval.current = setInterval(() => {
      if (!g.paused) { g.py = Math.max(10, g.py - 4); setPaddleY(g.py) }
    }, 50)
  }, [])

  const puffRelease = useCallback(() => {
    setPuffHeld(false)
    if (ppMoveInterval.current) { clearInterval(ppMoveInterval.current); ppMoveInterval.current = null }
    const g = ppG.current
    ppMoveInterval.current = setInterval(() => {
      if (!g.paused) { g.py = Math.min(90, g.py + 0.6); setPaddleY(g.py) }
    }, 80)
  }, [])

  const endGame = useCallback(() => {
    if (ppRaf.current) cancelAnimationFrame(ppRaf.current)
    if (ppMoveInterval.current) { clearInterval(ppMoveInterval.current); ppMoveInterval.current = null }
    ppG.current.paused = true
    const won = ppG.current.scoreY > ppG.current.scoreA
    awardGame({ won, baseCoins: won ? 80 : 12, baseXP: won ? 20 : 8 })
    navigate('/arcade')
  }, [awardGame, navigate])

  // Register BLE handlers
  useEffect(() => {
    registerPuffHandlers(puffUp, puffRelease)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, puffUp, puffRelease])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ppRaf.current) cancelAnimationFrame(ppRaf.current)
      if (ppMoveInterval.current) clearInterval(ppMoveInterval.current)
    }
  }, [])

  const ppBSP = Math.min(speed / 5, 1)
  const isIntro = phase === 'intro'

  if (!phase) {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, background:'#06101E', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ fontSize:32, fontWeight:900, letterSpacing:5, color:C.cyan, textShadow:`0 0 20px ${C.cyan}`, fontFamily:'monospace' }}>PUFF PONG</div>
        <div style={{ fontSize:13, color:C.text2, textAlign:'center', maxWidth:280 }}>First to 5 points wins!<br/>Hold to move paddle UP — release to drift DOWN</div>
        <div onClick={startGame} style={{ padding:'14px 36px', borderRadius:14, cursor:'pointer', background:`${C.cyan}18`, border:`2px solid ${C.cyan}50`, fontSize:16, fontWeight:900, color:C.cyan }}>START GAME 🏓</div>
        <div onClick={() => navigate('/arcade')} style={{ fontSize:12, color:C.text3, cursor:'pointer', marginTop:8 }}>← Back</div>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', background:`radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.04), transparent 60%), #06101E`, animation:screenShake ? 'shake 0.4s ease' : 'none' }}>
      {screenFlash && <div style={{ position:'absolute', inset:0, zIndex:200, pointerEvents:'none', opacity:0, background:screenFlash==='goal'?'rgba(0,255,200,0.3)':'rgba(255,30,30,0.25)', animation:'flashOverlay 0.4s ease forwards' }}/>}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', maxWidth:400, width:'100%', padding:'44px 12px 16px', gap:6, zIndex:10, flex:1 }}>
        {/* Title */}
        <div style={{ fontSize:22, fontWeight:900, letterSpacing:5, color:C.cyan, textShadow:`0 0 10px ${C.cyan}, 0 0 30px ${C.cyan}80, 0 0 60px ${C.cyan}40`, fontFamily:'monospace', marginBottom:2 }}>PUFF PONG</div>
        {/* Score */}
        <div style={{ display:'flex', gap:24, alignItems:'center', marginBottom:2 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ fontSize:9, fontWeight:700, color:C.cyan, letterSpacing:2, opacity:0.7 }}>YOU</span>
            <span style={{ fontSize:36, fontWeight:900, color:C.cyan, fontFamily:'monospace', textShadow:`0 0 15px ${C.cyan}, 0 0 30px ${C.cyan}60`, lineHeight:1 }}>{score.you}</span>
          </div>
          <span style={{ fontSize:14, color:C.text3, fontWeight:900, opacity:0.4 }}>VS</span>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ fontSize:9, fontWeight:700, color:C.red, letterSpacing:2, opacity:0.7 }}>AI</span>
            <span style={{ fontSize:36, fontWeight:900, color:C.red, fontFamily:'monospace', textShadow:`0 0 15px ${C.red}, 0 0 30px ${C.red}60`, lineHeight:1 }}>{score.ai}</span>
          </div>
        </div>
        {rally >= 3 && (
          <div style={{ fontSize:11, fontWeight:900, color:rally>=20?C.gold:rally>=10?C.orange:C.cyan, textShadow:'0 0 10px currentColor', animation:rally>=10?'pulse 0.6s ease infinite':'none', letterSpacing:1 }}>
            RALLY: {rally} {rally>=30?'🔥🔥🔥':rally>=20?'🔥🔥':rally>=10?'🔥':''}
          </div>
        )}
        {phase === 'playing' && (
          <div style={{ display:'flex', alignItems:'center', gap:4, opacity:0.6 }}>
            <span style={{ fontSize:7, color:C.text3, fontWeight:700, letterSpacing:1 }}>SPEED</span>
            <div style={{ width:60, height:3, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ width:`${ppBSP*100}%`, height:'100%', borderRadius:2, background:ppBSP>0.7?C.red:ppBSP>0.4?C.orange:C.cyan, boxShadow:`0 0 6px ${ppBSP>0.7?C.red:C.cyan}`, transition:'width 0.15s' }}/>
            </div>
          </div>
        )}
        {/* Court */}
        <div style={{ position:'relative', width:'100%', maxWidth:360, height:320, background:'rgba(0,10,20,0.9)', border:`2px solid ${C.cyan}30`, borderRadius:14, overflow:'hidden', boxShadow:`0 0 40px ${C.cyan}10, inset 0 0 60px rgba(0,229,255,0.03)`, opacity:isIntro&&introStep<2?0:1, animation:isIntro&&introStep>=2?'fadeIn 0.5s ease':'none' }}>
          {/* Center line */}
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:`linear-gradient(180deg,transparent,${C.cyan}25,${C.cyan}15,${C.cyan}25,transparent)` }}/>
          <div style={{ position:'absolute', left:'50%', top:'50%', width:40, height:40, borderRadius:'50%', border:`1px solid ${C.cyan}20`, transform:'translate(-50%,-50%)' }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`${C.cyan}20` }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`${C.cyan}20` }}/>
          <div style={{ position:'absolute', left:20, top:0, bottom:0, width:1, background:`${C.cyan}12` }}/>
          <div style={{ position:'absolute', right:20, top:0, bottom:0, width:1, background:`${C.red}12` }}/>
          {rally >= 5 && (
            <>
              <div style={{ position:'absolute', top:4, left:4, fontSize:7, opacity:0.4, animation:'pulse 1.5s ease infinite' }}>📣</div>
              <div style={{ position:'absolute', top:4, right:4, fontSize:7, opacity:0.4, animation:'pulse 1.5s ease infinite 0.5s' }}>📣</div>
            </>
          )}
          {/* Trail */}
          {trail.map((t, i) => (
            <div key={'t'+i} style={{ position:'absolute', left:`${t.x}%`, top:`${t.y}%`, width:Math.max(2,8-t.age*0.3), height:Math.max(2,8-t.age*0.3), borderRadius:'50%', background:smash?`rgba(255,200,0,${Math.max(0,0.3-t.age*0.015)})`:`rgba(0,229,255,${Math.max(0,0.25-t.age*0.012)})`, transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
          ))}
          {/* Player paddle */}
          <div style={{ position:'absolute', left:8, top:`${paddleY-12}%`, width:10, height:'24%', background:`linear-gradient(180deg,${C.cyan}CC,${C.cyan})`, borderRadius:5, boxShadow:`0 0 15px ${C.cyan}80, 0 0 30px ${C.cyan}40`, transition:'top 0.08s', opacity:isIntro&&introStep<3?0:1 }}/>
          {/* AI paddle */}
          <div style={{ position:'absolute', right:8, top:`${aiPaddleY-10}%`, width:10, height:'20%', background:`linear-gradient(180deg,${C.red}CC,${C.red})`, borderRadius:5, boxShadow:`0 0 15px ${C.red}80, 0 0 30px ${C.red}40`, transition:'top 0.12s', opacity:isIntro&&introStep<3?0:1 }}/>
          {/* Ball */}
          <div style={{ position:'absolute', left:`${ballX}%`, top:`${ballY}%`, width:smash?16:13, height:smash?16:13, borderRadius:'50%', background:smash?'radial-gradient(circle,#fff,#FFD93D)':'radial-gradient(circle,#fff 30%,rgba(0,229,255,0.8))', boxShadow:smash?`0 0 20px ${C.gold},0 0 40px ${C.gold}80`:`0 0 12px rgba(0,229,255,0.8),0 0 25px rgba(0,229,255,0.4)`, transform:'translate(-50%,-50%)', opacity:isIntro&&introStep<4?0:1 }}/>
          {/* Impact flash */}
          {impact && <div style={{ position:'absolute', left:`${impact.x}%`, top:`${impact.y}%`, width:30, height:30, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.9),transparent 70%)', transform:'translate(-50%,-50%)', pointerEvents:'none', animation:'flashOverlay 0.3s ease forwards' }}/>}
          {/* Smash label */}
          {smash && <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', fontSize:28, fontWeight:900, color:C.gold, textShadow:`0 0 20px ${C.gold}`, animation:'goalBurst 0.5s ease', pointerEvents:'none', zIndex:5 }}>SMASH!</div>}
          {/* Serve label */}
          {introStep === 5 && <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', fontSize:32, fontWeight:900, color:C.gold, letterSpacing:6, textShadow:`0 0 20px ${C.gold}`, animation:'goalBurst 0.5s ease', zIndex:5 }}>SERVE!</div>}
          {/* Touch zones for tap control */}
          <div onMouseDown={() => movePaddle(-1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(-1) }} style={{ position:'absolute', left:0, top:0, width:'50%', height:'50%', cursor:'pointer', zIndex:3 }}/>
          <div onMouseDown={() => movePaddle(1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(1) }} style={{ position:'absolute', left:0, top:'50%', width:'50%', height:'50%', cursor:'pointer', zIndex:3 }}/>
        </div>
        {/* Controls */}
        {phase === 'playing' && (
          <div style={{ width:'100%', maxWidth:320 }}>
            <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center', justifyContent:'center' }}>
              <div onMouseDown={() => movePaddle(-1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(-1) }} style={{ padding:'8px 16px', borderRadius:10, cursor:'pointer', background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, fontSize:11, fontWeight:800, color:C.cyan }}>UP</div>
              <div
                onMouseDown={puffUp} onMouseUp={puffRelease} onMouseLeave={puffRelease}
                onTouchStart={(e) => { e.preventDefault(); puffUp() }} onTouchEnd={puffRelease}
                style={{ padding:'10px 20px', borderRadius:12, cursor:'pointer', background:puffHeld?`${C.cyan}30`:`${C.cyan}10`, border:`2px solid ${puffHeld?C.cyan:C.cyan+'40'}`, fontSize:12, fontWeight:900, color:C.cyan, transition:'all 0.15s', transform:puffHeld?'scale(0.95)':'scale(1)' }}
              >{puffHeld ? 'PADDLE UP... 🏓' : 'HOLD TO MOVE PADDLE 🏓'}</div>
              <div onMouseDown={() => movePaddle(1)} onTouchStart={(e) => { e.preventDefault(); movePaddle(1) }} style={{ padding:'8px 16px', borderRadius:10, cursor:'pointer', background:`${C.cyan}12`, border:`1px solid ${C.cyan}25`, fontSize:11, fontWeight:800, color:C.cyan }}>DOWN</div>
            </div>
          </div>
        )}
        <div style={{ fontSize:7, color:C.text3, marginTop:2, opacity:0.5 }}>HOLD = paddle UP | Release = drift DOWN | Tap UP/DOWN buttons</div>
        {comment && (
          <div style={{ padding:'5px 14px', borderRadius:10, marginTop:2, background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.12)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.text, textAlign:'center' }}>{comment}</div>
          </div>
        )}
        {/* Result */}
        {phase === 'result' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:8, animation:'fadeIn 0.5s ease' }}>
            <div style={{ fontSize:20, fontWeight:900, color:score.you>score.ai?C.cyan:C.red, textShadow:'0 0 20px currentColor', letterSpacing:2 }}>
              {score.you > score.ai ? 'YOU WIN! 🏆' : 'AI WINS 🤖'}
            </div>
            <div style={{ fontSize:11, color:C.text2 }}>{score.you > score.ai ? 'Puff Pong champion! Powered by THC 💨🏆' : 'Better luck next puff! 💨'}</div>
            {(() => {
              const won = score.you > score.ai
              const base = won ? 80 : 15
              return (
                <div style={{ padding:10, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginTop:10, marginBottom:8, width:'100%', maxWidth:300 }}>
                  <div style={{ fontSize:9, color:C.text3, letterSpacing:1, marginBottom:6 }}>GAME REWARD</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800 }}>
                    <span style={{ color:C.text }}>Earned</span>
                    <span style={{ color:C.gold }}>+{base} 🪙</span>
                  </div>
                </div>
              )
            })()}
            <div style={{ display:'flex', gap:10 }}>
              <div onClick={() => { setPhase(null); startGame() }} style={{ padding:'10px 24px', borderRadius:12, cursor:'pointer', background:`${C.cyan}12`, border:`1px solid ${C.cyan}30`, fontSize:13, fontWeight:800, color:C.cyan }}>🔄 Rematch</div>
              <div onClick={endGame} style={{ padding:'10px 24px', borderRadius:12, cursor:'pointer', background:`${C.text3}08`, border:`1px solid ${C.text3}15`, fontSize:13, fontWeight:800, color:C.text3 }}>Done</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
