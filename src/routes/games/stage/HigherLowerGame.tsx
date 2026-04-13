import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader, pick } from './_shared'

interface Stat { topic: string; value: number; display: string }

// Direct lift from monolith line 2164
const HL_STATS: Stat[] = [
  { topic: "Monthly Google searches for 'cannabis'", value: 4500000, display: '4.5M' },
  { topic: 'Average price of 1g flower in California', value: 12, display: '$12' },
  { topic: 'Number of legal dispensaries in the US', value: 14000, display: '14,000' },
  { topic: 'Instagram posts tagged #420', value: 28000000, display: '28M' },
  { topic: 'Average blinker duration (seconds)', value: 5.2, display: '5.2s' },
  { topic: 'THC % in average dispensary flower', value: 22, display: '22%' },
  { topic: "Snoop Dogg's age", value: 54, display: '54' },
  { topic: 'Minutes in a FIFA match', value: 90, display: '90' },
  { topic: 'States with legal recreational cannabis', value: 24, display: '24' },
  { topic: 'Price of a Storz & Bickel Volcano ($)', value: 479, display: '$479' },
  { topic: 'CBD market size in billions ($)', value: 7, display: '$7B' },
  { topic: 'Daily active TikTok users (millions)', value: 1500, display: '1.5B' },
  { topic: 'Elon Musk Twitter followers (millions)', value: 180, display: '180M' },
  { topic: 'Cannabis strains on Leafly', value: 5800, display: '5,800' },
  { topic: 'Average dispensary transaction ($)', value: 55, display: '$55' },
  { topic: 'Super Bowl LVIII viewers (millions)', value: 123, display: '123M' },
  { topic: 'Fortnite peak concurrent players (millions)', value: 44, display: '44M' },
  { topic: 'Amsterdam coffee shops', value: 166, display: '166' },
  { topic: 'Calories in a bag of Doritos', value: 1400, display: '1,400' },
  { topic: 'Songs on Spotify (millions)', value: 100, display: '100M' },
  { topic: 'World Cup 2026 host cities', value: 16, display: '16' },
  { topic: 'mg of THC in a standard edible', value: 10, display: '10mg' },
  { topic: 'Seconds to hold a proper hit', value: 3, display: '3s' },
  { topic: 'Drake Instagram followers (millions)', value: 146, display: '146M' },
  { topic: 'Price of 1oz in Colorado ($)', value: 150, display: '$150' },
  { topic: 'NBA teams total', value: 30, display: '30' },
  { topic: 'Average joint contains (grams)', value: 0.5, display: '0.5g' },
  { topic: 'YouTube daily video uploads (hours)', value: 720000, display: '720K hrs' },
  { topic: 'Countries where cannabis is fully legal', value: 4, display: '4' },
  { topic: 'Average Uber Eats delivery time (min)', value: 35, display: '35 min' },
  { topic: 'Twitch daily active streamers', value: 240000, display: '240K' },
  { topic: 'Rolling papers in a RAW pack', value: 32, display: '32' },
]

type Phase = 'playing' | 'correct' | 'wrong' | 'result' | null

