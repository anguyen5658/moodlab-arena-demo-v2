# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is
Social gaming platform for cannabis consumers. **Cali Clear puff device** is the game controller via Web Bluetooth (BLE). 36 games across 6 zones. FIFA World Cup 2026 partnership demo.

- **Stack:** Vite + React 18 + TypeScript + React Router 7 + Three.js (FinalKick 3D)
- **Source of truth:** This Vite project (`src/`). The legacy monolith `moodlab-arena-v7.jsx` (~26k lines) is **kept in-repo as reference only** — do not import it.
- **Style:** Inline styles only, glass-morphism dark theme, no CSS files, no Tailwind.

## Commands

```bash
npm run dev           # Vite dev server on :8100
npm run build         # tsc -b && vite build
npm run preview       # preview built bundle
npx tsc --noEmit      # typecheck only, no build
```

`tsconfig` is **strict: false**, **allowJs: true** — TypeScript is used as a safety net, not a guardrail. Expect `any` interop with the legacy monolith shapes.

**Build is the gate, not dev.** `npm run build` runs `tsc -b` (project references), which catches type errors that `tsc --noEmit` and the dev server silently pass. Always run `npm run build` before declaring work done.

### Deploy
Firebase Hosting is configured ([firebase.json](firebase.json), [.firebaserc](.firebaserc)) to serve `dist/` with SPA rewrites to `index.html`. Deploy with `firebase deploy --only hosting` after `npm run build`.

### Testing/verification
There are no unit tests. Verification is done end-to-end via Playwright MCP against a running Vite instance. Pattern:
1. `npm run dev` in background
2. `mcp__playwright__browser_resize({ width: 430, height: 932 })` — iPhone-shell dimensions
3. `browser_navigate('http://localhost:8100/arena/arcade')`
4. Use `browser_snapshot` for accessibility trees, `browser_click` with refs, `browser_take_screenshot` for visual diffs.
5. After exit: `browser_evaluate(() => document.querySelectorAll('canvas').length)` — assert RAF/canvas cleanup.

## Architecture

### 5-context design (state lives in providers, not prop drilling)
All cross-game state is split across 5 React contexts in `src/context/`:

| Context | Owns | Critical members |
|---|---|---|
| `PlayerContext` | coins, xp, badges, streaks, localStorage persistence | `recordGameResult()`, `notify()`, `spawnConfetti()`, `getCurrentTier()` |
| `BLEContext` | Web Bluetooth, 4 device slots, puff routing | `connectBleSlot(n)`, `registerPuffHandlers(gameId, down, up)`, `bleDevices[]` |
| `AudioContext` | singleton Web Audio ctx, sound FX | `playFx(type, vol)`, `gameSoundsMuted` ref (global kill-switch) |
| `GameContext` | active game, selected game, zone navigation, WC tournament state, fan mode | `exitGame()`, `setGameActive()`, `wcPhase`, `fanMode` |
| `UIContext` | atmosphere, chat, spectators, screen shake/flash, overlays | `setScreenShake()`, `gameChatMsgs`, `arenaAtmosphere` |

`useGame()` in `src/hooks/useGame.ts` returns all five at once — use sparingly; prefer calling only the contexts a component actually needs.

### Games as overlays + URL-synced per-game routes
Games are fixed-position overlays keyed on `GameContext.gameActive.id` — the zone component stays mounted beneath the game (preserving zone state). The URL is kept in sync via [src/hooks/useGameRouteSync.ts](src/hooks/useGameRouteSync.ts), which each zone calls with its games list:

- URL→state: when the path is `/arena/{zone}/{gameId}`, the hook calls `setSelectedGame` so the start-screen overlay opens.
- state→URL: when `selectedGame`/`gameActive` changes, the hook navigates (push when state gains a game, replace when it clears).
- Loop-breaking guards: an early-return when URL and state already match, and a `lastStateRef` skip on first mount with null state so URL→state can populate first. Stale state from a different zone is ignored so URL→state can correct it.

Game card click handlers still call `setSelectedGame` (or `notify("...coming soon!")` for stub games like `highcard`) — the URL follows. `exitGame()` and `closeOverlay()` clear state; the hook navigates back to `/arena/{zone}`.

