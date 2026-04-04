import { C } from '@/constants'
import { useArena } from '@/context/ArenaContext'

export default function Me() {
  const { coins, xp, currentWinStreak, bestWinStreak, earnedBadges, bleConnected } = useArena()

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80, padding: '16px 16px 80px' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 16 }}>👤 My Profile</div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Coins', value: coins.toLocaleString(), icon: '🪙', color: C.gold },
          { label: 'XP', value: xp.toLocaleString(), icon: '⭐', color: C.cyan },
          { label: 'Win Streak', value: currentWinStreak, icon: '🔥', color: C.orange },
          { label: 'Best Streak', value: bestWinStreak, icon: '👑', color: C.purple },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 14,
            padding: '14px 14px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 20 }}>{stat.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: stat.color, marginTop: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
        Badges ({earnedBadges.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {earnedBadges.map(id => (
          <div key={id} style={{
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, color: C.text2,
          }}>{id}</div>
        ))}
      </div>

      {/* Device status */}
      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>🔵 Device</div>
        <div style={{ fontSize: 11, color: bleConnected ? C.green : C.text3 }}>
          {bleConnected ? '✓ Cali Clear Connected' : 'No device connected'}
        </div>
      </div>
    </div>
  )
}
