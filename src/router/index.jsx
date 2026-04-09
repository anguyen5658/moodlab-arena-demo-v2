import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../AppShell.jsx';

// Zone index pages — eagerly loaded
import ArenaHub     from '../pages/ArenaHub.jsx';
import ArcadeZone   from '../zones/arcade/index.jsx';
import StageZone    from '../zones/stage/index.jsx';
import OracleZone   from '../zones/oracle/index.jsx';
import WallZone     from '../zones/wall/index.jsx';
import WorldCupHub  from '../zones/worldcup/index.jsx';
import LivePage     from '../pages/LivePage.jsx';
import MePage       from '../pages/MePage.jsx';

// Arcade games — lazy
const FinalKick     = lazy(() => import('../games/arcade/finalkick.jsx'));
const FinalKick2    = lazy(() => import('../games/arcade/finalkick2.jsx'));
const HotPotato     = lazy(() => import('../games/arcade/hotpotato.jsx'));
const Russian       = lazy(() => import('../games/arcade/russian.jsx'));
const WildWest      = lazy(() => import('../games/arcade/wildwest.jsx'));
const Balloon       = lazy(() => import('../games/arcade/balloon.jsx'));
const PuffPong      = lazy(() => import('../games/arcade/puffpong.jsx'));
const Rhythm        = lazy(() => import('../games/arcade/rhythm.jsx'));
const TugOfWar      = lazy(() => import('../games/arcade/tugofwar.jsx'));
const Hooked        = lazy(() => import('../games/arcade/hooked.jsx'));
const RPS           = lazy(() => import('../games/arcade/rps.jsx'));
const BeatDrop      = lazy(() => import('../games/arcade/beatdrop.jsx'));
const PuffClock     = lazy(() => import('../games/arcade/puffclock.jsx'));
const PuffLimbo     = lazy(() => import('../games/arcade/pufflimbo.jsx'));
const PuffDerby     = lazy(() => import('../games/arcade/puffderby.jsx'));
const TankWar       = lazy(() => import('../games/arcade/tankwar.jsx'));
const FishWar       = lazy(() => import('../games/arcade/fishwar.jsx'));
const RooftopPuff   = lazy(() => import('../games/arcade/rooftoppuff.jsx'));

// Stage games — lazy
const VibeCheck       = lazy(() => import('../games/stage/vibecheck.jsx'));
const HigherLower     = lazy(() => import('../games/stage/higherlower.jsx'));
const PricePuff       = lazy(() => import('../games/stage/pricepuff.jsx'));
const SurvivalTrivia  = lazy(() => import('../games/stage/survivaltrivia.jsx'));
const SimonPuffs      = lazy(() => import('../games/stage/simonpuffs.jsx'));
const PuffAuction     = lazy(() => import('../games/stage/puffauction.jsx'));

// Oracle games — lazy
const CrystalBall    = lazy(() => import('../games/oracle/crystalball.jsx'));
const StrainBattle   = lazy(() => import('../games/oracle/strainbattle.jsx'));
const MatchPredictor = lazy(() => import('../games/oracle/matchpredictor.jsx'));
const DailyPicks     = lazy(() => import('../games/oracle/dailypicks.jsx'));
const PuffSlots      = lazy(() => import('../games/oracle/puffslots.jsx'));
const PuffBlackjack  = lazy(() => import('../games/oracle/puffblackjack.jsx'));
const CoinFlip       = lazy(() => import('../games/oracle/coinflip.jsx'));
const CrapsNClouds   = lazy(() => import('../games/oracle/crapsnclouds.jsx'));
const MysteryBox     = lazy(() => import('../games/oracle/mysterybox.jsx'));
const ScratchPuff    = lazy(() => import('../games/oracle/scratchpuff.jsx'));
const FortuneCookie  = lazy(() => import('../games/oracle/fortunecookie.jsx'));
const TreasureMap    = lazy(() => import('../games/oracle/treasuremap.jsx'));

const Loader = () => (
  <div style={{ position: 'fixed', inset: 0, background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#00E5FF', fontSize: 14, fontFamily: 'monospace', animation: 'pulse 1.5s infinite' }}>Loading...</div>
  </div>
);

const wrap = (Component) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,                   element: <ArenaHub /> },
      { path: 'live',                  element: <LivePage /> },
      { path: 'me',                    element: <MePage /> },
      // Arcade
      { path: 'arcade',                element: <ArcadeZone /> },
      { path: 'arcade/finalkick',      element: wrap(FinalKick) },
      { path: 'arcade/finalkick2',     element: wrap(FinalKick2) },
      { path: 'arcade/hotpotato',      element: wrap(HotPotato) },
      { path: 'arcade/russian',        element: wrap(Russian) },
      { path: 'arcade/wildwest',       element: wrap(WildWest) },
      { path: 'arcade/balloon',        element: wrap(Balloon) },
      { path: 'arcade/puffpong',       element: wrap(PuffPong) },
      { path: 'arcade/rhythm',         element: wrap(Rhythm) },
      { path: 'arcade/tugofwar',       element: wrap(TugOfWar) },
      { path: 'arcade/hooked',         element: wrap(Hooked) },
      { path: 'arcade/rps',            element: wrap(RPS) },
      { path: 'arcade/beatdrop',       element: wrap(BeatDrop) },
      { path: 'arcade/puffclock',      element: wrap(PuffClock) },
      { path: 'arcade/pufflimbo',      element: wrap(PuffLimbo) },
      { path: 'arcade/puffderby',      element: wrap(PuffDerby) },
      { path: 'arcade/tankwar',        element: wrap(TankWar) },
      { path: 'arcade/fishwar',        element: wrap(FishWar) },
      { path: 'arcade/rooftoppuff',    element: wrap(RooftopPuff) },
      // Stage
      { path: 'stage',                 element: <StageZone /> },
      { path: 'stage/vibecheck',       element: wrap(VibeCheck) },
      { path: 'stage/higherlower',     element: wrap(HigherLower) },
      { path: 'stage/pricepuff',       element: wrap(PricePuff) },
      { path: 'stage/survivaltrivia',  element: wrap(SurvivalTrivia) },
      { path: 'stage/simonpuffs',      element: wrap(SimonPuffs) },
      { path: 'stage/puffauction',     element: wrap(PuffAuction) },
      // Oracle
      { path: 'oracle',                element: <OracleZone /> },
      { path: 'oracle/crystalball',    element: wrap(CrystalBall) },
      { path: 'oracle/strainbattle',   element: wrap(StrainBattle) },
      { path: 'oracle/matchpredictor', element: wrap(MatchPredictor) },
      { path: 'oracle/dailypicks',     element: wrap(DailyPicks) },
      { path: 'oracle/puffslots',      element: wrap(PuffSlots) },
      { path: 'oracle/puffblackjack',  element: wrap(PuffBlackjack) },
      { path: 'oracle/coinflip',       element: wrap(CoinFlip) },
      { path: 'oracle/crapsnclouds',   element: wrap(CrapsNClouds) },
      { path: 'oracle/mysterybox',     element: wrap(MysteryBox) },
      { path: 'oracle/scratchpuff',    element: wrap(ScratchPuff) },
      { path: 'oracle/fortunecookie',  element: wrap(FortuneCookie) },
      { path: 'oracle/treasuremap',    element: wrap(TreasureMap) },
      // Other zones
      { path: 'wall',                  element: <WallZone /> },
      { path: 'worldcup',             element: <WorldCupHub /> },
    ],
  },
]);