### Router structure
```
/                            → redirect to /arena
/arena                       → ArenaHub
/arena/arcade[/:gameId]      → ArcadeZone   (19 arcade games)
/arena/stage[/:gameId]       → StageZone    (6 live shows)
/arena/fortune[/:gameId]     → FortuneZone  (the renamed Oracle zone)
/arena/wall                  → WallZone     (no games)
/arena/worldcup[/:gameId]    → WorldCupZone (tournament + Fan Mode overlays)
/control  /live  /me
```
Deep links like `/arena/fortune/puffblackjack` open the start screen for that game directly. The legacy `/arena/oracle` URL is no longer routed.

### Game component pattern
Every game is a single `.tsx` component in `src/routes/games/{arcade,stage,fortune}/`. They follow a canonical structure (see `TankWarGame.tsx`, `FishWarGame.tsx`, `PuffBlackjackGame.tsx` as references):

1. **State + refs** — lifted 1:1 from monolith `startXxxGame()` functions
2. **Draw callback** — `useCallback` with fresh state in deps (Rule 4)
3. **Animation loop effect** — restarts via dep change, cleaned up on unmount
4. **BLE registration effect** — `ble.registerPuffHandlers(id, () => down(), () => up())` with lazy wrappers (Rule 3); cleanup mutes audio and nulls handlers
5. **Game logic functions** — start, puff handlers, AI, etc.
6. **Render** — header (`StageHeader` for stage/oracle; 3-row brand/BLE/coins header inline for arcade), canvas, controls, `GameChatOverlay` dock

### Three.js (FinalKick 3D)
`three` is an npm dep, lazy-imported inside `FinalKickGame` for the FK3 variant. Vite splits it into its own chunk via `build.rollupOptions.output.manualChunks: { three: ['three'] }` in `vite.config.ts`. Full disposal (geometries, materials, `forceContextLoss()`) is mandatory in cleanup.

### Audio
`AudioContext` wraps a singleton `sharedAudioCtx` + `playFx()` + a `gameSoundsMuted` ref that acts as a global kill-switch — if it's `true`, every `playFx` call short-circuits. BeatDrop creates its own local `AudioContext` for music sync (matches monolith behavior).

---

## CRITICAL RULES — READ BEFORE EDITING

### Rule 1: Canvas animation loops MUST restart on every render
```tsx
// CORRECT — restart-per-render captures fresh state:
useEffect(() => {
  if (animRef.current) cancelAnimationFrame(animRef.current)
  const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
  animRef.current = requestAnimationFrame(loop)
  return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
}, [draw])  // depends on the draw callback

// WRONG — captures stale state forever:
if (!animRef.current) { const loop = () => {...}; ... }
```

### Rule 2: Independent animations need their own RAF refs
If a game has both a persistent draw loop AND short-lived animations (bullet flight, projectile, boss attack), each animation MUST own its own RAF ref. Sharing one ref causes the draw-loop's useEffect cleanup to cancel an in-flight projectile. See `TankWarGame.tsx` — `twDrawRafRef` and `twBulletRafRef` are intentionally separate.

### Rule 3: TDZ protection for BLE handlers
BLE handlers register functions that may be defined later. Always use lazy arrow wrappers:
```tsx
ble.registerPuffHandlers('wildwest', () => puffDown(), () => puffUp())
// NOT: ble.registerPuffHandlers('wildwest', puffDown, puffUp)
```

### Rule 4: Touch events on hold-to-fire / hold-to-puff buttons
Every PUFF/BLINKER hold button MUST have:
- `onTouchStart` with `e.stopPropagation(); e.preventDefault();`
- `onTouchEnd` for release
- `onTouchCancel` as safety net (same handler as onTouchEnd)
- `style={{ touchAction: 'none' }}`
- `e.preventDefault()` on mouse events to prevent iOS double-fire

### Rule 5: Sound cleanup order (and gameSoundsMuted semantics)
Every game's cleanup effect MUST set `audio.gameSoundsMuted.current = true` **before** cancelling timers/RAF, to prevent sound leaks after game exit.

