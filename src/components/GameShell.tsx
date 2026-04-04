import { Link } from 'react-router-dom';
import type { GameDefinition, ZoneDefinition } from '../data/arena';

export function GameShell({ zone, game }: { zone: ZoneDefinition; game: GameDefinition }) {
  return (
    <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <Link to={zone.route} style={{ color: '#00E5FF', textDecoration: 'none', fontWeight: 700 }}>
        ← Back to {zone.title}
      </Link>
      <div
        style={{
          marginTop: '1rem',
          borderRadius: 28,
          background: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${zone.accent}55`,
          padding: '1.5rem',
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>{game.emoji}</div>
        <h1 style={{ margin: '0.4rem 0 0.35rem', fontSize: '2rem' }}>{game.name}</h1>
        <p style={{ color: '#d1d7e4', marginTop: 0 }}>{game.description}</p>
        <p style={{ color: '#8f9aac' }}>
          This route is wired and ready for the legacy game logic to be moved into a dedicated component.
        </p>
      </div>
    </section>
  );
}