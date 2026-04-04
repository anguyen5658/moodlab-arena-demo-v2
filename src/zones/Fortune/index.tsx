import { useNavigate } from 'react-router'
import { ORACLE_GAMES } from '@/constants/games'
import { C } from '@/constants/theme'
import { GameCard } from '@/components/GameCard'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'

export default function FortuneZone() {
  const navigate = useNavigate()
  const { playFx } = useArena()

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80 }}>
      <ZoneHeader zoneId="oracle" onBack={() => navigate('/')} />
      <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ORACLE_GAMES.map(game => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={() => { playFx('select'); navigate(`/fortune/${game.id}`) }}
          />
        ))}
      </div>
    </div>
  )
}