**Subtlety:** if the BLE effect's deps include in-game state that can change mid-game (e.g. `twMode`), the cleanup fires on every mode change too — not just unmount. In that case, add `audio.gameSoundsMuted.current = false` **at the top of the effect body** so sound is re-enabled after an intra-game re-run. The cleanup still correctly mutes on real unmount. This is the exact TankWar Phase-9 regression we fixed — see `TankWarGame.tsx:1130-1144`.

### Rule 6: Ref-backed synchronous gates instead of ref-mirrored state
When a handler needs to bail if it's not in a valid phase, don't check a ref that mirrors state via `useEffect`. React commits state first, runs the sync effect after — so a fast press+release race-windows the check. Use a ref that's set **synchronously** in the start/release functions (e.g. `twCharging.current`) as the source of truth.

### Rule 7: Never delete hooks in the monolith; rename to `_dup_`
React counts hooks in order. Removing ANY useState/useRef/useEffect from the reference monolith causes React #301 `Too many re-renders`. If reading from the monolith to port state, don't "clean up" duplicates — assume they're there on purpose.

### Rule 8: Port the FULL game, never simplify
When porting any screen/game/feature from the monolith, bring the **complete** UI, state machine, modes, shop, rank, multiplayer flows, and intermediate screens. Don't drop modes or ship a 1v1-only / solo-only variant and call it deferred. The monolith is the spec. If context budget is tight, ask how to split the work across sessions — don't silently simplify.

Reference for the read: monolith `startXxxGame` engine function AND the full render block for `gameActive.id === 'xxx'` in the legacy file.

---

## Key Systems

### Three-input system
| Input | How | Streak multiplier |
|---|---|---|
| TAP | On-screen button | +0% |
| PUFF (dry) | Real puff hold | +5% |
| BLINKER | 5s+ real puff | +20% |

Puff streak: real puff only. Cap ×5 (+10% max). Dry holds streak. Tap breaks streak.

### BLE protocol — multi-profile
Supported devices are declared in `BLE_PROFILES` in [src/constants/index.ts](src/constants/index.ts). Each profile owns its `service` UUID, `notify` characteristic UUID, and a `parse(bytes) → "start" | "stop" | null` function. Currently supported:

| Profile | Service | Frame |
|---|---|---|
| Moodi Pro (original Cali Clear) | `0000ffe0-…` | 6-byte `[0xb4, 0xb4/0xb5, 0x02, 0x00, 0x04/0x05, 0x4b]` |
| Choice Big | `0000ae30-…` | `0xC3 … status@[5] … 0x3C` (1=start, 0=stop) |
| Sky Min | `0000ae40-…` | `0xC3 … status@[5] … 0x3C` (1=start, 0=stop) |

`connectBleSlot` in [src/context/BLEContext.tsx](src/context/BLEContext.tsx) auto-detects the profile after `gatt.connect` by trying each `getPrimaryService` in turn, stores the matched profile on the slot's `BLEDeviceRef`, and dispatches notifications via `profile.parse(b)`. **Adding a new device = append one entry to `BLE_PROFILES`** — no handler changes needed. Mixed profiles across slots are supported.

### Multi-device BLE (up to 4 Cali Clear devices)
- `bleDevices` state: `[{slot, name, connected}]`
- `bleDevicesRef`: `[{slot, device, characteristic, down, up}]`
- `connectBleSlot(slotIndex)` / `disconnectBleSlot(slotIndex)`
- Slot 0 backward-compatible with legacy `btPuffDown`/`btPuffUp`
- Device Hub popup: 4 color-coded slots (P1=Cyan, P2=Blue, P3=Gold, P4=Pink)
- Phase 8A (full per-slot routing for 10 multiplayer games) is **deferred** — currently only Slot 0 is wired to each game's handler pair.

### Game chat overlay
`src/components/shared/GameChatOverlay.tsx` — docked at bottom of every game overlay. Emoji reaction bar + collapsible message history + text input. Seeds bot messages via `useGameChat` from `SPECTATOR_NAMES`. State lives in `GameContext.gameChatMsgs / gameChatOpen / gameChatInput`.

---

## 6 hub zones

