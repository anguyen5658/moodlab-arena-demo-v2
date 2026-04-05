# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mood Lab Arena** — an interactive gaming arena web app built with Vite + React 18 + TypeScript + React Router 7. It has 30+ mini-games, BLE device integration, live spectator features, and a coin/XP progression system. The viewport is fixed at 430 px on desktop and 100% on mobile.

The legacy single-file monolith (`moodlab-arena-v6.jsx`) still exists in the root as a reference — do not edit it.

## Commands

```bash
npm run dev          # start dev server (exposed on all interfaces via --host)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit — run this before committing
npm run preview      # preview production build
```

No test runner is configured.

## Architecture

### App shell (`src/App.tsx`)

`App` renders `<ArenaProvider><AppShell /></ArenaProvider>`. `AppShell` (inner component) owns the shared UI: `CoinHeader`, the BLE connect warning bar, the `<Outlet />` for routes, `NavBar`, and the BLE puff top-glow overlay. The connect bar is scoped to zone list paths only via `useLocation()`.

### Routing (`src/router/index.tsx`)

React Router 7 `createBrowserRouter`. Zone index pages are eagerly imported; all game components are `React.lazy()`. Route structure:

```
/                  → Hub
/zone/:zoneId      → ZoneFocus (kiosk card from Hub)
/arcade            → ArcadeZone
/arcade/:game      → individual game (finalkick, finalkick2, finalkick3, wildwest, balloon, puffpong, hotpotato, rhythm, tugofwar, hooked, rps, beatdrop, puffclock, pufflimbo, puffderby, simonpuffs, spectator, pinball, russian)
/stage             → StageZone
/stage/:game       → vibecheck, higherlower, pricepuff, survivaltrivia, simonpuffs, puffauction, spinwin
/fortune           → FortuneZone
/fortune/:game     → crystalball, strainbattle, matchpredictor, dailypicks, puffslots, puffblackjack, coinflip, crapsnclouds, mysterybox, scratchpuff, fortunecookie, treasuremap
/wall              → Wall
/worldcup          → WorldCup
/live              → Live
/me                → Me
```

### Global state (`src/context/ArenaContext.tsx`)

Single `ArenaProvider` wraps the entire app. Exposes `useArena()`. Key fields:

| Category | Key exports |
|---|---|
| Currency | `coins`, `xp`, `awardGame({ won, baseCoins, baseXP })`, `getCoinMultiplier()` |
| Loyalty | `dailyStreak`, `claimDaily()`, `completeChallenge(id)`, `earnBadge(id)`, `buyShopItem(item)` |
| BLE | `bleConnected`, `btPuffActive`, `connectBle()`, `registerPuffHandlers(down, up)` |
| Audio | `playFx(type)`, `playAudio(src, vol)`, `audioOn` |
| Overlays | `showFloatingReward(coins, xp)`, `notify(msg, color)` |

`FloatingReward` and `AchievementPopup` are rendered once inside the provider, above all routes.

### BLE integration (`src/hooks/useBle.ts`)

Connects to a Cali Clear vaporizer via Web Bluetooth. The `characteristicvaluechanged` listener is registered once at connect time and reads from `btPuffDown` / `btPuffUp` refs. To avoid stale closures, each game registers its handlers via `registerPuffHandlers` in a `useEffect`.

**Adding BLE to a game:**
```tsx
useEffect(() => {
  registerPuffHandlers(handlePuffDown, handlePuffUp)
  return () => registerPuffHandlers(null, null)
}, [registerPuffHandlers, handlePuffDown, handlePuffUp])
```

BLE device protocol:
- Service: `0000ffe0-0000-1000-8000-00805f9b34fb`
- Notify char: `0000ffe6-0000-1000-8000-00805f9b34fb`
- Puff start packet: `b4 b4 02 00 04 4b` / stop: `b4 b5 02 00 05 4b`

### Audio (`src/hooks/useAudio.ts`)

`playFx(type)` dispatches to either:
- **Audio files** (`win`, `lose`, `laugh`) — played via `new Audio()` from `assets/arena/`
- **Synthesized tones** — all other fx types generated via Web Audio API oscillators

Use file-backed fx only at game-over (once, guarded by a `useRef` flag). Use synthesized fx for per-round events.

### Design tokens (`src/constants/theme.ts`)

All colors are on `C` (e.g. `C.cyan`, `C.gold`, `C.text`, `C.border`). Glass-morphism presets: `GLASS_CLEAR`, `GLASS_CARD`, `LG.base`, `LG.thick`, `LG.pill`, `LG.tinted(color)`. All styling is inline React styles — no CSS modules.

Zone themes (name, primary color, sub-text) are on `Z[zoneId]` from `src/constants/arena.ts`.

### Game component pattern

Each game lives in `src/zones/<Zone>/games/<GameName>.tsx` and follows this structure:

```tsx
export default function SomeGame() {
  const navigate = useNavigate()
  const { playFx, registerPuffHandlers, awardGame } = useArena()

  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  // Mirror mutable state in refs to avoid stale closures in BLE/timer callbacks
  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const handlePuffDown = useCallback(() => { /* ... */ }, [...deps])
  const handlePuffUp   = useCallback(() => { /* ... */ }, [...deps])

  useEffect(() => {
    registerPuffHandlers(handlePuffDown, handlePuffUp)
    return () => registerPuffHandlers(null, null)
  }, [registerPuffHandlers, handlePuffDown, handlePuffUp])

  // At game end:
  awardGame({ won, baseCoins, baseXP })
  // Then navigate back: navigate('/arcade')
}
```

Games take over the full screen (`position: fixed, inset: 0, zIndex: 100`) and provide their own back button navigating to their zone.

### Shared components

- `ZoneHeader` — back button + zone tagline + zone name title (reads `Z[zoneId]`)
- `PuffActionBar` — universal hold-to-puff meter UI with sweet spot zones
- `CoinHeader` — top bar showing coins + XP (always visible)
- `NavBar` — bottom tab nav (Hub / Arcade / Stage / Fortune / Wall)
- `GameCard` — card used in zone game grids
- `GameDetailSheet` — bottom sheet shown before launching a game

## Assets

Static media in `public/assets/arena/`. Each zone has a `.png` thumbnail and `.mp4` background video. URL paths are relative: `assets/arena/<file>`.
