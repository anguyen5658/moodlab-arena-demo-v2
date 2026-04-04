import { useNavigate, useParams } from 'react-router-dom';
import { arenaZoneMap, type ArenaTabId } from '../data/arena';
import { GameGrid } from '../components/GameGrid';

export function TabPage({ tab }: { tab: ArenaTabId }) {
  const params = useParams();
  const navigate = useNavigate();

  if (tab !== 'arena') {
    return (
      <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tab.toUpperCase()}</h1>
        <p style={{ color: '#b7bfce' }}>This tab is now route-backed and ready for the migrated UI.</p>
      </section>
    );
  }

  const zone = arenaZoneMap[(params.zoneId as keyof typeof arenaZoneMap) ?? 'hub'] ?? arenaZoneMap.hub;

  return (
    <section style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <p style={{ color: zone.accent, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Arena Route
          </p>
          <h1 style={{ margin: '0.25rem 0', fontSize: '2.4rem' }}>{zone.title}</h1>
          <p style={{ margin: 0, color: '#b7bfce', maxWidth: 680 }}>{zone.summary}</p>
        </div>

        <div
          style={{
            borderRadius: 28,
            overflow: 'hidden',
            minHeight: 220,
            background: `linear-gradient(135deg, ${zone.accent}22, rgba(255,255,255,0.04))`,
            border: `1px solid ${zone.accent}33`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <img src={zone.media.image} alt={zone.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.values(arenaZoneMap).map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => navigate(candidate.route)}
              style={{
                border: `1px solid ${candidate.accent}44`,
                borderRadius: 999,
                background: candidate.id === zone.id ? candidate.accent : 'rgba(255,255,255,0.06)',
                color: candidate.id === zone.id ? '#050510' : '#e6ebf5',
                padding: '0.7rem 1rem',
                fontWeight: 700,
              }}
            >
              {candidate.title}
            </button>
          ))}
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.85rem' }}>Games</h2>
          <GameGrid zone={zone} games={zone.games} />
        </div>
      </div>
    </section>
  );
}