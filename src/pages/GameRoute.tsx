import { useParams } from 'react-router-dom';
import { arenaZoneMap, gameMap } from '../data/arena';
import { GameShell } from '../components/GameShell';

export function GameRoute() {
  const params = useParams();
  const zoneId = params.zoneId as keyof typeof arenaZoneMap;
  const gameId = params.gameId ?? '';
  const zone = arenaZoneMap[zoneId] ?? arenaZoneMap.hub;
  const game = gameMap[gameId];

  if (!game) {
    return (
      <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h1>Game not found</h1>
        <p style={{ color: '#b7bfce' }}>The route exists, but this game has not been registered yet.</p>
      </section>
    );
  }

  return <GameShell zone={zone} game={game} />;
}