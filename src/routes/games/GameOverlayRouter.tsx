import React from 'react'
import { useGameContext } from '../../context/GameContext'
import { PuffDerbyGame } from './arcade/PuffDerbyGame'
import { WildWestGame } from './arcade/WildWestGame'
import { PuffClockGame } from './arcade/PuffClockGame'
import { PuffLimboGame } from './arcade/PuffLimboGame'
import { RPSGame } from './arcade/RPSGame'
import { BalloonPopGame } from './arcade/BalloonPopGame'

export const GameOverlayRouter: React.FC = () => {
  const game = useGameContext()
  const active = game.gameActive
  if (!active) return null

  switch (active.id) {
    case 'puffderby': return <PuffDerbyGame />
    case 'wildwest': return <WildWestGame />
    case 'puffclock': return <PuffClockGame />
    case 'pufflimbo': return <PuffLimboGame />
    case 'rps': return <RPSGame />
    case 'balloon': return <BalloonPopGame />
    default: return null
  }
}
