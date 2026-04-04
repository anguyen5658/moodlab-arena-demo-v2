import { C, LG } from '@/constants'
import type { GameDefinition } from '@/types'

interface GameCardProps {
  game: GameDefinition
  onSelect: () => void
  spectatorCount?: number
}

export function GameCard({ game, onSelect, spectatorCount }: GameCardProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        ...LG.base,
        borderRadius: 16, padding: '14px 14px 12px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        border: `1px solid ${game.color}20`,
        boxShadow: `0 4px 20px ${game.color}08`,
        animation: 'fadeIn 0.3s ease',
        transition: 'transform 0.15s',
      }}
    >
      {/* Hot badge */}
      {game.hot && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: `linear-gradient(135deg, ${C.red}, ${C.pink})`,
          borderRadius: 6, padding: '2px 6px',
          fontSize: 8, fontWeight: 800, color: '#fff',
        }}>🔥 HOT</div>
      )}
      {/* Live badge */}
      {game.live && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: `linear-gradient(135deg, ${C.red}, ${C.orange})`,
          borderRadius: 6, padding: '2px 6px',
          fontSize: 8, fontWeight: 800, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
          LIVE
        </div>
      )}

      {/* Emoji */}
      <div style={{ fontSize: 28, marginBottom: 6 }}>{game.emoji}</div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 3 }}>{game.name}</div>

      {/* Type badge */}
      <div style={{
        display: 'inline-block', padding: '2px 7px',
        borderRadius: 8, background: `${game.color}15`,
        border: `1px solid ${game.color}30`,
        fontSize: 9, fontWeight: 700, color: game.color,
        marginBottom: 6,
      }}>{game.type}</div>

      {/* Desc */}
      <div style={{ fontSize: 10, color: C.text2, lineHeight: 1.4, marginBottom: 8 }}>
        {game.desc}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: C.text3 }}>
        <span>👥 {game.players}</span>
        <span>⏱ {game.time}</span>
        {spectatorCount !== undefined && <span>👁 {spectatorCount}</span>}
      </div>

      {/* Color accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${game.color}, ${game.color}00)`,
      }} />
    </div>
  )
}
