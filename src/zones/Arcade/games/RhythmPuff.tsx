import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const RP_LANES = ["🎸","🥁","🎹","🎷"]
const RP_LANE_COLORS = [C.red, "#00E5FF", C.gold, C.purple]
const RP_HIT_ZONE = 82
const RP_COMBO_TIERS = [{min:50,mult:10},{min:20,mult:5},{min:10,mult:3},{min:5,mult:2},{min:0,mult:1}]
const rpGetMultiplier = (combo: number) => { for (const t of RP_COMBO_TIERS) { if (combo >= t.min) return t.mult } return 1 }

const RP_COMEDY = {
  perfect:["PERFECT! Your timing is suspiciously good... 🤔💨","NAILED IT! Are you even high right now? 🎯","FLAWLESS! The puff gods smile upon you 🙏💨"],
  good:["GOOD! Almost perfect, almost sober 😏","Nice one! The beat approves 🎵","Solid hit! Keep vibing 🌊"],
  ok:["OK! Close enough... like your aim after a blinker 😵‍💫","Ehhh, we'll count it 🤷"],
  miss:["Miss! Your finger went on vacation 🏖️","MISS! Was that a cough or a puff? 🫁","The beat is crying right now 💀"],
  combo5:["COMBO x5! Warming up! 🔥"],
  combo10:["COMBO x10! You're in the ZONE (the puff zone) 🌊"],
  combo20:["COMBO x20! LEGENDARY rhythm! 👑💨"],
  combo50:["COMBO x50! INHUMAN! This isn't weed, this is FOCUS 🧠💨"],
  blinker:["BLINKER HIT! Caught ALL the notes! 🫁🎵","MEGA PUFF! Everything absorbed! 🌬️🎵"],
  puff:["PUFF COMBO! Multiple notes in one breath! 🫁","Big puff energy! Caught them all! 💨🎵"],
  gameover:["Game over! 15 misses... maybe try a different strain 🌿"],
  win:["ENCORE! ENCORE! What a performance! 🎤🔥","Standing ovation! The crowd wants MORE! 👏💨"],
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface Note { id: number; lane: number; y: number; hit: boolean }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }
interface Rating { text: string; color: string; lane: number; id: number }

