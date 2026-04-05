import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const DUEL_OPPONENTS = [
  {name:"Sheriff Puffington",emoji:"🤠",rank:"#1",record:"420-69",taunt:"This town ain't big enough for the two of us",speed:450},
  {name:"Quick Draw McGraw",emoji:"🔫",rank:"#3",record:"380-88",taunt:"0.2 seconds is all I need",speed:380},
  {name:"Cactus Jack",emoji:"🌵",rank:"#7",record:"301-120",taunt:"Prickly and fast",speed:420},
  {name:"Dusty Rhodes",emoji:"🏜️",rank:"#12",record:"250-140",taunt:"Faster than a tumbleweed in a tornado",speed:500},
  {name:"Dynamite Dan",emoji:"🧨",rank:"#5",record:"350-95",taunt:"BOOM. Already drew.",speed:400},
  {name:"Whiskey Wilma",emoji:"🥃",rank:"#15",record:"220-160",taunt:"I shoot straighter when I'm drunk",speed:550},
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

interface RoundResult { win: boolean; foul: boolean; you: number; ai: number; bonus: string|null; bonusCoins: number; puffDur: number }
interface DuelResult { win?: boolean; foul?: boolean; you?: number; ai?: number; puffDur?: number; bonus?: string|null; bonusCoins?: number; bonusLabel?: string; timeout?: boolean }
interface DuelStats { fastestDraw: number; avgDraw: number; drawTimes: number[]; wins: number; fouls: number; streak: number }

export default function WildWest() {
  const navigate = useNavigate()
  const { playFx, awardGame, registerPuffHandlers, setCoins } = useArena()

  const duelOpponentRef = useRef(DUEL_OPPONENTS[0])
  const duelDrawTime = useRef<number | null>(null)
  const duelReactionTime = useRef<number | null>(null)
  const duelPuffStart = useRef<number | null>(null)
  const duelPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const duelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duelSteadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duelExpectedDrawTime = useRef<number | null>(null)

  const [phase, setPhase] = useState<string>('menu')
  const [introStage, setIntroStage] = useState<string|null>(null)
  const [introCount, setIntroCount] = useState(3)
  const [opponent, setOpponent] = useState(DUEL_OPPONENTS[0])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState({ you: 0, ai: 0 })
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [result, setResult] = useState<DuelResult|null>(null)
  const [firedShot, setFiredShot] = useState(false)
  const [puffing, setPuffing] = useState(false)
  const [puffMeter, setPuffMeter] = useState(0)
  const [muzzleFlash, setMuzzleFlash] = useState<'left'|'right'|null>(null)
  const [staredownStage, setStaredownStage] = useState(0)
  const [staredownText, setStaredownText] = useState('')
  const [tumbleweed, setTumbleweed] = useState(false)
  const [dustParticles, setDustParticles] = useState<{id:number;x:number;y:number;size:number;dur:number}[]>([])
  const [countdown, setCountdown] = useState<number|string|null>(null)
  const [stats, setStats] = useState<DuelStats>({ fastestDraw:999, avgDraw:0, drawTimes:[], wins:0, fouls:0, streak:0 })
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<string|null>(null)

  const triggerShake = useCallback(() => { setScreenShake(true); setTimeout(() => setScreenShake(false), 400) }, [])
  const triggerFlash = useCallback((type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }, [])

  const getAiDrawSpeed = useCallback((roundNum: number) => {
    const opp = duelOpponentRef.current
    return Math.max(280, Math.floor(opp.speed - roundNum * (15 + Math.random() * 10) + (Math.random() - 0.5) * 80))
  }, [])

  const handleDuelRoundEnd = useCallback((win: boolean, wasFoul: boolean, res: DuelResult, currentRound: number, currentScore: {you:number;ai:number}, currentResults: RoundResult[]) => {
    const newResults: RoundResult[] = [...currentResults, { win, foul: wasFoul, you: res.you||0, ai: res.ai||0, bonus: res.bonus||null, bonusCoins: res.bonusCoins||0, puffDur: res.puffDur||0 }]
    setRoundResults(newResults)
    const newScore = { ...currentScore }
    if (win) newScore.you++; else newScore.ai++
    setScore(newScore)

    setTimeout(() => {
      if (newScore.you >= 3 || newScore.ai >= 3) {
        setPhase('final')
        if (newScore.you >= 3) {
          playFx('win'); playFx('crowd')
          awardGame({ won: true, baseCoins: 80, baseXP: 20 })
          setStats(s => ({ ...s, wins: s.wins + 1, streak: s.streak + 1 }))
        } else {
          playFx('lose')
          awardGame({ won: false, baseCoins: 12, baseXP: 8 })
          setStats(s => ({ ...s, streak: 0 }))
        }
      } else {
        setPhase('round_result')
        setTimeout(() => {
          const nextRound = currentRound + 1
          setRound(nextRound)
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          startDuelRoundFn(nextRound, newScore, newResults)
        }, 2500)
      }
    }, 1800)
  }, [playFx, awardGame])

  // Use a ref for startDuelRound to avoid circular dependencies
  const startDuelRoundFnRef = useRef<(roundNum: number, cs: {you:number;ai:number}, cr: RoundResult[]) => void>(() => {})

  const startDuelRoundFn = useCallback((roundNum: number, currentScore: {you:number;ai:number}, currentResults: RoundResult[]) => {
    setFiredShot(false); setResult(null); setPuffing(false); setPuffMeter(0)
    setMuzzleFlash(null); setStaredownStage(0); setStaredownText('')
    duelDrawTime.current = null; duelReactionTime.current = null
    setTumbleweed(Math.random() > 0.5)
    setDustParticles(Array.from({length:8},(_,i)=>({id:Date.now()+i, x:Math.random()*100, y:55+Math.random()*35, size:2+Math.random()*5, dur:3+Math.random()*4})))

    setPhase('countdown'); setCountdown(3); playFx('tap')
    setTimeout(() => { setCountdown(2); playFx('tap') }, 900)
    setTimeout(() => { setCountdown(1); playFx('select') }, 1800)
    setTimeout(() => { setCountdown('DRAW!'); playFx('whistle'); triggerFlash('save') }, 2700)

    setTimeout(() => {
      setCountdown(null); setPhase('staredown'); setStaredownStage(0)
      const tensionBase = 1500 + Math.random() * 3000 + roundNum * 400
      duelExpectedDrawTime.current = Date.now() + 3200 + tensionBase

      duelSteadyTimerRef.current = setTimeout(() => {
        setStaredownStage(1)
        setStaredownText(pick(["Eyes locked... fingers twitching...","The saloon goes SILENT...","MAXIMUM TENSION...","CHAMPIONSHIP ROUND VIBES...","FINAL SHOWDOWN ENERGY..."]))
      }, tensionBase * 0.3)
      setTimeout(() => { setStaredownStage(2); setStaredownText('WHO WILL DRAW FIRST?') }, tensionBase * 0.6)
      setTimeout(() => { setStaredownStage(3); setStaredownText('...') }, tensionBase * 0.85)

      duelTimerRef.current = setTimeout(() => {
        setPhase('draw')
        duelDrawTime.current = Date.now()
        triggerShake(); triggerFlash('miss'); playFx('whistle')
        setStaredownText('')

        duelTimerRef.current = setTimeout(() => {
          if (duelDrawTime.current) {
            const aiSpeed = getAiDrawSpeed(roundNum)
            const timeoutResult: DuelResult = { win:false, you:5000, ai:aiSpeed, timeout:true, puffDur:0, bonus:null, bonusCoins:0 }
            setResult(timeoutResult); setPhase('result')
            duelDrawTime.current = null
            setFiredShot(true); setMuzzleFlash('right')
            setTimeout(() => setMuzzleFlash(null), 500)
            playFx('error')
            handleDuelRoundEnd(false, false, timeoutResult, roundNum, currentScore, currentResults)
          }
        }, 5000)
      }, tensionBase)
    }, 3200)
  }, [playFx, triggerFlash, triggerShake, getAiDrawSpeed, handleDuelRoundEnd])

  useEffect(() => { startDuelRoundFnRef.current = startDuelRoundFn }, [startDuelRoundFn])

  // Refs for stale closure prevention in BLE handlers
  const phaseRef = useRef(phase)
  const firedShotRef = useRef(firedShot)
  const puffingRef = useRef(puffing)
  const roundRef = useRef(round)
  const scoreRef = useRef(score)
  const resultsRef = useRef(roundResults)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { firedShotRef.current = firedShot }, [firedShot])
  useEffect(() => { puffingRef.current = puffing }, [puffing])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { resultsRef.current = roundResults }, [roundResults])

  const duelReleasePuff = useCallback(() => {
    if (!puffingRef.current) return
    setPuffing(false); setFiredShot(true)
    if (duelPuffInterval.current) { clearInterval(duelPuffInterval.current); duelPuffInterval.current = null }
    duelDrawTime.current = null

    const reactionMs = duelReactionTime.current || 999
    const puffDuration = duelPuffStart.current ? (Date.now() - duelPuffStart.current) / 1000 : 0
    const aiTime = getAiDrawSpeed(roundRef.current)
    const win = reactionMs < aiTime

    let bonus = 'basic'; let bonusCoins = 0; let bonusLabel = 'Basic Shot'
    if (puffDuration >= 4.5) { bonus='legendary'; bonusCoins=50; bonusLabel='LEGENDARY DRAW' }
    else if (puffDuration >= 2.0) { bonus='power'; bonusCoins=25; bonusLabel='Power Shot' }
    else if (puffDuration >= 0.8) { bonus='quick'; bonusCoins=10; bonusLabel='Quick Draw' }

    const res: DuelResult = { win, you:reactionMs, ai:aiTime, puffDur:puffDuration, bonus, bonusCoins, bonusLabel }
    setResult(res); setPhase('result'); playFx('gunshot')
    if (win) setMuzzleFlash('left'); else setMuzzleFlash('right')
    setTimeout(() => setMuzzleFlash(null), 600)

    setStats(s => {
      const times = [...s.drawTimes, reactionMs]
      return { ...s, fastestDraw:Math.min(s.fastestDraw,reactionMs), avgDraw:Math.round(times.reduce((a,b)=>a+b,0)/times.length), drawTimes:times }
    })
    if (win) { playFx('goal'); playFx('crowd'); triggerFlash('goal'); if (bonusCoins > 0) setCoins((c: number) => c + bonusCoins) }
    else { playFx('error'); triggerFlash('miss') }
    handleDuelRoundEnd(win, false, res, roundRef.current, scoreRef.current, resultsRef.current)
  }, [playFx, getAiDrawSpeed, triggerFlash, setCoins, handleDuelRoundEnd])

  const duelShoot = useCallback(() => {
    if (firedShotRef.current) return
    const curPhase = phaseRef.current
    const isTooEarly = (curPhase === 'staredown' || curPhase === 'countdown') &&
      !(duelExpectedDrawTime.current && (duelExpectedDrawTime.current - Date.now()) < 200)
    if (isTooEarly) {
      setFiredShot(true)
      if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
      if (duelSteadyTimerRef.current) clearTimeout(duelSteadyTimerRef.current)
      duelDrawTime.current = null
      const foulResult: DuelResult = { foul:true, bonusCoins:0 }
      setResult(foulResult); setPhase('result'); playFx('error'); triggerShake()
      setStats(s => ({ ...s, fouls:s.fouls+1 }))
      handleDuelRoundEnd(false, true, foulResult, roundRef.current, scoreRef.current, resultsRef.current)
      return
    }
    if (curPhase === 'draw' && duelDrawTime.current) {
      const reactionMs = Date.now() - duelDrawTime.current
      duelReactionTime.current = reactionMs
      if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
      setPhase('puffing'); setPuffing(true); setPuffMeter(0)
      duelPuffStart.current = Date.now(); playFx('charge')
      duelPuffInterval.current = setInterval(() => {
        const elapsed = (Date.now() - duelPuffStart.current!) / 1000
        setPuffMeter(Math.min(100, elapsed / 4.5 * 100))
        if (elapsed >= 5.0) duelReleasePuff()
      }, 50)
    }
  }, [playFx, triggerShake, handleDuelRoundEnd, duelReleasePuff])

  const startDuel = useCallback(() => {
    const opp = pick(DUEL_OPPONENTS)
    duelOpponentRef.current = opp; setOpponent(opp)
    setRound(0); setScore({you:0,ai:0}); setRoundResults([]); setResult(null)
    setFiredShot(false); setPuffing(false); setPuffMeter(0); setMuzzleFlash(null)
    setStaredownStage(0); setStaredownText('')
    setPhase('intro'); setIntroStage('enter'); setIntroCount(3); playFx('crowd')
    setTimeout(() => setIntroStage('stats'), 1200)
    setTimeout(() => { setIntroStage('countdown'); setIntroCount(3); playFx('whistle') }, 2400)
    setTimeout(() => setIntroCount(2), 3100)
    setTimeout(() => setIntroCount(1), 3800)
    setTimeout(() => { setIntroStage('go'); triggerFlash('goal'); playFx('countdown_go'); playFx('crowd') }, 4500)
    setTimeout(() => { setIntroStage(null); setRound(0); startDuelRoundFn(0, {you:0,ai:0}, []) }, 5200)
  }, [playFx, triggerFlash, startDuelRoundFn])

  const resetDuel = useCallback(() => {
    if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
    if (duelSteadyTimerRef.current) clearTimeout(duelSteadyTimerRef.current)
    if (duelPuffInterval.current) clearInterval(duelPuffInterval.current)
    duelDrawTime.current = null; duelPuffStart.current = null; duelReactionTime.current = null
    setPhase('menu'); setRound(0); setScore({you:0,ai:0}); setResult(null)
    setRoundResults([]); setFiredShot(false); setIntroStage(null)
    setTumbleweed(false); setDustParticles([]); setPuffing(false)
    setPuffMeter(0); setMuzzleFlash(null); setStaredownStage(0); setStaredownText('')
  }, [])

  useEffect(() => {
    registerPuffHandlers(duelShoot, duelReleasePuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, duelShoot, duelReleasePuff])

  useEffect(() => () => {
    if (duelTimerRef.current) clearTimeout(duelTimerRef.current)
    if (duelSteadyTimerRef.current) clearTimeout(duelSteadyTimerRef.current)
    if (duelPuffInterval.current) clearInterval(duelPuffInterval.current)
  }, [])

  const isDrawPhase = phase === 'draw' || phase === 'puffing'
  const isTensionPhase = phase === 'staredown'
  const isCountdownPhase = phase === 'countdown'
  const wwSunsetIntensity = isTensionPhase ? 1.3 : isDrawPhase ? 1.8 : isCountdownPhase ? 1.1 : 1
  const puffMeterColor = puffMeter < 20 ? C.text3 : puffMeter < 45 ? C.cyan : puffMeter < 70 ? C.gold : puffMeter < 90 ? C.orange : C.red

  const handleScreenTouch = useCallback(() => {
    if (['staredown','countdown','draw'].includes(phaseRef.current)) duelShoot()
  }, [duelShoot])
  const handleScreenRelease = useCallback(() => {
    if (phaseRef.current === 'puffing') duelReleasePuff()
  }, [duelReleasePuff])

  if (phase === 'menu') {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, background:'linear-gradient(180deg,#0a0515,#150a2e,#2d1b4e,#6b2fa0,#c04060,#e8875c,#f4a742,#8b4513)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ fontSize:48 }}>🤠</div>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:C.gold, textShadow:`0 0 20px ${C.gold}` }}>WILD WEST DUEL</div>
        <div style={{ fontSize:13, color:'rgba(210,170,120,0.8)', textAlign:'center', maxWidth:280 }}>First to 3 rounds wins!<br/>Hold to puff — release to shoot</div>
        <div onClick={startDuel} style={{ padding:'14px 36px', borderRadius:14, cursor:'pointer', background:`${C.gold}18`, border:`2px solid ${C.gold}50`, fontSize:16, fontWeight:900, color:C.gold }}>🔫 START DUEL</div>
        <div onClick={() => navigate('/arcade')} style={{ fontSize:12, color:C.text3, cursor:'pointer', marginTop:8 }}>← Back</div>
      </div>
    )
  }

  return (
    <div
      style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, overflow:'hidden', animation:screenShake?'shake 0.4s ease':'none', filter:isDrawPhase?'saturate(1.4) contrast(1.15)':'brightness(1)', transition:'filter 0.3s' }}
      onMouseDown={handleScreenTouch} onMouseUp={handleScreenRelease}
      onTouchStart={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; e.preventDefault(); handleScreenTouch() }}
      onTouchEnd={(e) => { if ((e.target as HTMLElement).closest('[data-btn]')) return; handleScreenRelease() }}
    >
      {screenFlash && <div style={{ position:'absolute', inset:0, zIndex:200, pointerEvents:'none', opacity:0, background:screenFlash==='goal'?'rgba(255,215,0,0.35)':screenFlash==='save'?'rgba(255,165,0,0.2)':'rgba(255,20,20,0.4)', animation:'flashOverlay 0.4s ease forwards' }}/>}

      {/* Sky + desert background */}
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg,#0a0515 0%,#150a2e ${8*wwSunsetIntensity}%,#2d1b4e ${16*wwSunsetIntensity}%,#6b2fa0 ${24*wwSunsetIntensity}%,#c04060 ${35*wwSunsetIntensity}%,#e8875c ${48*wwSunsetIntensity}%,#f4a742 ${62*wwSunsetIntensity}%,#c87533 ${78*wwSunsetIntensity}%,#8b4513 88%,#3d1f0a 100%)`, transition:'all 1s ease' }}/>
      {[...Array(20)].map((_,i) => <div key={'star'+i} style={{ position:'absolute', top:(1+Math.sin(i*1.3)*10)+'%', left:(3+i*4.8)+'%', width:i%4===0?3:2, height:i%4===0?3:2, borderRadius:'50%', background:`rgba(255,255,255,${0.2+Math.sin(i*0.7)*0.4})`, animation:`duelStar ${1.5+i%4}s ease-in-out infinite`, animationDelay:(i*0.2)+'s', pointerEvents:'none' }}/>)}
      <div style={{ position:'absolute', top:'3%', right:'10%', width:28, height:28, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, #f5eed8, #ddd0a8 40%, rgba(180,160,120,0.5) 70%, transparent)', opacity:wwSunsetIntensity<1.3?0.8:0.3, transition:'opacity 1s', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)', width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,50,0.9) 0%, rgba(255,140,50,0.5) 20%, rgba(255,100,30,0.2) 45%, transparent 65%)', filter:'blur(14px)', opacity:wwSunsetIntensity*0.55, transition:'opacity 1s', pointerEvents:'none' }}/>

      {/* Mountains */}
      <div style={{ position:'absolute', bottom:'28%', left:0, right:0, height:60, overflow:'hidden', pointerEvents:'none' }}>
        <svg viewBox="0 0 400 50" style={{ width:'100%', height:'100%', position:'absolute', bottom:0 }} preserveAspectRatio="none">
          <path d="M0,50 L0,38 L20,30 L40,35 L65,20 L80,28 L100,15 L120,25 L140,18 L160,30 L180,22 L200,12 L220,25 L240,18 L260,28 L280,15 L300,22 L320,30 L340,20 L360,28 L380,32 L400,25 L400,50 Z" fill="#1a0a08" opacity="0.6"/>
        </svg>
      </div>

      {/* Town */}
      <div style={{ position:'absolute', bottom:'24%', left:0, right:0, height:100, overflow:'hidden', pointerEvents:'none' }}>
        <svg viewBox="0 0 400 80" style={{ width:'100%', height:'100%', position:'absolute', bottom:0 }} preserveAspectRatio="none">
          <path d="M0,80 L0,55 L15,55 L15,40 L20,38 L25,40 L25,55 L40,55 L40,35 L44,28 L48,35 L48,55 L70,45 L70,30 L75,25 L80,30 L80,55 L95,50 L95,38 L99,55 L130,48 L130,55 L140,55 L140,30 L145,18 L150,30 L150,55 L185,35 L200,25 L215,35 L215,55 L250,38 L255,30 L260,38 L260,55 L300,35 L315,12 L320,20 L320,55 L365,40 L370,38 L375,40 L375,55 L400,50 L400,80 Z" fill="#1a0a05" opacity="0.95"/>
        </svg>
      </div>

      {/* Ground */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'24%', background:'linear-gradient(180deg, #8b4513 0%, #4a2008 60%, #2d1205 100%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'22%', left:'6%', fontSize:22, opacity:0.18, transform:'scaleX(-1)', pointerEvents:'none' }}>🌵</div>
      <div style={{ position:'absolute', bottom:'21%', right:'5%', fontSize:18, opacity:0.14, pointerEvents:'none' }}>🌵</div>
      <div style={{ position:'absolute', top:'14%', left:'20%', fontSize:14, opacity:0.25, animation:'wwVulture 12s linear infinite', pointerEvents:'none' }}>🦅</div>

      {tumbleweed && isTensionPhase && <div style={{ position:'absolute', bottom:'26%', left:0, fontSize:24, animation:'duelTumbleweed 6s linear infinite', opacity:0.5, pointerEvents:'none' }}>🌾</div>}
      {dustParticles.map(p => <div key={p.id} style={{ position:'absolute', left:p.x+'%', top:p.y+'%', width:p.size, height:p.size, borderRadius:'50%', background:'rgba(210,170,120,0.35)', animation:`duelDust ${p.dur}s ease-in-out infinite`, filter:'blur(1px)', pointerEvents:'none' }}/>)}

      {isDrawPhase && <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none', background:'rgba(180,0,0,0.15)', animation:'duelRedPulse 0.4s ease-in-out infinite' }}/>}
      {isTensionPhase && <div style={{ position:'absolute', inset:0, background:`rgba(180,20,0,${0.02+staredownStage*0.03})`, transition:'background 1s ease', pointerEvents:'none', zIndex:2 }}/>}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,${isTensionPhase?(0.5+staredownStage*0.12):isDrawPhase?0.9:0.35}) 100%)`, transition:'all 1s ease', pointerEvents:'none', zIndex:2 }}/>

      {/* ═══ INTRO OVERLAY ═══ */}
      {introStage && (
        <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(4,8,18,0.94)', backdropFilter:'blur(16px)', animation:'fadeIn 0.3s ease' }}>
          <div style={{ marginBottom:16, padding:'4px 18px', borderRadius:20, background:`${C.gold}12`, border:`1px solid ${C.gold}30` }}>
            <span style={{ fontSize:10, fontWeight:800, color:C.gold, letterSpacing:4 }}>HIGH NOON SHOWDOWN</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16 }}>
            <div style={{ textAlign:'center', animation:'slideInLeft 0.8s ease' }}>
              <div style={{ width:64, height:64, borderRadius:16, background:`${C.cyan}10`, border:`2px solid ${C.cyan}60`, margin:'0 auto 6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34 }}>😎</div>
              <div style={{ fontSize:14, fontWeight:900, color:C.cyan, letterSpacing:1 }}>STEVE</div>
              <div style={{ fontSize:8, color:C.text3 }}>Lv.24 Gunslinger</div>
            </div>
            <div style={{ textAlign:'center', minWidth:50 }}>
              {introStage === 'countdown' ? (
                <div style={{ fontSize:64, fontWeight:900, color:C.gold, textShadow:`0 0 50px ${C.gold}80`, animation:'duelCountdownPop 0.7s ease', lineHeight:1 }}>{introCount}</div>
              ) : introStage === 'go' ? (
                <div style={{ fontSize:28, fontWeight:900, color:C.green, animation:'duelCountdownPop 0.5s ease' }}>DUEL!</div>
              ) : (
                <div style={{ fontSize:28, fontWeight:900, color:C.gold, animation:'countPulse 1.5s infinite' }}>VS</div>
              )}
            </div>
            <div style={{ textAlign:'center', animation:'slideInRight 0.8s ease' }}>
              <div style={{ width:64, height:64, borderRadius:16, background:`${C.orange}10`, border:`2px solid ${C.orange}60`, margin:'0 auto 6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34 }}>{opponent.emoji}</div>
              <div style={{ fontSize:14, fontWeight:900, color:C.orange, letterSpacing:1 }}>{opponent.name.toUpperCase()}</div>
              <div style={{ fontSize:8, color:C.text3 }}>{opponent.rank} {opponent.record}</div>
            </div>
          </div>
          {['stats','countdown','go'].includes(introStage) && (
            <div style={{ fontSize:9, color:C.text2, fontStyle:'italic', maxWidth:260, textAlign:'center' }}>"{opponent.taunt}"</div>
          )}
          <div style={{ marginTop:12, fontSize:8, color:C.text3, letterSpacing:1 }}>120+ watching — Best of 5</div>
        </div>
      )}

      {/* ═══ MAIN GAME AREA ═══ */}
      <div style={{ position:'relative', zIndex:10, height:'100%', display:'flex', flexDirection:'column', pointerEvents:introStage?'none':'auto' }}>
        {/* Top bar */}
        <div style={{ padding:'44px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {[0,1,2,3,4].map(i => {
              const rr = roundResults[i]
              const isCurrent = i === round && !rr
              return (
                <div key={i} style={{ width:22, height:22, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, background:rr?(rr.win?`radial-gradient(circle,${C.green}40,${C.green}15)`:`radial-gradient(circle,${C.red}40,${C.red}15)`):isCurrent?`radial-gradient(circle,${C.gold}30,transparent)`:'radial-gradient(circle,rgba(60,40,20,0.6),rgba(40,25,10,0.3))', border:`2px solid ${rr?(rr.win?C.green+'80':C.red+'80'):isCurrent?C.gold+'80':'rgba(139,69,19,0.4)'}`, color:rr?(rr.win?C.green:C.red):isCurrent?C.gold:'rgba(139,69,19,0.6)' }}>
                  {rr ? (rr.win ? 'W' : rr.foul ? 'F' : 'L') : isCurrent ? (round+1) : ''}
                </div>
              )
            })}
            <span style={{ fontSize:8, color:'rgba(210,170,120,0.6)', marginLeft:4, fontWeight:700 }}>R{round+1}/5</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:12, background:'rgba(20,10,5,0.5)', border:'1px solid rgba(139,69,19,0.3)' }}>
            <span style={{ fontSize:15, fontWeight:900, color:C.cyan }}>{score.you}</span>
            <span style={{ fontSize:10, color:'rgba(139,69,19,0.6)', fontWeight:900 }}>:</span>
            <span style={{ fontSize:15, fontWeight:900, color:C.orange }}>{score.ai}</span>
          </div>
          <div data-btn onClick={(e) => { e.stopPropagation(); resetDuel(); navigate('/arcade') }} style={{ padding:'5px 10px', borderRadius:8, cursor:'pointer', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(139,69,19,0.3)', fontSize:10, color:C.text3 }}>✕</div>
        </div>

        {/* Duel arena */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', padding:'0 16px' }}>
          {isCountdownPhase && countdown && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:30, pointerEvents:'none' }}>
              {typeof countdown === 'number' ? (
                <div style={{ fontSize:100, fontWeight:900, color:C.gold, textShadow:`0 0 60px ${C.gold}80`, animation:'duelCountdownPop 0.8s ease', lineHeight:1, fontFamily:"'Georgia',serif" }}>{countdown}</div>
              ) : (
                <div style={{ fontSize:42, fontWeight:900, color:C.red, textShadow:`0 0 50px ${C.red}80`, animation:'duelCountdownPop 0.6s ease', lineHeight:1, letterSpacing:4 }}>{countdown}</div>
              )}
            </div>
          )}

          {/* Duelist silhouettes */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', width:'100%', maxWidth:340, marginBottom:10, position:'relative' }}>
            {/* Player left */}
            <div style={{ textAlign:'center', position:'relative', animation:isTensionPhase?'duelBreathe 2s ease-in-out infinite':'none' }}>
              <div style={{ fontSize:60, transform:result?.win?'scale(1.15)':result&&!result.win&&!result.foul?'rotate(-25deg) translateY(15px)':'scaleX(-1)', filter:`drop-shadow(0 8px 16px rgba(0,0,0,0.7)) drop-shadow(0 0 ${isTensionPhase?20:10}px ${C.cyan}50)`, transition:'all 0.5s ease' }}>😎</div>
              <div style={{ fontSize:10, fontWeight:900, color:C.cyan, marginTop:4, letterSpacing:1 }}>STEVE</div>
              {muzzleFlash === 'left' && <div style={{ position:'absolute', right:-15, top:'35%', width:30, height:30, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,50,0.9), rgba(255,100,0,0.6) 40%, transparent 70%)', animation:'duelMuzzle 0.3s ease-out forwards', pointerEvents:'none', zIndex:20 }}/>}
            </div>

            {/* Center */}
            <div style={{ textAlign:'center', flex:1, minHeight:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isTensionPhase && (
                <div style={{ animation:'fadeIn 0.5s ease', textAlign:'center' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:C.gold, opacity:0.4+staredownStage*0.15, letterSpacing:3 }}>{staredownStage < 1 ? '. . .' : '...'}</div>
                  {staredownText && <div style={{ fontSize:9, color:C.gold, opacity:0.7, marginTop:6, fontStyle:'italic' }}>{staredownText}</div>}
                  <div style={{ fontSize:8, color:C.red+'70', marginTop:8, letterSpacing:1 }}>PUFF BEFORE DRAW = FOUL</div>
                </div>
              )}
              {phase === 'draw' && (
                <div style={{ animation:'duelDrawFlash 0.15s ease' }}>
                  <div style={{ fontSize:44, fontWeight:900, color:C.red, textShadow:`0 0 50px ${C.red}`, animation:'countPulse 0.3s infinite', letterSpacing:5 }}>DRAW!</div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#fff', marginTop:8, animation:'countPulse 0.5s infinite', letterSpacing:2 }}>HOLD TO SHOOT! 🔫</div>
                </div>
              )}
              {phase === 'puffing' && (
                <div style={{ animation:'fadeIn 0.2s ease', width:'100%' }}>
                  <div style={{ fontSize:14, fontWeight:900, color:puffMeterColor, letterSpacing:2, marginBottom:10 }}>
                    {puffMeter<20?'DRAWING...':puffMeter<45?'QUICK DRAW':puffMeter<70?'POWER SHOT':puffMeter<90?'MEGA PUFF':'LEGENDARY!'}
                  </div>
                  <div style={{ width:'80%', maxWidth:200, margin:'0 auto', height:10, borderRadius:5, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ width:`${puffMeter}%`, height:'100%', borderRadius:5, background:puffMeterColor, transition:'width 0.05s' }}/>
                  </div>
                  <div style={{ fontSize:9, color:'#fff', marginTop:6, opacity:0.7 }}>Release to fire!</div>
                </div>
              )}
              {(phase === 'result' || phase === 'round_result') && result && (
                <div style={{ animation:'fadeIn 0.3s ease' }}>
                  {result.foul ? (
                    <div><div style={{ fontSize:28, fontWeight:900, color:C.red, letterSpacing:3 }}>FOUL!</div><div style={{ fontSize:9, color:C.text3, marginTop:4 }}>Drew too early! Round lost.</div></div>
                  ) : result.win ? (
                    <div>
                      <div style={{ fontSize:48, fontWeight:900, color:C.green, textShadow:`0 0 40px ${C.green}60`, lineHeight:1, animation:'duelCountdownPop 0.5s ease' }}>{result.you}ms</div>
                      <div style={{ fontSize:16, fontWeight:900, color:C.gold, marginTop:6, letterSpacing:2 }}>FASTER!</div>
                      <div style={{ fontSize:9, color:C.text3, marginTop:3 }}>vs AI {result.ai}ms</div>
                      {result.bonusCoins && result.bonusCoins > 0 ? <div style={{ marginTop:6, padding:'3px 10px', borderRadius:8, background:`${C.gold}15`, border:`1px solid ${C.gold}30`, display:'inline-block' }}><span style={{ fontSize:10, fontWeight:800, color:C.gold }}>{result.bonusLabel} +{result.bonusCoins}</span></div> : null}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:36, fontWeight:900, color:C.red, lineHeight:1 }}>{result.you}ms</div>
                      <div style={{ fontSize:16, fontWeight:900, color:C.red, marginTop:6, letterSpacing:2 }}>OUTDRAWN!</div>
                      <div style={{ fontSize:9, color:C.text3, marginTop:3 }}>AI drew at {result.ai}ms</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI right */}
            <div style={{ textAlign:'center', position:'relative', animation:isTensionPhase?'duelBreathe 2.2s ease-in-out infinite':'none' }}>
              <div style={{ fontSize:60, transform:result&&!result.win&&!result.foul?'scale(1.15)':result?.win?'rotate(25deg) translateY(15px)':'none', filter:`drop-shadow(0 8px 16px rgba(0,0,0,0.7)) drop-shadow(0 0 ${isTensionPhase?20:10}px ${C.orange}50)`, transition:'all 0.5s ease' }}>{opponent.emoji}</div>
              <div style={{ fontSize:10, fontWeight:900, color:C.orange, marginTop:4, letterSpacing:1 }}>{opponent.name.split(' ')[0].toUpperCase()}</div>
              {muzzleFlash === 'right' && <div style={{ position:'absolute', left:-15, top:'35%', width:30, height:30, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,50,0.9), rgba(255,100,0,0.6) 40%, transparent 70%)', animation:'duelMuzzle 0.3s ease-out forwards', pointerEvents:'none', zIndex:20 }}/>}
            </div>
          </div>
        </div>

        {/* ═══ FINAL RESULT ═══ */}
        {phase === 'final' && (
          <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:30 }}>
            <div style={{ textAlign:'center', padding:'16px 20px 24px', borderRadius:'16px 16px 0 0', background:'rgba(8,8,25,0.92)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', animation:'fadeIn 0.5s ease' }}>
              <div style={{ fontSize:40, marginBottom:4 }}>{score.you >= 3 ? '🏆' : '💀'}</div>
              <div style={{ fontSize:26, fontWeight:900, color:score.you>=3?C.gold:C.red, marginBottom:4, letterSpacing:3 }}>
                {score.you >= 3 ? 'FASTEST GUN!' : 'OUTDRAWN!'}
              </div>
              <div style={{ fontSize:13, color:C.text2, marginBottom:12 }}>Final Score: {score.you} - {score.ai}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:12, flexWrap:'wrap' }}>
                {roundResults.map((rr,i) => (
                  <div key={i} style={{ padding:'5px 8px', borderRadius:8, background:rr.win?`${C.green}12`:`${C.red}12`, border:`1px solid ${rr.win?C.green:C.red}25`, textAlign:'center', minWidth:52 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:rr.win?C.green:C.red }}>{rr.foul?'FOUL':rr.win?'WIN':'LOSS'}</div>
                    {!rr.foul && rr.you > 0 && <div style={{ fontSize:7, color:C.text3, marginTop:1 }}>{rr.you}ms</div>}
                    {rr.bonus && rr.bonusCoins > 0 && <div style={{ fontSize:6, color:C.gold, marginTop:1 }}>+{rr.bonusCoins} 🪙</div>}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-around', marginBottom:12, padding:'8px', borderRadius:10, background:'rgba(255,255,255,0.02)' }}>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:15, fontWeight:900, color:C.cyan }}>{stats.fastestDraw<999?stats.fastestDraw+'ms':'---'}</div><div style={{ fontSize:7, color:'rgba(210,170,120,0.5)' }}>Fastest</div></div>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:15, fontWeight:900, color:C.gold }}>{stats.avgDraw||'---'}{stats.avgDraw?'ms':''}</div><div style={{ fontSize:7, color:'rgba(210,170,120,0.5)' }}>Average</div></div>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:15, fontWeight:900, color:C.red }}>{stats.fouls}</div><div style={{ fontSize:7, color:'rgba(210,170,120,0.5)' }}>Fouls</div></div>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <div data-btn onClick={(e) => { e.stopPropagation(); resetDuel(); setTimeout(() => startDuel(), 50) }} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:`${C.gold}18`, border:`1px solid ${C.gold}40`, fontSize:14, fontWeight:800, color:C.gold }}>🔫 REMATCH</div>
                <div data-btn onClick={(e) => { e.stopPropagation(); resetDuel(); navigate('/arcade') }} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(139,69,19,0.3)', fontSize:14, fontWeight:700, color:C.text2 }}>Exit</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
