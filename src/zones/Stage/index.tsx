import { useNavigate } from 'react-router'
import { SHOW_GAMES } from '@/constants/games'
import { C } from '@/constants/theme'
import { GameCard } from '@/components/GameCard'
import { ZoneHeader } from '@/components/ZoneHeader'
import { useArena } from '@/context/ArenaContext'

export default function StageZone() {
  const navigate = useNavigate()
  const { playFx } = useArena()

  return (
    <div style={{ height: '100%', background: C.bg, overflowY: 'auto', paddingBottom: 80 }}>
      <ZoneHeader zoneId="stage" onBack={() => navigate('/')} />
      <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SHOW_GAMES.map(game => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={() => { playFx('select'); navigate(`/stage/${game.id}`) }}
          />
        ))}
      </div>
    </div>
  )
}
