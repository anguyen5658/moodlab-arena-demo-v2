import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from '../stage/_shared'

interface Strain { name: string; emoji: string; desc: string; color: string }
const STRAINS: Strain[] = [
  { name: 'Blue Dream', emoji: '🔵', desc: 'Sativa-dominant, sweet berry', color: '#3B82F6' },
  { name: 'OG Kush', emoji: '🌲', desc: 'Indica, earthy pine', color: '#22C55E' },
  { name: 'Sour Diesel', emoji: '⛽', desc: 'Sativa, diesel punch', color: '#F59E0B' },
  { name: 'Purple Haze', emoji: '🟣', desc: 'Sativa, berry haze', color: '#A855F7' },
  { name: 'Gorilla Glue', emoji: '🦍', desc: 'Hybrid, heavy resin', color: '#6B7280' },
  { name: 'Pineapple Express', emoji: '🍍', desc: 'Hybrid, tropical', color: '#FBBF24' },
  { name: 'Wedding Cake', emoji: '🍰', desc: 'Indica, vanilla frost', color: '#EC4899' },
  { name: 'Girl Scout Cookies', emoji: '🍪', desc: 'Hybrid, mint sweet', color: '#10B981' },
]

type Phase = 'voting' | 'reveal' | 'final' | null

export const StrainBattleGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [round, setRound] = useState(0)
  const [pair, setPair] = useState<[Strain, Strain] | null>(null)
  const [voted, setVoted] = useState<0 | 1 | null>(null)
  const [votes, setVotes] = useState<{ a: number; b: number } | null>(null)
  const [wins, setWins] = useState(0)
  const startedRef = useRef(false)

  const nextPair = useCallback(() => {
    const a = STRAINS[Math.floor(Math.random() * STRAINS.length)]
    let b = a
    while (b === a) b = STRAINS[Math.floor(Math.random() * STRAINS.length)]
    setPair([a, b])
    setVoted(null); setVotes(null)
    setPhase('voting')
  }, [])

  const start = useCallback(() => {
    audio.gameSoundsMuted.current = false
    setRound(0); setWins(0); nextPair()
  }, [audio, nextPair])

  const vote = useCallback((idx: 0 | 1) => {
    if (phase !== 'voting') return
    setVoted(idx)
    audio.playFx('tap')
    // Simulate crowd vote
    const youVoteA = idx === 0
    const aVotes = 30 + Math.floor(Math.random() * 40) + (youVoteA ? 10 : 0)
    const bVotes = 100 - aVotes
    setVotes({ a: aVotes, b: bVotes })
    const winner = aVotes > bVotes ? 0 : 1
    if (winner === idx) {
      setWins(w => w + 1)
      audio.playFx('success')
    } else {
      audio.playFx('miss')
    }
    setPhase('reveal')
    setTimeout(() => {
      const nr = round + 1
      if (nr >= 5) { setPhase('final') }
      else { setRound(nr); nextPair() }
    }, 1800)
  }, [phase, round, audio, nextPair])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null); game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const reward = 15 + wins * 10
    player.notify(`🌿 ${wins}/5 votes matched · +${reward} coins`, wins >= 3 ? C.green : C.gold)
    player.recordGameResult(wins >= 3, reward, 10, { bleConnected: ble.bleConnected, zone: 'oracle', gameActive: game.gameActive })
    exitGame()
  }, [wins, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'strainbattle') return
    startedRef.current = true; start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'strainbattle') return
    ble.registerPuffHandlers('strainbattle', null, null)
    return () => { ble.registerPuffHandlers(null, null, null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'strainbattle') return null
  const isFinal = phase === 'final'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader title="🌿 STRAIN BATTLE" titleColor="#22C55E" coins={player.coins} bleConnected={ble.bleConnected} onBack={exitGame} rightText={`R${round + 1}/5 · Wins ${wins}`} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 20%,#0a2a14,#050a08)' }}>
        {!isFinal && pair && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 14 }}>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: 2 }}>WHICH STRAIN WILL THE CROWD PICK?</div>
            {[0, 1].map(i => {
              const s = pair[i]
              const v = votes ? (i === 0 ? votes.a : votes.b) : 0
              const wasVoted = voted === i
              return (
                <div key={i}
                  onClick={() => vote(i as 0 | 1)}
                  style={{
                    width: '100%', maxWidth: 340, padding: 16, borderRadius: 16, cursor: phase === 'voting' ? 'pointer' : 'default',
                    background: `${s.color}12`, border: `2px solid ${wasVoted ? s.color : s.color + '35'}`,
                    textAlign: 'center', touchAction: 'none',
                    boxShadow: wasVoted ? `0 0 24px ${s.color}60` : 'none',
                  }}>
                  <div style={{ fontSize: 44, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{s.desc}</div>
                  {votes && (
                    <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${v}%`, height: '100%', background: s.color, transition: 'width 0.6s' }} />
                    </div>
                  )}
                  {votes && <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginTop: 2 }}>{v}%</div>}
                </div>
              )
            })}
          </div>
        )}
        {isFinal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{wins >= 3 ? '🏆' : '🌿'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: wins >= 3 ? C.green : C.gold, marginBottom: 6 }}>BATTLE OVER</div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>{wins} of 5 matched the crowd</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}15`, border: `1px solid ${C.green}30`, fontSize: 14, fontWeight: 800, color: C.green, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