| Zone | Color | Count | Examples |
|---|---|---|---|
| Arcade | Cyan `#00E5FF` | 19 (incl. FK2/FK3) | FinalKick, WildWest, TankWar, FishWar, RooftopPuff |
| Stage | Gold `#FFD93D` | 6 | VibeCheck, SurvivalTrivia, PriceIsPuff, PuffAuction, SimonPuffs, HigherLower |
| Fortune (formerly "Oracle") | Gold `#FFD93D` | 12 functional + `highcard` stub | CrystalBall, StrainBattle, PuffSlots, CoinFlip, MatchPredictor, PuffBlackjack, ... |
| Wall | Orange `#FB923C` | — | Leaderboards |
| World Cup | Gold | — | FIFA 2026 tournament (Play + Fan Mode) |
| Live | Green `#22C55E` | — | Streams, spectating |

---

# Migration Playbook: Monolith → Vite + React + TypeScript

This section documents the process that migrated `moodlab-arena-v7.jsx` (26k-line React-in-a-single-file via CDN Babel) to this Vite project. Read it before starting any large port so you don't re-learn the expensive lessons.

## The source monolith
- `moodlab-arena-v7.jsx` — kept in repo as the spec. Never imported.
- 1 file, ~26,000 lines. React 18 via CDN + Babel standalone in-browser transform.
- 140+ `useState` hooks, 100+ `useRef`, 36 game engines, BLE system, Web Audio synthesis, Canvas 2D, Three.js (FK3) — all top-level in `MoodLabArena()`.

### Monolith source locations (memorize these)
| What | Lines |
|---|---|
| Constants (colors, GAMES, GAME_CONFIG, team/stat data) | 1–1246 |
| Hook declarations (useState/useRef) | 1250–2274 |
| Helper functions (`playFx`, `triggerFlash`, `spawnConfetti`) | 2275–3417 |
| `connectBleSlot` / `disconnectBleSlot` | 9449–9575 |
| BLE puff routing IIFE (multiplayer handler dispatch) | 9576–9750 |
| `cleanupAllGames()` | 13897–14060 |
| Game engines (`startXxx`, update, draw, puff handlers) | 3300–16000 |
| Render blocks (`gameActive.id === 'xxx'` branches) | 16000–25820 |
| Main return (AppShell, tabs, hub, lobby, modals) | 25822–26176 |

## Phased migration (the order that actually worked)

### Phase 0: Run monolith in Vite unchanged
Get the 26k-line file rendering in Vite **before** touching a single line of game logic. Add the Vite toolchain, replace CDN script tags with `<script type="module" src="/src/main.tsx">`, copy the jsx as `src/App.jsx`, add one `import * as THREE from 'three'` to replace the CDN global. Validation gate: every route and every game launches identically to the CDN build.

### Phase 1: Foundation split
- `src/types/index.ts` — all TS interfaces (loose — `any` is fine for deep game state)
- `src/constants/index.ts` — **verbatim lift** of lines 1–1246. Do not refactor.
- 5 contexts (Player, BLE, Audio, Game, UI) — owning their slices of the ~870 hook declarations
- `AppShell.tsx`, layout components, overlays, zone routes (card grids only, no game overlays yet)
- Shared components: `PuffBar`, `GlassButton`, `StartScreen`, `GameChatOverlay`, `Atmosphere`, `ContestantGrid`

Validation gate: app loads, all 9 routes navigate, BLE popup opens, coins persist to localStorage, start screen opens on game tap.

### Phases 2–6: Games in waves
- **Phase 2 (simple arcade, 6 games):** PuffDerby, WildWest, PuffClock, PuffLimbo, RPS, BalloonPop — validates BLE integration + RAF cleanup.
- **Phase 3 (canvas-heavy arcade, 8):** FinalKick (FK1+FK2+FK3 w/ Three.js), PuffPong, TugOfWar, RhythmPuff, HotPotato, Hooked, BeatDrop, RussianRoulette.
- **Phase 4 (remaining arcade, 3):** TankWar, FishWar, RooftopPuff.
- **Phase 5 (stage, 6):** VibeCheck, HigherLower, PriceIsPuff, SurvivalTrivia, SimonPuffs, PuffAuction.
- **Phase 6 (oracle, 12):** CrystalBall, StrainBattle, MatchPredictor, DailyPicks, PuffSlots, PuffBlackjack, CoinFlip, CrapsNClouds, MysteryBox, ScratchPuff, FortuneCookie, TreasureMap.

