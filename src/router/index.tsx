import { createBrowserRouter } from 'react-router'
import { lazy } from 'react'
import App from '@/App'

// Zone index pages
import Hub from '@/zones/Hub'
import ZoneFocus from '@/zones/Hub/ZoneFocus'
import ArcadeZone from '@/zones/Arcade'
import StageZone from '@/zones/Stage'
import FortuneZone from '@/zones/Fortune'
import Wall from '@/zones/Wall'
import WorldCup from '@/zones/WorldCup'
import Live from '@/pages/Live'
import Me from '@/pages/Me'

// Arcade games (lazy)
const FinalKick    = lazy(() => import('@/zones/Arcade/games/FinalKick'))
const FinalKick2   = lazy(() => import('@/zones/Arcade/games/FinalKick2'))
const FinalKick3D  = lazy(() => import('@/zones/Arcade/games/FinalKick3D'))
const WildWest     = lazy(() => import('@/zones/Arcade/games/WildWest'))
const BalloonPop   = lazy(() => import('@/zones/Arcade/games/BalloonPop'))
const PuffPong     = lazy(() => import('@/zones/Arcade/games/PuffPong'))
const HotPotato    = lazy(() => import('@/zones/Arcade/games/HotPotato'))
const RhythmPuff   = lazy(() => import('@/zones/Arcade/games/RhythmPuff'))
const TugOfWar     = lazy(() => import('@/zones/Arcade/games/TugOfWar'))
const Hooked       = lazy(() => import('@/zones/Arcade/games/Hooked'))
const PuffRPS      = lazy(() => import('@/zones/Arcade/games/PuffRPS'))
const BeatDrop     = lazy(() => import('@/zones/Arcade/games/BeatDrop'))
const PuffClock    = lazy(() => import('@/zones/Arcade/games/PuffClock'))
const PuffLimbo    = lazy(() => import('@/zones/Arcade/games/PuffLimbo'))
const PuffDerby    = lazy(() => import('@/zones/Arcade/games/PuffDerby'))
const SimonPuffs   = lazy(() => import('@/zones/Arcade/games/SimonPuffs'))
const SpectatorMode = lazy(() => import('@/zones/Arcade/games/SpectatorMode'))
const PuffPinball  = lazy(() => import('@/zones/Arcade/games/PuffPinball'))
const RussianRoulette = lazy(() => import('@/zones/Arcade/games/RussianRoulette'))

// Stage games (lazy)
const VibeCheck       = lazy(() => import('@/zones/Stage/games/VibeCheck'))
const HigherLower     = lazy(() => import('@/zones/Stage/games/HigherLower'))
const PricePuff       = lazy(() => import('@/zones/Stage/games/PricePuff'))
const SurvivalTrivia  = lazy(() => import('@/zones/Stage/games/SurvivalTrivia'))
const SimonPuffsStage = lazy(() => import('@/zones/Stage/games/SimonPuffsStage'))
const PuffAuction     = lazy(() => import('@/zones/Stage/games/PuffAuction'))
const SpinWin         = lazy(() => import('@/zones/Stage/games/SpinWin'))

// Fortune games (lazy)
const CrystalBall    = lazy(() => import('@/zones/Fortune/games/CrystalBall'))
const StrainBattle   = lazy(() => import('@/zones/Fortune/games/StrainBattle'))
const MatchPredictor = lazy(() => import('@/zones/Fortune/games/MatchPredictor'))
const DailyPicks     = lazy(() => import('@/zones/Fortune/games/DailyPicks'))
const PuffSlots      = lazy(() => import('@/zones/Fortune/games/PuffSlots'))
const PuffBlackjack  = lazy(() => import('@/zones/Fortune/games/PuffBlackjack'))
const CoinFlip       = lazy(() => import('@/zones/Fortune/games/CoinFlip'))
const CrapsNClouds   = lazy(() => import('@/zones/Fortune/games/CrapsNClouds'))
const MysteryBox     = lazy(() => import('@/zones/Fortune/games/MysteryBox'))
const ScratchPuff    = lazy(() => import('@/zones/Fortune/games/ScratchPuff'))
const FortuneCookie  = lazy(() => import('@/zones/Fortune/games/FortuneCookie'))
const TreasureMap    = lazy(() => import('@/zones/Fortune/games/TreasureMap'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Hub /> },

      // ── Zone Focus (intermediate kiosk view from Hub) ──
      { path: 'zone/:zoneId', element: <ZoneFocus /> },

      // ── Arcade ──
      {
        path: 'arcade',
        children: [
          { index: true,           element: <ArcadeZone /> },
          { path: 'finalkick',     element: <FinalKick /> },
          { path: 'finalkick2',    element: <FinalKick2 /> },
          { path: 'finalkick3',    element: <FinalKick3D /> },
          { path: 'wildwest',      element: <WildWest /> },
          { path: 'balloon',       element: <BalloonPop /> },
          { path: 'puffpong',      element: <PuffPong /> },
          { path: 'hotpotato',     element: <HotPotato /> },
          { path: 'rhythm',        element: <RhythmPuff /> },
          { path: 'tugofwar',      element: <TugOfWar /> },
          { path: 'hooked',        element: <Hooked /> },
          { path: 'rps',           element: <PuffRPS /> },
          { path: 'beatdrop',      element: <BeatDrop /> },
          { path: 'puffclock',     element: <PuffClock /> },
          { path: 'pufflimbo',     element: <PuffLimbo /> },
          { path: 'puffderby',     element: <PuffDerby /> },
          { path: 'simonpuffs',    element: <SimonPuffs /> },
          { path: 'spectator',     element: <SpectatorMode /> },
          { path: 'pinball',       element: <PuffPinball /> },
          { path: 'russian',       element: <RussianRoulette /> },
        ],
      },

      // ── Stage ──
      {
        path: 'stage',
        children: [
          { index: true,             element: <StageZone /> },
          { path: 'vibecheck',       element: <VibeCheck /> },
          { path: 'higherlower',     element: <HigherLower /> },
          { path: 'pricepuff',       element: <PricePuff /> },
          { path: 'survivaltrivia',  element: <SurvivalTrivia /> },
          { path: 'simonpuffs',      element: <SimonPuffsStage /> },
          { path: 'puffauction',     element: <PuffAuction /> },
          { path: 'spinwin',         element: <SpinWin /> },
        ],
      },

      // ── Fortune ──
      {
        path: 'fortune',
        children: [
          { index: true,              element: <FortuneZone /> },
          { path: 'crystalball',      element: <CrystalBall /> },
          { path: 'strainbattle',     element: <StrainBattle /> },
          { path: 'matchpredictor',   element: <MatchPredictor /> },
          { path: 'dailypicks',       element: <DailyPicks /> },
          { path: 'puffslots',        element: <PuffSlots /> },
          { path: 'puffblackjack',    element: <PuffBlackjack /> },
          { path: 'coinflip',         element: <CoinFlip /> },
          { path: 'crapsnclouds',     element: <CrapsNClouds /> },
          { path: 'mysterybox',       element: <MysteryBox /> },
          { path: 'scratchpuff',      element: <ScratchPuff /> },
          { path: 'fortunecookie',    element: <FortuneCookie /> },
          { path: 'treasuremap',      element: <TreasureMap /> },
        ],
      },

      // ── Other zones ──
      { path: 'wall',     element: <Wall /> },
      { path: 'worldcup', element: <WorldCup /> },
      { path: 'live',     element: <Live /> },
      { path: 'me',       element: <Me /> },
    ],
  },
])
