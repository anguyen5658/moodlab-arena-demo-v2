import React from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useAudioContext } from '../../context/AudioContext'

/**
 * Halftime overlay — appears after consecutive games to suggest a break.
 * Awards bonus coins for taking a breather.
 * Triggered by AppShell when gamesPlayed hits a threshold.
 */
export const HalftimeOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const player = usePlayerContext()
  const audio = useAudioContext()
  const game = useGameContext()

  const claimBreak = () => {
    audio.playFx('success')
    player.setCoins((c: number) => c + 25)
    player.notify('🧘 Break bonus! +25 coins', C.green)
    player.spawnConfetti(20, [C.green, C.cyan, '#fff'])
    onDismiss()
  }

  const skip = () => {
    audio.playFx('tap')
    onDismiss()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(16px)' }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🧘</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.pink, letterSpacing: 4, marginBottom: 6 }}>HALFTIME</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Take a Break!</div>
      <div style={{ fontSize: 11, color: C.text2, maxWidth: 280, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
        You've been going hard. Stretch, hydrate, take a puff break. The arena will be here when you get back.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '80%', maxWidth: 260, marginBottom: 16 }}>
        {['💧 Hydrate', '🧘 Stretch', '🫁 Deep breaths'].map((tip, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 12 }}>{tip.split(' ')[0]}</span>
            <span style={{ fontSize: 10, color: C.text2 }}>{tip.split(' ').slice(1).join(' ')}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, width: '80%', maxWidth: 260 }}>
        <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginBottom: 4 }}>BREAK BONUS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: C.text }}>Reward</span>
          <span style={{ color: C.gold }}>+25 🪙</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div onClick={claimBreak} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: `${C.green}20`, border: `1px solid ${C.green}40`, fontSize: 14, fontWeight: 900, color: C.green, touchAction: 'none' }}>Claim Break</div>
        <div onClick={skip} style={{ padding: '12px 28px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, fontWeight: 700, color: C.text3, touchAction: 'none' }}>Skip</div>
      </div>
    </div>
  )
}
