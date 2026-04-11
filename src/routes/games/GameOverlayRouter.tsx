import React from 'react'
import { useGameContext } from '../../context/GameContext'
import { PuffDerbyGame } from './arcade/PuffDerbyGame'
import { WildWestGame } from './arcade/WildWestGame'
import { PuffClockGame } from './arcade/PuffClockGame'
import { PuffLimboGame } from './arcade/PuffLimboGame'
import { RPSGame } from './arcade/RPSGame'
import { BalloonPopGame } from './arcade/BalloonPopGame'
import { PuffPongGame } from './arcade/PuffPongGame'
import { HotPotatoGame } from './arcade/HotPotatoGame'
import { RussianRouletteGame } from './arcade/RussianRouletteGame'
import { TugOfWarGame } from './arcade/TugOfWarGame'
import { RhythmPuffGame } from './arcade/RhythmPuffGame'
import { HookedGame } from './arcade/HookedGame'
import { BeatDropGame } from './arcade/BeatDropGame'

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
    case 'puffpong': return <PuffPongGame />
    case 'hotpotato': return <HotPotatoGame />
    case 'russian': return <RussianRouletteGame />
    case 'tugofwar': return <TugOfWarGame />
    case 'rhythm': return <RhythmPuffGame />
    case 'hooked': return <HookedGame />
    case 'beatdrop': return <BeatDropGame />
    default: return null
  }
}