### Phase 7: Per-game verification sweep
After all games ported, walk every overlay individually in Playwright against the legacy build: start screen → in-game → exit. Fix inline. 12-point checklist per game (header parity, chat dock, canvas animates, RAF cleanup, console clean, coin delta, etc.).

### Phase 8: Deferred systems
- **8A (high priority):** Full per-slot BLE multiplayer routing — 10 games share Slot 0 today; need the monolith's 9576–9750 IIFE ported to `registerPuffHandlers` taking a routing table.
- **8B:** WC tournament state machine and Fan Mode — done in Phase 9.
- **8C:** HalftimeOverlay, PuffEventOverlay, SpinWin — ambient overlays, not started.

### Phase 9: Full-parity rewrite pass
The user caught multiple games (TankWar, FishWar, RooftopPuff, all 6 stage games, 5 oracle games) shipped as simplified variants — missing modes, intros, puff mechanics, data pools. Phase 9 rewrites each to full monolith parity: read the full `startXxx` engine AND the full render block, port every mode/screen/state, lift constant data verbatim. One commit per game. No simplification.

## How to port a single game (the checklist)

1. **Read both halves of the monolith.** Full `startXxxGame` function AND the full `if (gameActive.id === 'xxx')` render block. Skim is not enough — the render block often has mode-select tabs, intros, and result screens that the engine function doesn't hint at.
2. **List every state var, ref, constant, and asset.** Port them 1:1. If the monolith has 32 stats, port 32 stats — don't ship 14.
3. **List every phase.** `intro → modeselect → question → reveal → result → complete` is typical. Don't collapse phases.
4. **List every `playFx` call** in the monolith and mirror them at the same game events.
5. **Canvas?** Follow Rule 1 (animation loop restart) + Rule 2 (separate RAF refs for draw vs projectiles).
6. **Puff mechanic?** Follow Rule 3 (lazy wrappers) + Rule 5 (`gameSoundsMuted` top-of-body unmute if deps can change mid-game) + Rule 6 (sync ref gate, not state-mirrored ref).
7. **Hold button?** Follow Rule 4 (onTouchCancel + touchAction:none).
8. **Run `npx tsc --noEmit`** after writing. **Run `npm run build`** at the end — `tsc -b` has stricter checks than `--noEmit` and will catch type holes the dev server silently passes.
9. **Playwright verify.** Mode select renders, click through all phases, verify canvas animates, exit → canvas count 0.
10. **Commit per game.** One logical change per commit; message should say what was simplified before and what's now at parity.

---

## Lessons Learned (from the migration, in no particular order)

### RAF lifecycles are the #1 source of bugs
- **Shared RAF ref between draw loop and projectile flight.** TankWar's HOLD TO FIRE was broken for a full session because the main draw useEffect (depending on `twPhase`) and the bullet flight animation in `twFireShot` both wrote to the same `twRafRef.current`. When firing, phase changed to `'flying'`, the draw effect re-ran, its cleanup called `cancelAnimationFrame(twRafRef.current)` — cancelling the bullet, not the draw loop. **Fix: one RAF ref per independent animation flow.**
- **Draw loop depending on state that changes mid-frame.** If you depend on `[state]` in the draw useEffect, every state change tears down and restarts the RAF. Prefer depending on `[drawCallback]` (a useCallback that captures fresh state) — the loop re-starts cleanly with fresh closures.

### Race conditions around ref-mirrored state
- **Symptom:** Fast press-then-release on a hold button silently does nothing.
- **Cause:** The handler bails on a check like `phaseRef.current !== 'power'`, where `phaseRef` is synced via `useEffect` *after* React commits. On a fast release, the ref hasn't flipped yet.
- **Fix:** Gate on a ref set **synchronously** inside the start/release functions (`charging.current = true` in start, `false` in release). That ref is the source of truth — don't mirror it from state.

### `gameSoundsMuted` is a global kill-switch with re-run semantics
- The cleanup of a BLE effect mutes audio. That's correct on real unmount (prevents oscillators playing after overlay close).
- But if the effect's deps include **any in-game state** (TankWar's `twMode` is the canonical example), cleanup also fires on every intra-game re-run → audio stays muted forever.
- **Fix:** Add `audio.gameSoundsMuted.current = false` at the **top** of the effect body, not just the mount effect. That re-enables on every re-run. The cleanup still correctly mutes on real unmount.
- Tell-tale sign: "no in-game sound" in one specific game while every other game has sound.

