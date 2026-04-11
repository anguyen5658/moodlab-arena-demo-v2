import React, { useCallback, useEffect, useRef, useState } from 'react'
import { C } from '../../../constants'
import { useGameContext } from '../../../context/GameContext'
import { usePlayerContext } from '../../../context/PlayerContext'
import { useBLEContext } from '../../../context/BLEContext'
import { useAudioContext } from '../../../context/AudioContext'
import { StageHeader } from './_shared'

const COLORS = [
  { key: 0, label: 'RED', color: '#FF4D6D', emoji: '🔴' },
  { key: 1, label: 'BLUE', color: '#4D96FF', emoji: '🔵' },
  { key: 2, label: 'GREEN', color: '#6BCB77', emoji: '🟢' },
  { key: 3, label: 'YELLOW', color: '#FFD93D', emoji: '🟡' },
]

type Phase = 'intro' | 'showing' | 'input' | 'wrong' | 'level_up' | 'result' | null

export const SimonPuffsGame: React.FC = () => {
  const game = useGameContext()
  const player = usePlayerContext()
  const ble = useBLEContext()
  const audio = useAudioContext()

  const [phase, setPhase] = useState<Phase>(null)
  const [sequence, setSequence] = useState<number[]>([])
  const [level, setLevel] = useState(0)
  const [inputIdx, setInputIdx] = useState(0)
  const [highlight, setHighlight] = useState<number | null>(null)
  const [maxLevel, setMaxLevel] = useState(0)
  const [msg, setMsg] = useState('')

  const startedRef = useRef(false)
  const phaseRef = useRef<Phase>(null)
  useEffect(() => { phaseRef.current = phase }, [phase])
  const sequenceRef = useRef<number[]>([])
  useEffect(() => { sequenceRef.current = sequence }, [sequence])
  const inputIdxRef = useRef(0)
  useEffect(() => { inputIdxRef.current = inputIdx }, [inputIdx])

  const showSequenceRef = useRef<() => void>(() => {})

  const showSequence = useCallback(() => {
    const seq = sequenceRef.current
    setPhase('showing')
    setMsg('Watch closely...')
    let i = 0
    const step = () => {
      if (i >= seq.length) {
        setHighlight(null)
        setInputIdx(0)
        setPhase('input')
        setMsg('Your turn! Repeat the sequence')
        return
      }
      setHighlight(seq[i])
      audio.playFx('select')
      setTimeout(() => {
        setHighlight(null)
        setTimeout(() => { i++; step() }, 200)
      }, 500)
    }
    setTimeout(step, 600)
  }, [audio])

  useEffect(() => { showSequenceRef.current = showSequence }, [showSequence])

  const nextLevel = useCallback(() => {
    setSequence(prev => {
      const next = [...prev, Math.floor(Math.random() * 4)]
      sequenceRef.current = next
      return next
    })
    setLevel(l => {
      const nl = l + 1
      setMaxLevel(m => Math.max(m, nl))
      return nl
    })
    setTimeout(() => showSequenceRef.current(), 600)
  }, [])

  const startGame = useCallback(() => {
    audio.gameSoundsMuted.current = false
    const firstSeq = [Math.floor(Math.random() * 4)]
    setSequence(firstSeq)
    sequenceRef.current = firstSeq
    setLevel(1); setMaxLevel(1)
    setInputIdx(0)
    setHighlight(null)
    setPhase('intro')
    setMsg('SIMON PUFFS — repeat the sequence!')
    audio.playFx('crowd')
    setTimeout(() => showSequenceRef.current(), 1200)
  }, [audio])

  const tapColor = useCallback((key: number) => {
    if (phaseRef.current !== 'input') return
    const seq = sequenceRef.current
    const idx = inputIdxRef.current
    setHighlight(key)
    audio.playFx('tap')
    setTimeout(() => setHighlight(null), 200)
    if (seq[idx] !== key) {
      audio.playFx('lose')
      setPhase('wrong')
      setMsg(`WRONG! It was ${COLORS[seq[idx]].label}`)
      setTimeout(() => {
        setPhase('result')
      }, 1500)
      return
    }
    const nextIdx = idx + 1
    setInputIdx(nextIdx)
    if (nextIdx >= seq.length) {
      audio.playFx('success')
      setPhase('level_up')
      setMsg(`Level ${level} complete! 🔥`)
      player.spawnConfetti(15)
      setTimeout(() => nextLevel(), 1000)
    }
  }, [audio, level, player, nextLevel])

  const exitGame = useCallback(() => {
    audio.gameSoundsMuted.current = true
    setPhase(null)
    game.exitGame()
  }, [audio, game])

  const collect = useCallback(() => {
    const won = maxLevel >= 5
    const reward = Math.min(120, maxLevel * 12)
    player.notify(won ? `🧠 Level ${maxLevel}! +${reward} coins` : `🧠 Level ${maxLevel} · +${reward} coins`, won ? C.green : C.gold)
    player.recordGameResult(won, reward, won ? 22 : 8, { bleConnected: ble.bleConnected, zone: 'stage', gameActive: game.gameActive })
    exitGame()
  }, [maxLevel, player, ble, game, exitGame])

  useEffect(() => {
    if (startedRef.current) return
    if (game.gameActive?.id !== 'simonpuffs') return
    startedRef.current = true
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (game.gameActive?.id !== 'simonpuffs') return
    ble.registerPuffHandlers('simonpuffs', null, null)
    return () => {
      audio.gameSoundsMuted.current = true
      ble.registerPuffHandlers(null, null, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id])

  if (!phase || game.gameActive?.id !== 'simonpuffs') return null
  const isResult = phase === 'result'
  const canTap = phase === 'input'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      <StageHeader
        title="🔴 SIMON PUFFS"
        titleColor={C.purple}
        coins={player.coins}
        bleConnected={ble.bleConnected}
        onBack={exitGame}
        rightText={`Level ${level} · Best ${maxLevel}`}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'radial-gradient(ellipse at center, #2a0a3a, #0a0a1e)' }}>
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: '#fff', padding: '6px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.5)' }}>
            {msg}
          </div>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '80%', maxWidth: 340, aspectRatio: '1 / 1' }}>
            {COLORS.map(c => (
              <div key={c.key}
                onClick={() => canTap && tapColor(c.key)}
                style={{
                  borderRadius: 20, cursor: canTap ? 'pointer' : 'default',
                  background: highlight === c.key ? c.color : `${c.color}35`,
                  border: `3px solid ${c.color}`,
                  boxShadow: highlight === c.key ? `0 0 40px ${c.color}` : `0 0 12px ${c.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48, transition: 'all 0.15s', touchAction: 'none',
                  transform: highlight === c.key ? 'scale(0.96)' : 'scale(1)',
                }}>
                {c.emoji}
              </div>
            ))}
          </div>
        </div>

        {isResult && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.88)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{maxLevel >= 5 ? '🏆' : '💀'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: maxLevel >= 5 ? C.green : C.red, marginBottom: 6 }}>GAME OVER</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 12 }}>Reached Level {maxLevel}</div>
            <div onClick={collect} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.purple}15`, border: `1px solid ${C.purple}30`, fontSize: 14, fontWeight: 800, color: C.purple, touchAction: 'none' }}>Collect</div>
          </div>
        )}
      </div>
    </div>
  )
}