export const HigherLowerGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [current, setCurrent] = useState<Stat | null>(null)
  const [next, setNext] = useState<Stat | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [revealing, setRevealing] = useState(false)
  const [revealNum, setRevealNum] = useState(0)
  const [msg, setMsg] = useState('Higher or Lower?')

  const usedRef = useRef<number[]>([])
  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const pickRandom = useCallback(() => {
    const avail = HL_STATS.filter((_, i) => !usedRef.current.includes(i))
    const pool = avail.length ? avail : HL_STATS
    const p = pool[Math.floor(Math.random() * pool.length)]
    usedRef.current = [...usedRef.current, HL_STATS.indexOf(p)]
    return p
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    usedRef.current = []
    const f = pickRandom()
    const s = pickRandom()
    setCurrent(f); setNext(s)
    setStreak(0); setBestStreak(0); setScore(0); setRound(1)
    setRevealing(false); setRevealNum(0)
    setPhase('playing')
    setMsg('Higher or Lower?')
    audio.playFx('crowd')
  }, [audio, pickRandom])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const guess = useCallback((g: 'higher' | 'lower') => {
    if (phaseRef.current !== 'playing' || revealing) return
    if (!next || !current) return
    setRevealing(true)
    audio.playFx('tap')
    const target = next.value
    let step = 0
    const rid = setInterval(() => {
      step++
      setRevealNum(Math.round(target * (1 - Math.pow(1 - step / 20, 3))))
      if (step >= 20) {
        clearInterval(rid)
        setRevealNum(target)
        const actual = next.value > current.value ? 'higher' : next.value < current.value ? 'lower' : g
        const correct = g === actual || next.value === current.value
        setTimeout(() => {
          if (correct) {
            const ns = streak + 1
            const pts = 10 * ns
            setStreak(ns)
            setBestStreak(b => Math.max(b, ns))
            setScore(s => s + pts)
            setMsg(`CORRECT! +${pts}`)
            audio.playFx('select')
            setPhase('correct')
          } else {
            setStreak(0)
            setMsg(`WRONG! It was ${actual.toUpperCase()}`)
            audio.playFx('whistle')
            setPhase('wrong')
          }
          setTimeout(() => {
            const nr = round + 1
            if (nr > 10) {
              audio.playFx(bestStreak >= 3 ? 'win' : 'lose')
              setPhase('result')
              setMsg('Game over!')
            } else {
              setRound(nr)
              setCurrent(next)
              setNext(pickRandom())
              setRevealing(false)
              setRevealNum(0)
              setPhase('playing')
              setMsg(`Round ${nr}/10`)
            }
          }, 1600)
        }, 500)
      }
    }, 40)
  }, [next, current, streak, round, bestStreak, audio, pickRandom, revealing])

  const guessRef = useRef(guess)
  useEffect(() => { guessRef.current = guess }, [guess])

  const collect = useCallback(() => {
    const won = bestStreak >= 3
    const reward = Math.max(10, Math.floor(score / 2))
    player.notify(won ? `📊 Score ${score}! +${reward} coins` : `😐 +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 20 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [bestStreak, score, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'higherlower') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'higherlower') return
    ble.registerPuffHandlers('higherlower',
      () => { /* puff start — unused for this game */ },
      () => { /* on release, interpret as higher (long puff = big) */ guessRef.current('higher') })
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'higherlower') return null
  const isResult = phase === 'result'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="📊 HIGHER or LOWER"
        titleColor={C.cyan}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`R${round}/10 · ${score}pts · 🔥${streak}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'linear-gradient(180deg,#0a1428,#0a1f3a)' }}>
        {!isResult && current && next && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2 }}>{msg}</div>

            <div style={{ width: '100%', maxWidth: 360, padding: '20px 16px', borderRadius: 16, background: `${C.cyan}12`, border: `2px solid ${C.cyan}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>{current.topic}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.cyan }}>{current.display}</div>
            </div>

            <div style={{ fontSize: 14, color: C.gold, fontWeight: 800 }}>vs</div>

            <div style={{ width: '100%', maxWidth: 360, padding: '20px 16px', borderRadius: 16, background: revealing ? `${C.gold}12` : `${C.purple}12`, border: `2px solid ${revealing ? C.gold : C.purple}35`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>{next.topic}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: revealing ? C.gold : C.purple }}>
                {revealing ? (revealNum >= 1000 ? revealNum.toLocaleString() : String(revealNum)) : '???'}
              </div>
            </div>

            {phase === 'playing' && !revealing && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div onClick={() => guess('higher')} style={{ padding: '14px 24px', borderRadius: 14, cursor: 'pointer', background: `${C.green}18`, border: `2px solid ${C.green}40`, fontSize: 16, fontWeight: 900, color: C.green, touchAction: 'none' }}>⬆ HIGHER</div>
                <div onClick={() => guess('lower')} style={{ padding: '14px 24px', borderRadius: 14, cursor: 'pointer', background: `${C.red}18`, border: `2px solid ${C.red}40`, fontSize: 16, fontWeight: 900, color: C.red, touchAction: 'none' }}>⬇ LOWER</div>
              </div>
            )}
            {(phase === 'correct' || phase === 'wrong') && (
              <div style={{ fontSize: 20, fontWeight: 900, color: phase === 'correct' ? C.green : C.red }}>
                {phase === 'correct' ? 'CORRECT! 🔥' : 'WRONG! 💀'}
              </div>
            )}
          </div>
        )}

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{bestStreak >= 5 ? '🏆' : bestStreak >= 3 ? '🔥' : '📊'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: bestStreak >= 3 ? C.green : C.red, marginBottom: 6 }}>GAME OVER</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 2 }}>Score: {score}</div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 12 }}>Best streak: {bestStreak}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}

// suppress unused warning
void pick
