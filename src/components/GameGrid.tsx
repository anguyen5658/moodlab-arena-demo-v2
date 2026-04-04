import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { GameDefinition, ZoneDefinition } from '../data/arena';

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
};

const cardStyle = (accent: string): CSSProperties => ({
  borderRadius: 24,
  padding: '1rem',
  background: 'rgba(255, 255, 255, 0.06)',
  border: `1px solid ${accent}44`,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
  textDecoration: 'none',
  color: 'inherit',
});

export function GameGrid({ zone, games }: { zone: ZoneDefinition; games: GameDefinition[] }) {
  if (games.length === 0) {
    return <p style={{ color: '#afb7c9' }}>This zone is being migrated into route-backed game components.</p>;
  }

  return (
    <div style={gridStyle}>
      {games.map((game) => (
        <Link key={game.id} to={`${zone.route}/${game.id}`} style={cardStyle(zone.accent)}>
          <div style={{ fontSize: '1.8rem' }}>{game.emoji}</div>
          <h3 style={{ margin: '0.6rem 0 0.25rem', fontSize: '1.05rem' }}>{game.name}</h3>
          <p style={{ margin: 0, color: '#b6bfce', lineHeight: 1.45 }}>{game.description}</p>
        </Link>
      ))}
    </div>
  );
}