import React, { useEffect, useState } from 'react'
import { C } from '../../constants'
import { useAudioContext } from '../../context/AudioContext'

/**
 * PuffEvent overlay — limited-time event banner.
 * Shows a timed "420 Flash Event" or "2x coins" promotion.
 * Self-dismisses after duration or on user tap.
 */
export const PuffEventOverlay: React.FC<{
  event: { title: string; subtitle: string; emoji: string; duration: number; color: string; bonus?: string }
  onDismiss: () => void
}> = ({ event, onDismiss }) => {
  const audio = useAudioContext()
  const [remaining, setRemaining] = useState(event.duration)

  useEffect(() => {
    audio.playFx('crowd')
    const timer = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(timer); onDismiss(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [audio, onDismiss, event.duration])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div style={{ position: 'fixed', top: 80, left: '5%', right: '5%', zIndex: 250, pointerEvents: 'auto' }}>
      <div onClick={onDismiss} style={{
        padding: '14px 16px', borderRadius: 16, cursor: 'pointer', touchAction: 'none',
        background: `linear-gradient(135deg, ${event.color}25, ${event.color}08)`,
        border: `2px solid ${event.color}60`,
        boxShadow: `0 0 30px ${event.color}30`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 36, flexShrink: 0 }}>{event.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: event.color, letterSpacing: 1 }}>{event.title}</div>
          <div style={{ fontSize: 10, color: C.text2, marginTop: 2 }}>{event.subtitle}</div>
          {event.bonus && <div style={{ fontSize: 9, color: C.gold, fontWeight: 800, marginTop: 2 }}>{event.bonus}</div>}
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: event.color, fontFamily: 'monospace' }}>{mins}:{secs.toString().padStart(2, '0')}</div>
          <div style={{ fontSize: 7, color: C.text3 }}>remaining</div>
        </div>
      </div>
    </div>
  )
}
