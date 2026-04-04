import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

const SP_COMEDY = [
  "Round 1! Easy peasy!","Getting warmer! Can you remember?","3 puffs! Your short-term memory is being tested!",
  "4 in a row! Not bad for someone who's probably baked!","5 puffs! Simon is impressed!","6?! Your brain is on FIRE!",
  "7 puffs! Are you even human?!","8! This is INSANE! The crowd can't believe it!",
  "9 PUFFS! You're a LEGEND!","10! SIMON MASTER! You've beaten the game!",
]

const spGetPuffType = (dur: number): 'short' | 'medium' | 'long' => {
  if (dur < 1.2) return 'short'
  if (dur < 3.0) return 'medium'
  return 'long'
}
const spTypeColor = (t: string) => t === 'short' ? C.cyan : t === 'medium' ? C.gold : C.pink
const spTypeLabel = (t: string) => t === 'short' ? 'SHORT' : t === 'medium' ? 'MEDIUM' : 'LONG'

interface PatternItem { type: 'short' | 'medium' | 'long'; duration: number }

export default function SimonPuffs() {
  const navigate = useNavigate()
  const { playFx, awardGame, registerPuffHandlers } = useArena()

  const spPuffStart = useRef<number>(0)
  const spPuffInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [phase, setPhase] = useState<string | null>(null)
  const [pattern, setPattern] = useState<PatternItem[]>([])
  const [playerPattern, setPlayerPattern] = useState<PatternItem[]>([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [currentShow, setCurrentShow] = useState(-1)
  const [puffing, setPuffing] = useState(false)
  const [puffTime, setPuffTime] = useState(0)
  const [comment, setComment] = useState('')
  const [introStep, setIntroStep] = useState(0)
  const [playersLeft, setPlayersLeft] = useState(50)
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState<string|null>(null)

  // Refs for stale-closure-safe BLE handlers
  const phaseRef = useRef(phase)
  const puffingRef = useRef(puffing)
  const patternRef = useRef(pattern)
  const playerPatternRef = useRef(playerPattern)
  const roundRef = useRef(round)
  const scoreRef = useRef(score)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { puffingRef.current = puffing }, [puffing])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { playerPatternRef.current = playerPattern }, [playerPattern])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { scoreRef.current = score }, [score])

  const triggerFlash = useCallback((type: string) => { setScreenFlash(type); setTimeout(() => setScreenFlash(null), 400) }, [])

  // Forward-declare spStartRound to handle circular reference
  const spStartRoundRef = useRef<(roundNum: number, prevPattern: PatternItem[], prevScore: number) => void>(() => {})

  const spEndPuff = useCallback(() => {
    if (!puffingRef.current) return
    if (spPuffInterval.current) { clearInterval(spPuffInterval.current); spPuffInterval.current = null }
    const dur = (Date.now() - spPuffStart.current) / 1000
    setPuffing(false); setPuffTime(0)
    const puffType = spGetPuffType(dur)
    const newPlayerPattern = [...playerPatternRef.current, { type: puffType, duration: dur }]
    setPlayerPattern(newPlayerPattern)
    const idx = newPlayerPattern.length - 1
    const curPattern = patternRef.current
    if (curPattern[idx] && puffType === curPattern[idx].type) {
      playFx('crowd')
      if (newPlayerPattern.length === curPattern.length) {
        const currentRound = roundRef.current
        const roundScore = currentRound * 100
        const newScore = scoreRef.current + roundScore
        setScore(newScore)
        setPhase('judging')
        triggerFlash('goal')
        setComment('Perfect memory! +' + roundScore + ' points!')
        setPlayersLeft(p => Math.max(1, Math.floor(p * (0.6 + Math.random() * 0.2))))
        playFx('goal')
        setTimeout(() => {
          if (currentRound >= 10) {
            setPhase('final')
            playFx('win')
          } else {
            spStartRoundRef.current(currentRound + 1, curPattern, newScore)
          }
        }, 2200)
      } else {
        setComment((curPattern.length - newPlayerPattern.length) + ' more to go...')
      }
    } else {
      setPhase('eliminated')
      playFx('error')
      triggerFlash('miss')
      setScreenShake(true); setTimeout(() => setScreenShake(false), 400)
      const expected = curPattern[idx] ? curPattern[idx].type : '???'
      setComment('Eliminated at Round ' + roundRef.current + '! Expected ' + expected + ', you puffed ' + puffType + '.')
    }
  }, [playFx, triggerFlash])

  const spStartPuff = useCallback(() => {
    if (phaseRef.current !== 'input' || puffingRef.current) return
    setPuffing(true); setPuffTime(0)
    spPuffStart.current = Date.now()
    if (spPuffInterval.current) clearInterval(spPuffInterval.current)
    spPuffInterval.current = setInterval(() => {
      setPuffTime((Date.now() - spPuffStart.current) / 1000)
    }, 50)
  }, [])

  const spStartRound = useCallback((roundNum: number, prevPattern: PatternItem[], prevScore: number) => {
    const types: ('short'|'medium'|'long')[] = ['short', 'medium', 'long']
    const newType = types[Math.floor(Math.random() * 3)]
    const newPattern: PatternItem[] = [...prevPattern, { type: newType, duration: newType==='short'?0.6:newType==='medium'?1.8:3.2 }]
    setPattern(newPattern)
    patternRef.current = newPattern
    setRound(roundNum)
    roundRef.current = roundNum
    setPlayerPattern([])
    playerPatternRef.current = []
    setPhase('showing')
    setCurrentShow(-1)
    setComment(SP_COMEDY[Math.min(roundNum - 1, SP_COMEDY.length - 1)])
    playFx('select')

    let delay = 600
    newPattern.forEach((p, idx) => {
      setTimeout(() => {
        setCurrentShow(idx)
        playFx(p.type === 'short' ? 'pattern_tone_1' : p.type === 'medium' ? 'pattern_tone_2' : 'pattern_tone_3')
      }, delay)
      const showDur = p.type === 'short' ? 600 : p.type === 'medium' ? 1200 : 2000
      delay += showDur + 400
      setTimeout(() => { setCurrentShow(-1) }, delay - 400)
    })
    setTimeout(() => {
      setPhase('input')
      phaseRef.current = 'input'
      setCurrentShow(-1)
      setComment('Your turn! Repeat the pattern! ' + newPattern.length + ' puffs.')
    }, delay + 200)
  }, [playFx])

  useEffect(() => { spStartRoundRef.current = spStartRound }, [spStartRound])

  const startGame = useCallback(() => {
    setPhase('intro'); setPattern([]); setPlayerPattern([]); setRound(0); setScore(0)
    scoreRef.current = 0
    setCurrentShow(-1); setPuffing(false); setPuffTime(0); setComment('')
    setIntroStep(0); setPlayersLeft(Math.floor(30 + Math.random() * 70))
    playFx('crowd')
    setTimeout(() => setIntroStep(1), 400)
    setTimeout(() => setIntroStep(2), 1000)
    setTimeout(() => setIntroStep(3), 1800)
    setTimeout(() => { setIntroStep(4); playFx('whistle') }, 2600)
    setTimeout(() => { spStartRound(1, [], 0) }, 3400)
  }, [playFx, spStartRound])

  const endGame = useCallback(() => {
    if (spPuffInterval.current) { clearInterval(spPuffInterval.current); spPuffInterval.current = null }
    const won = roundRef.current >= 5
    awardGame({ won, baseCoins: won ? 50 : 8, baseXP: won ? 20 : 8 })
    navigate('/arcade')
  }, [awardGame, navigate])

  useEffect(() => {
    registerPuffHandlers(spStartPuff, spEndPuff)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, spStartPuff, spEndPuff])

  useEffect(() => () => {
    if (spPuffInterval.current) clearInterval(spPuffInterval.current)
  }, [])

  const isShowing = phase === 'showing'
  const isInputPhase = phase === 'input'
  const puffTypeNow = puffTime < 1.0 ? 'short' : puffTime < 2.5 ? 'medium' : 'long'

  if (!phase) {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, background:'linear-gradient(180deg, #0a0018, #1a0040, #120028)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ fontSize:48 }}>🎭</div>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:C.purple, textShadow:`0 0 20px rgba(192,132,252,0.5)` }}>SIMON PUFFS</div>
        <div style={{ fontSize:13, color:C.text2, textAlign:'center', maxWidth:280 }}>Watch the pattern, then repeat it!<br/>SHORT (&lt;1.2s) · MEDIUM (&lt;3.0s) · LONG</div>
        <div onClick={startGame} style={{ padding:'14px 36px', borderRadius:14, cursor:'pointer', background:`${C.purple}18`, border:`2px solid ${C.purple}50`, fontSize:16, fontWeight:900, color:C.purple }}>🔴 PLAY</div>
        <div onClick={() => navigate('/arcade')} style={{ fontSize:12, color:C.text3, cursor:'pointer', marginTop:8 }}>← Back</div>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:100, overflow:'hidden', background:'linear-gradient(180deg, #0a0018 0%, #1a0040 30%, #120028 60%, #050010 100%)', animation:screenShake?'shake 0.4s ease':'none' }}>
      {screenFlash && <div style={{ position:'absolute', inset:0, zIndex:200, pointerEvents:'none', opacity:0, background:screenFlash==='goal'?'rgba(160,80,255,0.3)':'rgba(255,50,50,0.2)', animation:'flashOverlay 0.4s ease forwards' }}/>}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 20%, rgba(160,80,255,.15) 0%, transparent 60%)', pointerEvents:'none' }}/>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', maxWidth:380, width:'100%', padding:'50px 16px 16px', gap:8, zIndex:10, margin:'0 auto', height:'100%' }}>
        {/* Header */}
        <div style={{ fontSize:16, fontWeight:900, letterSpacing:4, color:C.purple, textShadow:'0 0 20px rgba(192,132,252,.5)' }}>🎭 SIMON PUFFS</div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:9, color:C.text3, fontWeight:700 }}>ROUND</div><div style={{ fontSize:18, fontWeight:900, color:C.purple }}>{round}</div></div>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:9, color:C.text3, fontWeight:700 }}>SCORE</div><div style={{ fontSize:18, fontWeight:900, color:C.gold }}>{score}</div></div>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:9, color:C.text3, fontWeight:700 }}>PLAYERS</div><div style={{ fontSize:18, fontWeight:900, color:C.cyan }}>{playersLeft}</div></div>
          <div onClick={() => navigate('/arcade')} style={{ padding:'4px 8px', borderRadius:6, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', fontSize:10, color:C.text3 }}>✕</div>
        </div>

        {/* Intro */}
        {phase === 'intro' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.5s ease' }}>
            {introStep >= 1 && <div style={{ fontSize:28, marginBottom:8, animation:'goalBurst 0.6s ease both' }}>🎭</div>}
            {introStep >= 2 && <div style={{ fontSize:22, fontWeight:900, color:C.purple, textShadow:'0 0 20px rgba(192,132,252,.5)', letterSpacing:4, animation:'goalBurst 0.6s ease both' }}>SIMON PUFFS</div>}
            {introStep >= 3 && (
              <div style={{ display:'flex', gap:12, marginTop:16, animation:'fadeIn 0.5s ease both' }}>
                {(['short','medium','long'] as const).map((type, i) => (
                  <div key={i} style={{ padding:'8px 16px', borderRadius:10, background:`${spTypeColor(type)}15`, border:`1px solid ${spTypeColor(type)}30`, textAlign:'center' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:spTypeColor(type) }}>{spTypeLabel(type)}</div>
                    <div style={{ fontSize:9, color:C.text3 }}>{type==='short'?'<1.2s':type==='medium'?'<3.0s':'>3.0s'}</div>
                  </div>
                ))}
              </div>
            )}
            {introStep >= 4 && <div style={{ fontSize:24, fontWeight:900, color:C.gold, marginTop:16, letterSpacing:4, animation:'duelCountdownPop 0.6s ease both' }}>GET READY!</div>}
          </div>
        )}

        {/* Pattern display + Input */}
        {(isShowing || isInputPhase || phase === 'judging') && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', gap:12 }}>
            <div style={{ width:'100%', maxWidth:340 }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.text3, letterSpacing:2, marginBottom:6, textAlign:'center' }}>
                {isShowing ? 'WATCH THE PATTERN' : 'YOUR TURN'}
              </div>
              <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                {pattern.map((p, i) => {
                  const col = spTypeColor(p.type)
                  const active = isShowing && currentShow === i
                  const matched = !isShowing && playerPattern[i] && playerPattern[i].type === p.type
                  const wrong = !isShowing && playerPattern[i] && playerPattern[i].type !== p.type
                  return (
                    <div key={i} style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:active?`${col}40`:matched?`${C.green}25`:wrong?`${C.red}25`:`${col}10`, border:`2px solid ${active?col:matched?C.green+'60':wrong?C.red+'60':col+'25'}`, transition:'all 0.2s ease', transform:active?'scale(1.15)':'scale(1)', boxShadow:active?`0 0 20px ${col}60`:'none' }}>
                      <div style={{ fontSize:10, fontWeight:900, color:active?col:matched?C.green:wrong?C.red:`${col}80` }}>
                        {isShowing && !active ? '?' : spTypeLabel(p.type)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {isInputPhase && (
              <div style={{ width:'100%', maxWidth:340, marginTop:8 }}>
                <div style={{ fontSize:10, fontWeight:800, color:C.cyan, letterSpacing:2, marginBottom:6, textAlign:'center' }}>YOUR PATTERN ({playerPattern.length}/{pattern.length})</div>
                <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', minHeight:44 }}>
                  {playerPattern.map((p,i) => {
                    const col = spTypeColor(p.type)
                    const correct = pattern[i] && p.type === pattern[i].type
                    return (
                      <div key={i} style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:correct?`${C.green}20`:`${C.red}20`, border:`2px solid ${correct?C.green+'50':C.red+'50'}`, animation:'goalBurst 0.3s ease both' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:correct?C.green:C.red }}>{spTypeLabel(p.type)}</div>
                      </div>
                    )
                  })}
                  {puffing && (
                    <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${spTypeColor(puffTypeNow)}30`, border:`2px solid ${spTypeColor(puffTypeNow)}`, animation:'pulse 0.5s infinite' }}>
                      <div style={{ fontSize:9, fontWeight:900, color:spTypeColor(puffTypeNow) }}>{puffTime.toFixed(1)}s</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isInputPhase && puffing && (
              <div style={{ width:'100%', maxWidth:300, marginTop:8 }}>
                <div style={{ height:20, borderRadius:10, background:'rgba(255,255,255,.06)', overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${Math.min(puffTime/4,1)*100}%`, borderRadius:10, background:`linear-gradient(90deg,${C.cyan},${C.gold},${C.pink})`, transition:'width 0.05s linear' }}/>
                  <div style={{ position:'absolute', left:'25%', top:0, bottom:0, width:1, background:`${C.cyan}40` }}/>
                  <div style={{ position:'absolute', left:'62.5%', top:0, bottom:0, width:1, background:`${C.gold}40` }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                  <div style={{ fontSize:8, color:C.cyan, fontWeight:700 }}>SHORT</div>
                  <div style={{ fontSize:8, color:C.gold, fontWeight:700 }}>MEDIUM</div>
                  <div style={{ fontSize:8, color:C.pink, fontWeight:700 }}>LONG</div>
                </div>
              </div>
            )}

            {isInputPhase && (
              <div
                onMouseDown={spStartPuff} onMouseUp={spEndPuff} onMouseLeave={spEndPuff}
                onTouchStart={(e) => { e.preventDefault(); spStartPuff() }} onTouchEnd={(e) => { e.preventDefault(); spEndPuff() }}
                style={{ padding:'16px 40px', borderRadius:16, cursor:'pointer', textAlign:'center', userSelect:'none', WebkitUserSelect:'none', background:puffing?`${C.purple}30`:`${C.purple}15`, border:`2px solid ${puffing?C.purple:C.purple+'40'}`, fontSize:16, fontWeight:900, color:C.purple, marginTop:8, boxShadow:puffing?`0 0 30px ${C.purple}40`:'none', transform:puffing?'scale(1.05)':'scale(1)', transition:'all 0.15s ease' }}
              >
                {puffing ? `REPEATING... ${puffTime.toFixed(1)}s` : 'Hold to puff · Match the type 🔴'}
              </div>
            )}
          </div>
        )}

        {/* Eliminated */}
        {phase === 'eliminated' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.5s ease' }}>
            <div style={{ fontSize:48, marginBottom:8, animation:'shake 0.5s ease' }}>💥</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.red, letterSpacing:4, textShadow:'0 0 20px rgba(255,50,50,.5)' }}>ELIMINATED!</div>
            <div style={{ fontSize:13, color:C.text2, marginTop:8 }}>You survived {round} round{round !== 1 ? 's' : ''}</div>
            <div style={{ fontSize:18, fontWeight:900, color:C.gold, marginTop:8 }}>{score} points</div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <div onClick={startGame} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:`${C.purple}15`, border:`1px solid ${C.purple}30`, fontSize:13, fontWeight:800, color:C.purple }}>Try Again</div>
              <div onClick={endGame} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:`${C.text3}10`, border:`1px solid ${C.text3}20`, fontSize:13, fontWeight:800, color:C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {/* Final — Simon Master */}
        {phase === 'final' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.5s ease' }}>
            <div style={{ fontSize:48, marginBottom:8, animation:'countPulse 1s infinite' }}>🏆</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.gold, letterSpacing:4, textShadow:'0 0 20px rgba(255,215,0,.5)' }}>SIMON MASTER!</div>
            <div style={{ fontSize:13, color:C.text2, marginTop:8 }}>All 10 rounds completed!</div>
            <div style={{ fontSize:24, fontWeight:900, color:C.gold, marginTop:8 }}>{score} points</div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <div onClick={startGame} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:`${C.purple}15`, border:`1px solid ${C.purple}30`, fontSize:13, fontWeight:800, color:C.purple }}>Play Again</div>
              <div onClick={endGame} style={{ padding:'12px 24px', borderRadius:12, cursor:'pointer', background:`${C.text3}10`, border:`1px solid ${C.text3}20`, fontSize:13, fontWeight:800, color:C.text3 }}>Done</div>
            </div>
          </div>
        )}

        {/* Comment bar */}
        {comment && (
          <div style={{ padding:'6px 16px', borderRadius:10, maxWidth:340, textAlign:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', marginTop:'auto' }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.text, lineHeight:1.3 }}>{comment}</div>
          </div>
        )}
      </div>
    </div>
  )
}
