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
import { FinalKickGame } from './arcade/FinalKickGame'
import { TankWarGame } from './arcade/TankWarGame'
import { FishWarGame } from './arcade/FishWarGame'
import { RooftopPuffGame } from './arcade/RooftopPuffGame'
import { HigherLowerGame } from './stage/HigherLowerGame'
import { SimonPuffsGame } from './stage/SimonPuffsGame'
import { PuffAuctionGame } from './stage/PuffAuctionGame'
import { PriceIsPuffGame } from './stage/PriceIsPuffGame'
import { SurvivalTriviaGame } from './stage/SurvivalTriviaGame'
import { VibeCheckGame } from './stage/VibeCheckGame'

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
    case 'finalkick': return <FinalKickGame />
    case 'finalkick2': return <FinalKickGame />
    case 'finalkick3': return <FinalKickGame />
    case 'tankwar': return <TankWarGame />
    case 'fishwar': return <FishWarGame />
    case 'rooftoppuff': return <RooftopPuffGame />
    case 'higherlower': return <HigherLowerGame />
    case 'simonpuffs': return <SimonPuffsGame />
    case 'puffauction': return <PuffAuctionGame />
    case 'pricepuff': return <PriceIsPuffGame />
    case 'survivaltrivia': return <SurvivalTriviaGame />
    case 'vibecheck': return <VibeCheckGame />
    default: return null
  }
}