### Don't silently simplify a game port
The user's strongest feedback was after the Phase 2–6 sweep, when several games shipped as simplified variants ("1v1 only — boss mode deferred", "solo only — mode-select deferred"). The rule now: **port the full UI, logic, and data, or ask how to split the work.** Deferrals are a commit message, not a silent scope drop. See `~/.claude/projects/-Users-hieu-Workspace-twa-lab-demo-arena/memory/feedback_no_simplification.md`.

### Data constants matter — don't substitute placeholders
Multiple games shipped with plausible-looking but made-up data (14 trivia questions instead of 32, 8 strains instead of 16, 10 products instead of 10 w/ categories). The monolith's arrays are referenced across the UI — hot stats, stats tabs, leaderboards, result screens — and substitute data silently diverges them. **Verbatim lift.**

### Mechanics drift quietly
Oracle games are especially prone to this. In the monolith, CrystalBall / StrainBattle / MatchPredictor / PuffSlots / CoinFlip all use **hold-puff duration** as their input (short = choice A, medium = choice B, long = CERTAIN/BLINKER with a multiplier). Multiple ports shipped with tap buttons or sliders instead. **When porting, check `puffStart.current = Date.now()` / `(Date.now() - puffStart.current)/1000` in the engine — that's the signal that the game uses hold-puff input.**

### React Strict Mode double-invocation effects
Mount effects that do one-time initialization (`startGame()`) must be guarded with a `startedRef`. Otherwise Strict Mode runs them twice and the second run resets state. Pattern:
```tsx
useEffect(() => {
  if (startedRef.current) return
  if (game.gameActive?.id !== 'xxx') return
  startedRef.current = true
  startGame()
}, [])  // eslint-disable-line react-hooks/exhaustive-deps
```

### `tsc -b` vs `tsc --noEmit` have different strictness
`npm run build` uses `tsc -b` (project references), which catches type errors the dev server and plain `tsc --noEmit` miss. Always run `npm run build` before declaring a phase done. The Phase 9 final sanity check caught three pre-existing build errors (`wcKnockout` missing from `ActiveGame`, a `twPhase` narrowing issue, a stray `void eliminated`) that dev had been running past for weeks.

### Monolith fields use short names (`c`, `q`, `a`); React port uses full names
The monolith's `ST_QUESTIONS` entries are `{q, a, c}` where `c` is `correct`. A port that aliases them via `export const TRIVIA = ST_QUESTIONS` and then reads `.correct` in a different file breaks at runtime silently (TypeScript's `strict: false` lets it compile). **When lifting constant arrays, re-define the interface in TS and rename fields to full names as you copy.** It's 30 more seconds and catches one class of bugs entirely.

### Fan Mode / WC Tournament state existed but wasn't wired
`GameContext` already had `fanMode`/`fanTeam` state from Phase 1, but no UI ever consumed it. The WC tournament `useWcTournament()` hook and `WcTournamentOverlay` were built, but `wcPhase` on the zone render line was referenced as a bare identifier instead of `game.wcPhase`, so it had been broken since the day it shipped. **When wiring a new overlay to existing context state, grep for readers of that state and verify at least one render path actually subscribes.**

### Playwright `browser_evaluate` can't serialize DOM nodes
Return plain objects: `return { canvases: document.querySelectorAll('canvas').length }`. Don't try to return an HTMLElement or call `.click()` on the returned ref — use `browser_click` with a ref from `browser_snapshot` instead. For multi-step clicks, the snapshot → ref → click pattern is more reliable than evaluate.

### Commit per-game during a rewrite pass
Big batched commits during a multi-game rewrite mean that bisecting a regression is painful and rolling back one game means rolling back the batch. Phase 9's per-game commit discipline (11 commits across ~20 games) made it trivial to spot which game introduced a specific issue.

---

## File map (in-project)

