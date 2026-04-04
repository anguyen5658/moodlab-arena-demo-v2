import { C } from '@/constants'
import type { LoyaltyBadge } from '@/types'

interface AchievementPopupProps {
  badge: LoyaltyBadge | null
}

export function AchievementPopup({ badge }: AchievementPopupProps) {
  if (!badge) return null
  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, animation: 'scaleIn 0.4s ease',
      background: 'linear-gradient(135deg, #1a1a3e, #0a0a20)',
      border: `2px solid ${C.gold}`,
      borderRadius: 20, padding: '16px 24px', textAlign: 'center',
      boxShadow: `0 8px 40px rgba(255,217,61,0.3), 0 0 80px rgba(255,217,61,0.1)`,
      minWidth: 220,
    }}>
      <div style={{ fontSize: 36 }}>{badge.icon}</div>
      <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: 2, marginTop: 6 }}>
        ACHIEVEMENT UNLOCKED
      </div>
      <div style={{ fontSize: 16, color: C.text, fontWeight: 700, marginTop: 4 }}>
        {badge.name}
      </div>
      <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>
        {badge.desc}
      </div>
    </div>
  )
}