export default function RhythmPuff() {
  const navigate = useNavigate()
  const { playFx, awardGame, registerPuffHandlers } = useArena()

  const rpInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const blinkerInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const blinkerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)

  const [phase, setPhase] = useState<string>('menu')
  const [introStep, setIntroStep] = useState(0)
  const [notes, setNotes] = useState<Note[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [misses, setMisses] = useState(0)
  const [speed, setSpeed] = useState(3)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<Rating|null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [stageFlash, setStageFlash] = useState(0)
  const [blinker, setBlinker] = useState(false)
  const [beat, setBeat] = useState(0)
  const [crowdJump, setCrowdJump] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<string|null>(null)

  const triggerShake = useCallback(() => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }, [])
  const triggerFlash = useCallback((type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }, [])

  const rpShowRating = useCallback((text: string, color: string, lane: number) => {
    setRating({ text, color, lane, id: Date.now() })
    setTimeout(() => setRating(null), 600)
  }, [])

  const rpSpawnParticles = useCallback((lane: number, color: string, count = 8) => {
    const px = 12.5 + lane * 25
    const parts: Particle[] = Array.from({length:count},(_,i) => ({
      id: Date.now() + Math.random() + i, x: px + (Math.random()-0.5)*10, y: RP_HIT_ZONE + (Math.random()-0.5)*5,
      vx: (Math.random()-0.5)*6, vy: -2-Math.random()*4, color, size: 3+Math.random()*4, life: 1
    }))
    setParticles(p => [...p, ...parts])
    setTimeout(() => setParticles(p => p.filter(pp => pp.id < Date.now() - 600)), 700)
  }, [])

  // combo needs a ref for rpPuffHit called from BLE
  const comboRef = useRef(combo)
  useEffect(() => { comboRef.current = combo }, [combo])

  const rpHitNote = useCallback((lane: number) => {
    setNotes(ns => {
      const candidates = ns.map((n,i) => ({...n, idx:i})).filter(n => n.lane===lane && !n.hit)
      const inZone = candidates.filter(n => n.y > RP_HIT_ZONE-18 && n.y < RP_HIT_ZONE+12)
      if (inZone.length === 0) {
        setCombo(0); setMisses(m => m+1); setComment('Wrong lane! 😬')
        playFx('rhythm_miss'); rpShowRating('MISS', C.red, lane); return ns
      }
      const closest = inZone.reduce((a,b) => Math.abs(a.y-RP_HIT_ZONE)<Math.abs(b.y-RP_HIT_ZONE)?a:b)
      const dist = Math.abs(closest.y - RP_HIT_ZONE)
      const newN = [...ns]; newN[closest.idx] = {...newN[closest.idx], hit:true}
      let ratingText: string, pts: number, ratingColor: string
      if (dist <= 8) { ratingText='PERFECT'; pts=100; ratingColor=C.gold; rpSpawnParticles(lane, RP_LANE_COLORS[lane], 12); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 300) }
      else if (dist <= 14) { ratingText='GOOD'; pts=75; ratingColor=C.green; rpSpawnParticles(lane, RP_LANE_COLORS[lane], 6) }
      else if (dist <= 22) { ratingText='OK'; pts=50; ratingColor=C.orange }
      else { ratingText='MISS'; pts=0; ratingColor=C.red }
      if (ratingText === 'MISS') {
        setCombo(0); setMisses(m => m+1); setComment(pick(RP_COMEDY.miss)); playFx('rhythm_miss')
      } else {
        const mult = rpGetMultiplier(comboRef.current)
        setScore(s => s + pts * mult)
        setCombo(c => {
          const nc = c+1; setMaxCombo(m => Math.max(m, nc))
          if (nc===50) setComment(pick(RP_COMEDY.combo50))
          else if (nc===20) setComment(pick(RP_COMEDY.combo20))
          else if (nc===10) { setComment(pick(RP_COMEDY.combo10)); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 500) }
          else if (nc===5) setComment(pick(RP_COMEDY.combo5))
          else if (ratingText==='PERFECT') setComment(pick(RP_COMEDY.perfect))
          else if (ratingText==='GOOD') setComment(pick(RP_COMEDY.good))
          else setComment(pick(RP_COMEDY.ok))
          return nc
        })
        if (ratingText==='PERFECT') { playFx('rhythm_perfect'); triggerFlash('save'); setStageFlash(f => f+1) }
        else playFx('rhythm_hit')
      }
      rpShowRating(ratingText, ratingColor, lane)
      return newN
    })
  }, [playFx, rpShowRating, rpSpawnParticles, triggerFlash])

  const rpPuffHit = useCallback(() => {
    setNotes(ns => {
      const inZone = ns.filter(n => !n.hit && n.y > RP_HIT_ZONE-15 && n.y < RP_HIT_ZONE+10)
      if (inZone.length === 0) return ns
      const newN = [...ns]
      inZone.forEach(n => {
        const idx = newN.findIndex(nn => nn.id === n.id)
        if (idx >= 0) newN[idx] = {...newN[idx], hit:true}
        rpSpawnParticles(n.lane, RP_LANE_COLORS[n.lane], 8)
      })
      const mult = rpGetMultiplier(comboRef.current)
      setScore(s => s + inZone.length * 75 * mult)
      setCombo(c => { const nc = c + inZone.length; setMaxCombo(m => Math.max(m, nc)); return nc })
      setComment(inZone.length > 3 ? pick(RP_COMEDY.blinker) : pick(RP_COMEDY.puff))
      playFx('kick'); triggerFlash('save'); setCrowdJump(true); setTimeout(() => setCrowdJump(false), 400)
      rpShowRating('PUFF x'+inZone.length, C.cyan, 1)
      return newN
    })
  }, [playFx, rpSpawnParticles, rpShowRating, triggerFlash])

  const rpBlinkerPuff = useCallback(() => {
    if (blinker) return
    setBlinker(true)
    setComment(pick(RP_COMEDY.blinker)); triggerFlash('blinker'); playFx('win')
    setNotes(ns => {
      const unhit = ns.filter(n => !n.hit)
      if (unhit.length === 0) return ns
      const newN = ns.map(n => n.hit ? n : {...n, hit:true})
      unhit.forEach(n => rpSpawnParticles(n.lane, RP_LANE_COLORS[n.lane], 6))
      const mult = rpGetMultiplier(comboRef.current)
      setScore(s => s + unhit.length * 100 * mult)
      setCombo(c => { const nc = c + unhit.length; setMaxCombo(m => Math.max(m, nc)); return nc })
      rpShowRating('BLINKER! x'+unhit.length, C.pink, 2)
      return newN
    })
    blinkerInterval.current = setInterval(() => {
      setNotes(ns => {
        const unhit = ns.filter(n => !n.hit)
        if (unhit.length > 0) {
          unhit.forEach(n => rpSpawnParticles(n.lane, RP_LANE_COLORS[n.lane], 4))
          setScore(s => s + unhit.length * 50); setCombo(c => c + unhit.length)
        }
        return ns.map(n => ({...n, hit:true}))
      })
    }, 200)
    blinkerTimeout.current = setTimeout(() => {
      if (blinkerInterval.current) clearInterval(blinkerInterval.current)
      setBlinker(false)
    }, 2000)
    setCrowdJump(true); setTimeout(() => setCrowdJump(false), 2000)
  }, [blinker, playFx, rpSpawnParticles, rpShowRating, triggerFlash])

  const startGame = useCallback(() => {
    if (rpInterval.current) clearInterval(rpInterval.current)
    setNotes([]); setScore(0); setCombo(0); setMaxCombo(0); setMisses(0); setSpeed(3)
    setComment(''); setRating(null); setParticles([]); setStageFlash(0); setBlinker(false)
    setBeat(0); setCrowdJump(false); setIntroStep(0); setPhase('intro')
    comboRef.current = 0; activeRef.current = true
    playFx('crowd')
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(1) }, 400)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(2) }, 1200)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(3) }, 2200)
    setTimeout(() => { if (!activeRef.current) return; setIntroStep(4); playFx('whistle') }, 3000)
    setTimeout(() => {
      if (!activeRef.current) return
      setPhase('playing'); setIntroStep(0)
      let beatCount = 0; let currentSpeed = 3
      rpInterval.current = setInterval(() => {
        beatCount++
        if (beatCount % 500 === 0 && currentSpeed < 6) { currentSpeed += 0.25; setSpeed(currentSpeed) }
        setBeat(b => b+1)
        if (beatCount % 8 === 0) setStageFlash(f => f > 0 ? 0 : 1)
        setNotes(notes => {
          let nn = [...notes.map(n => ({...n, y:n.y+currentSpeed})).filter(n => {
            if (n.y > 95 && !n.hit) {
              setMisses(m => {
                if (m+1 >= 15) {
                  clearInterval(rpInterval.current!); setPhase('result'); playFx('lose')
                  setComment(pick(RP_COMEDY.gameover))
                }
                return m+1
              })
              setCombo(0); comboRef.current = 0; setComment(pick(RP_COMEDY.miss))
              rpShowRating('MISS', C.red, n.lane); playFx('error'); triggerShake()
              return false
            }
            return n.y < 110
          })]
          const spawnRate = beatCount < 300 ? 10 : beatCount < 600 ? 8 : 6
          if (beatCount % spawnRate === 0) {
            const lane = Math.floor(Math.random() * 4)
            nn.push({ id: Date.now()+Math.random(), lane, y:-5, hit:false })
          }
          if (beatCount > 200 && beatCount % 20 === 0 && Math.random() > 0.5) {
            const lane2 = Math.floor(Math.random() * 4)
            nn.push({ id: Date.now()+Math.random()+0.5, lane:lane2, y:-5, hit:false })
          }
          return nn
        })
      }, 60)
    }, 4000)
  }, [playFx, rpShowRating, triggerShake])

  const endGame = useCallback(() => {
    if (rpInterval.current) clearInterval(rpInterval.current)
    if (blinkerInterval.current) clearInterval(blinkerInterval.current)
    if (blinkerTimeout.current) clearTimeout(blinkerTimeout.current)
    activeRef.current = false
    const won = score > 500; const baseR = won ? 80 : 12
    awardGame({ won, baseCoins: baseR, baseXP: won ? 20 : 8 })
    navigate('/arcade')
  }, [score, awardGame, navigate])

  // Register BLE handlers — rpPuffHit is tap-based (down only)
  useEffect(() => {
    registerPuffHandlers(rpPuffHit, null)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, rpPuffHit])

  useEffect(() => () => {
    activeRef.current = false
    if (rpInterval.current) clearInterval(rpInterval.current)
    if (blinkerInterval.current) clearInterval(blinkerInterval.current)
    if (blinkerTimeout.current) clearTimeout(blinkerTimeout.current)
  }, [])

  const rpMult = rpGetMultiplier(combo)
  const rpComboFire = combo >= 20 ? '🔥🔥🔥' : combo >= 10 ? '🔥🔥' : combo >= 5 ? '🔥' : ''
  const rpBeatPulse = beat % 8 < 4

  if (phase === 'menu') {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, background:'#06101E', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ fontSize:36 }}>🎵</div>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:C.purple, textShadow:`0 0 20px ${C.purple}` }}>RHYTHM PUFF</div>
        <div style={{ fontSize:13, color:C.text2, textAlign:'center', maxWidth:280 }}>Tap lanes to hit notes!<br/>Combo multipliers up to 10x. 15 misses = game over.</div>
        <div style={{ display:'flex', gap:8 }}>
          {RP_LANES.map((l,i) => <div key={i} style={{ fontSize:24, padding:'10px 14px', borderRadius:12, background:`${RP_LANE_COLORS[i]}15`, border:`1px solid ${RP_LANE_COLORS[i]}30` }}>{l}</div>)}
        </div>
        <div onClick={startGame} style={{ padding:'14px 36px', borderRadius:14, cursor:'pointer', background:`${C.purple}18`, border:`2px solid ${C.purple}50`, fontSize:16, fontWeight:900, color:C.purple }}>DROP THE BEAT 🎵</div>
        <div onClick={() => navigate('/arcade')} style={{ fontSize:12, color:C.text3, cursor:'pointer', marginTop:8 }}>← Back</div>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, overflow:'hidden', background:'#06101E', animation:screenShake?'shake 0.4s ease':'none' }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%, rgba(160,50,220,.25), transparent 50%), linear-gradient(180deg, #0a0a28, #150030, #0a0a1e)` }}/>
      {/* Spotlights */}
      {[0,1,2,3].map(i => <div key={'spt'+i} style={{ position:'absolute', top:-20, left:`${10+i*25}%`, width:60, height:'110%', background:`linear-gradient(180deg,${RP_LANE_COLORS[i]}${stageFlash>0?'30':'08'} 0%,transparent 70%)`, transform:`rotate(${(i-1.5)*8}deg)`, transformOrigin:'top center', pointerEvents:'none', zIndex:1 }}/>)}
      {screenFlash && <div style={{ position:'absolute', inset:0, zIndex:200, pointerEvents:'none', opacity:0, background:screenFlash==='blinker'?'rgba(255,0,200,.3)':'rgba(255,200,0,.2)', animation:'flashOverlay 0.4s ease forwards' }}/>}
      {blinker && <div style={{ position:'absolute', inset:0, zIndex:195, pointerEvents:'none', background:'radial-gradient(circle, rgba(255,0,200,.15), rgba(200,50,255,.08))', animation:'pulse 0.5s infinite' }}/>}

      {/* Intro */}
      {phase === 'intro' && (
        <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {introStep >= 2 && <div style={{ animation:'goalBurst 0.8s ease both', textAlign:'center' }}><div style={{ fontSize:32, fontWeight:900, letterSpacing:6, color:C.purple, textShadow:`0 0 20px ${C.purple}`, animation:'neonFlicker 2s infinite' }}>RHYTHM PUFF</div><div style={{ fontSize:14, color:C.pink, fontWeight:700, marginTop:4, letterSpacing:2 }}>🎵 Guitar Hero x Puff Session 🎵</div></div>}
          {introStep >= 3 && <div style={{ display:'flex', gap:16, marginTop:24, animation:'fadeIn 0.5s ease both' }}>{RP_LANES.map((lane,i) => <div key={i} style={{ fontSize:28, animation:`fadeIn 0.3s ease ${i*0.1}s both`, filter:`drop-shadow(0 0 8px ${RP_LANE_COLORS[i]})` }}>{lane}</div>)}</div>}
          {introStep >= 4 && <div style={{ marginTop:20, animation:'duelCountdownPop 0.6s ease both' }}><div style={{ fontSize:28, fontWeight:900, color:C.gold, letterSpacing:4, textShadow:`0 0 20px ${C.gold}80` }}>3, 2, 1, DROP!</div></div>}
        </div>
      )}

      {/* Main play */}
      {(phase === 'playing' || phase === 'result') && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', height:'100%', padding:'40px 8px 8px', zIndex:10, position:'relative' }}>
          {/* Stats header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', maxWidth:360, marginBottom:4, zIndex:20 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <div style={{ fontSize:9, color:C.text3, fontWeight:700, letterSpacing:1 }}>SCORE</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.gold, textShadow:`0 0 10px ${C.gold}40` }}>{score.toLocaleString()}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontSize:9, color:C.text3, fontWeight:700, letterSpacing:1 }}>COMBO</div>
              <div style={{ fontSize:16, fontWeight:900, color:combo>=10?C.orange:combo>=5?C.gold:C.text, animation:combo>=10?'countPulse 0.5s infinite':'none' }}>{combo}x {rpComboFire}</div>
              {rpMult > 1 && <div style={{ fontSize:8, color:C.cyan, fontWeight:800 }}>x{rpMult} MULT</div>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
              <div style={{ fontSize:9, color:C.text3, fontWeight:700, letterSpacing:1 }}>MISS</div>
              <div style={{ display:'flex', gap:2 }}>{[...Array(15)].map((_,i) => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:i<misses?C.red:`${C.text3}30`, boxShadow:i<misses?`0 0 4px ${C.red}`:'' }}/>)}</div>
            </div>
          </div>

          {/* Game court */}
          <div style={{ position:'relative', width:'100%', maxWidth:340, flex:1, maxHeight:420, overflow:'hidden', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,.3)' }}>
            {/* Lane backgrounds */}
            {RP_LANES.map((_,li) => <div key={li} style={{ position:'absolute', left:`${li*25}%`, top:0, width:'25%', height:'100%', background:`linear-gradient(180deg,${RP_LANE_COLORS[li]}03,${RP_LANE_COLORS[li]}06 80%,${RP_LANE_COLORS[li]}15)`, borderRight:li<3?'1px solid rgba(255,255,255,.04)':'none' }}/>)}

            {/* Hit zone indicators */}
            <div style={{ position:'absolute', left:0, right:0, top:`${RP_HIT_ZONE-2}%`, height:'4%', zIndex:8, display:'flex' }}>
              {RP_LANES.map((_,li) => (
                <div key={li} style={{ flex:1, position:'relative' }}>
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,transparent,${RP_LANE_COLORS[li]}${rpBeatPulse?'40':'20'},transparent)`, boxShadow:`0 0 ${rpBeatPulse?15:8}px ${RP_LANE_COLORS[li]}30`, transition:'all .15s ease' }}/>
                  <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%) rotate(45deg)', width:10, height:10, border:`2px solid ${RP_LANE_COLORS[li]}60`, borderRadius:2 }}/>
                </div>
              ))}
            </div>

            {/* Notes */}
            {notes.filter(n => !n.hit).map(n => {
              const nc = RP_LANE_COLORS[n.lane]
              const nh = n.y > RP_HIT_ZONE - 15
              return (
                <div key={n.id} style={{ position:'absolute', left:`${n.lane*25+7}%`, top:`${n.y}%`, width:'11%', height:14, borderRadius:7, zIndex:6, background:`linear-gradient(135deg,${nc},${nc}CC)`, boxShadow:`0 0 ${nh?16:8}px ${nc}${nh?'80':'40'}`, transform:nh?'scale(1.1)':'scale(1)' }}>
                  <div style={{ position:'absolute', inset:2, borderRadius:5, background:'radial-gradient(circle, rgba(255,255,255,.4), transparent)' }}/>
                </div>
              )
            })}

            {/* Particles */}
            {particles.map(p => <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, borderRadius:'50%', background:p.color, boxShadow:`0 0 6px ${p.color}`, zIndex:12, pointerEvents:'none', animation:'rpParticleBurst 0.6s ease-out forwards' }}/>)}

            {/* Rating popup */}
            {rating && (
              <div style={{ position:'absolute', left:`${(rating.lane||0)*25+12.5}%`, top:`${RP_HIT_ZONE-12}%`, transform:'translateX(-50%)', zIndex:15, animation:'rpRatingPop 0.6s ease forwards', textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:900, color:rating.color, letterSpacing:2, textShadow:`0 0 10px ${rating.color}` }}>{rating.text}</div>
              </div>
            )}

            {/* Lane labels */}
            {RP_LANES.map((lane,li) => <div key={'ll'+li} style={{ position:'absolute', left:`${li*25}%`, bottom:2, width:'25%', textAlign:'center', fontSize:14, opacity:.4, zIndex:7 }}>{lane}</div>)}

            {/* Crowd at bottom */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:45, zIndex:5, overflow:'hidden', pointerEvents:'none' }}>
              {[...Array(20)].map((_,i) => <div key={'cr'+i} style={{ position:'absolute', bottom:crowdJump&&i%3===0?6:0, left:`${i*5+Math.sin(i)*2}%`, width:14+i%5, height:20+i%8, borderRadius:'8px 8px 0 0', background:`rgba(${30+i*3},${10+i*2},${40+i*4},.8)`, transition:'bottom 0.15s ease' }}/>)}
            </div>
          </div>

          {/* Lane tap buttons */}
          <div style={{ display:'flex', gap:4, marginTop:4, width:'100%', maxWidth:340, zIndex:20 }}>
            {RP_LANES.map((lane,li) => (
              <div key={li} onClick={() => { if (phase==='playing') rpHitNote(li) }} onTouchStart={(e) => { e.preventDefault(); if (phase==='playing') rpHitNote(li) }} style={{ flex:1, padding:'10px 0', borderRadius:12, cursor:'pointer', textAlign:'center', background:`${RP_LANE_COLORS[li]}12`, border:`2px solid ${RP_LANE_COLORS[li]}35`, fontSize:20, userSelect:'none', WebkitUserSelect:'none', boxShadow:`0 0 12px ${RP_LANE_COLORS[li]}15` }}>{lane}</div>
            ))}
          </div>

          {/* Puff + Blinker buttons */}
          {phase === 'playing' && (
            <div style={{ display:'flex', gap:6, marginTop:4, width:'100%', maxWidth:340, zIndex:20 }}>
              <div onClick={rpPuffHit} onTouchStart={(e) => { e.preventDefault(); rpPuffHit() }} style={{ flex:1, padding:'10px 0', borderRadius:12, cursor:'pointer', textAlign:'center', background:`${C.cyan}12`, border:`2px solid ${C.cyan}35`, fontSize:13, fontWeight:800, color:C.cyan, userSelect:'none', WebkitUserSelect:'none' }}>💨 PUFF</div>
              <div onClick={rpBlinkerPuff} onTouchStart={(e) => { e.preventDefault(); rpBlinkerPuff() }} style={{ flex:1, padding:'10px 0', borderRadius:12, cursor:'pointer', textAlign:'center', background:blinker?`${C.pink}25`:`${C.pink}10`, border:`2px solid ${blinker?C.pink:C.pink+'35'}`, fontSize:13, fontWeight:800, color:C.pink, userSelect:'none', WebkitUserSelect:'none', opacity:blinker?.5:1 }}>🫁 BLINKER</div>
            </div>
          )}

          {comment && (
            <div style={{ marginTop:4, padding:'4px 14px', borderRadius:10, maxWidth:340, textAlign:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:combo>=10?C.gold:combo>=5?C.orange:C.text, lineHeight:1.3 }}>{comment}</div>
            </div>
          )}

          {/* Result overlay */}
          {phase === 'result' && (
            <div style={{ position:'absolute', inset:0, zIndex:30, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(5,5,16,.85)', backdropFilter:'blur(10px)', animation:'fadeIn 0.5s ease' }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:score>500?C.gold:C.purple, marginBottom:8 }}>{score>500?'ENCORE!':'SHOW OVER'}</div>
              <div style={{ fontSize:36, fontWeight:900, color:C.gold }}>{score.toLocaleString()}</div>
              <div style={{ fontSize:11, color:C.text2, marginTop:4 }}>points</div>
              <div style={{ display:'flex', gap:20, marginTop:12 }}>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:18, fontWeight:900, color:C.orange }}>{maxCombo}x</div><div style={{ fontSize:9, color:C.text3 }}>MAX COMBO</div></div>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:18, fontWeight:900, color:C.red }}>{misses}</div><div style={{ fontSize:9, color:C.text3 }}>MISSES</div></div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <div onClick={startGame} style={{ padding:'12px 28px', borderRadius:14, cursor:'pointer', background:`${C.purple}18`, border:`2px solid ${C.purple}40`, fontSize:14, fontWeight:800, color:C.purple }}>🔄 Again</div>
                <div onClick={endGame} style={{ padding:'12px 28px', borderRadius:14, cursor:'pointer', background:`${C.text3}10`, border:`1px solid ${C.text3}25`, fontSize:14, fontWeight:800, color:C.text3 }}>Done ✓</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