```
src/
├── main.tsx, App.tsx                         — router + providers
├── types/index.ts                            — loose TS interfaces
├── constants/index.ts                        — verbatim lift from monolith lines 1–1246
├── context/
│   ├── PlayerContext.tsx                     — coins, xp, localStorage
│   ├── BLEContext.tsx                        — Web BT, 4-slot device hub
│   ├── AudioContext.tsx                      — singleton AudioCtx, playFx, gameSoundsMuted
│   ├── GameContext.tsx                       — activeGame, selectedGame, WC tournament, fanMode
│   └── UIContext.tsx                         — atmosphere, chat, spectators
├── hooks/
│   ├── useGame.ts                            — returns all 5 contexts
│   ├── useGameEffects.ts                     — shared puff power utilities
│   ├── useGameChat.ts                        — bot chat generator
│   ├── useGameRouteSync.ts                   — URL ↔ selectedGame/gameActive sync per zone
│   └── useWcTournament.ts                    — WC tournament state machine
├── components/
│   ├── layout/                               — AppShell, Header, XPBar, Ticker, BottomNav
│   ├── shared/                               — PuffBar, GameChatOverlay, StartScreen, ContestantGrid
│   └── overlays/                             — BLEPopup, InputPanel, ProfileOverlay, AchievementsOverlay
└── routes/
    ├── arena/                                — ArenaHub, 6 zone routes, ZoneHeader
    ├── games/
    │   ├── GameOverlayRouter.tsx             — id → component switch
    │   ├── arcade/                           — 19 .tsx files (incl. FK1/FK2/FK3)
    │   ├── stage/                            — 6 .tsx files + _shared.tsx (StageHeader)
    │   └── fortune/                          — 7 individual (incl. PuffBlackjackGame) + RemainingFortuneGames.tsx (6 bundled)
    ├── control/, live/, me/                  — top-tab routes
```

Reference (do NOT import):
```
moodlab-arena-v7.jsx                          — legacy monolith, spec for ports
```

---

## Past bug fixes worth remembering

- **React #301** (monolith-era): removing duplicate hooks from the monolith. Fix: never remove, rename with `_dup_`.
- **Stale canvas closures:** draw loops captured state at startup. Fix: restart loop every render (Rule 1).
- **Touch release stuck:** `onTouchEnd` not firing on mobile. Fix: add `onTouchCancel` + `preventDefault`.
- **Sound leaks on exit:** missing `cancelAnimationFrame` in cleanup. Fix: sweep all RAF refs in cleanup effect.
- **TankWar HOLD TO FIRE dead (Phase 9):** RAF ref collision between draw loop and bullet flight + race condition on `phaseRef` check. Fix: split into `twDrawRafRef` / `twBulletRafRef`, gate only on sync `twCharging.current`.
- **TankWar silent in-game sound (Phase 9):** BLE effect's cleanup fired on every `twMode` change, muting permanently. Fix: `audio.gameSoundsMuted.current = false` at top of effect body.
- **PuffDerby double pick UI** (monolith-era): canvas and HTML both drew pick buttons. Fix: canvas returns early during pick phase.
- **PuffBlackjack shipped as a single-round stub:** original Vite port had no bet, no DOUBLE DOWN, no 7-hand session, no puff input. Replaced with full monolith parity ([PuffBlackjackGame.tsx](src/routes/games/fortune/PuffBlackjackGame.tsx)). Pulled the simplified version out of `RemainingFortuneGames.tsx` and gave it its own file for clarity.
- **`highcard` is a stub in the monolith:** `notify("High Card Puff coming soon!", C.red)` — the Fortune zone card list keeps it visible but `launchGame` short-circuits on `g.id === "highcard"`.

## Recent refactors worth knowing

- **Oracle → Fortune rename (2026-05-08):** zone slug, ZoneId, folder `src/routes/games/oracle/` → `fortune/`, asset filenames, ARENA_IMAGES/Z keys, `zone: 'oracle'` → `'fortune'` everywhere. Old `/arena/oracle` URL is gone — no redirect was added (intentional).
- **Per-game routes (2026-05-08):** added `/arena/{zone}/:gameId` for arcade/stage/fortune/worldcup. Wall has no games so was left unchanged. URL/state sync via `useGameRouteSync` — see "Games as overlays + URL-synced per-game routes" above.
