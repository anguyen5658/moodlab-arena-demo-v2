import type { ZoneTheme } from '@/types'

export const ARENA_IMAGES: Record<string, string> = {
  hub:      '/assets/arena/hub.png',
  arcade:   '/assets/arena/arcade.png',
  stage:    '/assets/arena/stage.png',
  oracle:   '/assets/arena/oracle.png',
  wall:     '/assets/arena/wall.png',
  worldcup: '/assets/arena/worldcup.png',
}

export const ARENA_VIDEOS: Record<string, string> = {
  hub:      '/assets/arena/hub.mp4',
  arcade:   '/assets/arena/arcade.mp4',
  stage:    '/assets/arena/stage.mp4',
  oracle:   '/assets/arena/oracle.mp4',
  wall:     '/assets/arena/wall.mp4',
  worldcup: '/assets/arena/worldcup.mp4',
}

export const Z: Record<string, ZoneTheme> = {
  arcade:   { primary: '#00E5FF', glow: 'rgba(0,229,255,0.35)',   dim: 'rgba(0,229,255,0.08)',   name: 'The Arcade',     icon: '🎮', sub: '16 Action Games' },
  stage:    { primary: '#FFD93D', glow: 'rgba(255,217,61,0.35)',  dim: 'rgba(255,217,61,0.08)',  name: 'The Stage',      icon: '🎪', sub: '6 Live Shows' },
  oracle:   { primary: '#FFD93D', glow: 'rgba(255,217,61,0.35)',  dim: 'rgba(255,217,61,0.08)',  name: 'The Fortune',    icon: '🔮', sub: '16 Fortune Games' },
  wall:     { primary: '#FB923C', glow: 'rgba(251,146,60,0.35)',  dim: 'rgba(251,146,60,0.08)',  name: 'The Wall',       icon: '🏆', sub: 'Rankings & Glory' },
  worldcup: { primary: '#FFD93D', glow: 'rgba(255,217,61,0.35)',  dim: 'rgba(255,217,61,0.08)',  name: 'World Cup 2026', icon: '⚽', sub: 'Limited Event' },
}
