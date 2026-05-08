import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useGameContext } from '../context/GameContext'

interface GameMeta {
  id: string
  name: string
  emoji: string
  color: string
  desc?: string
  type?: string
  [key: string]: any
}

export function useGameRouteSync(zoneSlug: string, games: GameMeta[]) {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const game = useGameContext()

  // URL → state
  useEffect(() => {
    const stateId = game.gameActive?.id || game.selectedGame?.id || null
    if (gameId === stateId) return
    if (gameId) {
      const g = games.find(x => x.id === gameId)
      if (g) {
        game.setSelectedGame(g as any)
      } else {
        navigate(`/arena/${zoneSlug}`, { replace: true })
      }
    } else {
      if (game.selectedGame) game.setSelectedGame(null)
      if (game.gameActive) game.setGameActive(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  // state → URL
  const lastStateRef = useRef<string | null>(null)
  useEffect(() => {
    const stateId = game.gameActive?.id || game.selectedGame?.id || null
    const prev = lastStateRef.current
    lastStateRef.current = stateId
    // First-mount with no state yet — let URL→state populate it
    if (prev === null && stateId === null) return
    // State carries a game from a different zone — ignore so URL→state can correct it
    if (stateId && !games.some(g => g.id === stateId)) return
    const expected = stateId ? `/arena/${zoneSlug}/${stateId}` : `/arena/${zoneSlug}`
    if (location.pathname === expected) return
    navigate(expected, { replace: !stateId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameActive?.id, game.selectedGame?.id])
}
