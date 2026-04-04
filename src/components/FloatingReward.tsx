import type { FloatingRewardData } from '@/types'

interface FloatingRewardProps {
  data: FloatingRewardData | null
}

export function FloatingReward({ data }: FloatingRewardProps) {
  if (!data) return null
  return (
    <div key={data.key} style={{
      position: 'fixed', top: '40%', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      animation: 'rewardFloatUp 2s ease forwards',
      textAlign: 'center',
    }}>
      {data.coins > 0 && (
        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD93D', textShadow: '0 0 20px rgba(255,217,61,0.6)' }}>
          +{data.coins} 🪙
        </div>
      )}
      {data.xp > 0 && (
        <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginTop: 4 }}>
          +{data.xp} XP
        </div>
      )}
    </div>
  )
}
