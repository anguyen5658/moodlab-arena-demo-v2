# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mood Lab Arena** — an interactive gaming arena web app with 30+ mini-games, live spectator features, and a coin/XP progression system. It is a single-page application delivered without any build tooling.

## Running the App

No build step required. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

The browser loads React 18, ReactDOM, Three.js, and Babel Standalone from CDN, then transpiles `moodlab-arena-v6.jsx` on the fly.

## Architecture

### Single-file monolith

The entire application lives in `moodlab-arena-v6.jsx` (~21 000 lines). There is no component splitting across files, no routing library, and no state management library.

### Navigation state machine

Navigation is driven by a handful of `useState` values at the top of `MoodLabArena`:

| State | Values | Meaning |
|---|---|---|
| `tab` | `"arena"` / `"live"` / `"me"` | Top-level tab |
| `zone` | `null` / `"arcade"` / `"stage"` / `"oracle"` / `"wall"` / `"worldcup"` | Current zone (null = Hub) |
| `selectedGame` | game ID string | Which game card was tapped |
| `gameActive` | boolean | Whether the game is running |

The render function is a large conditional tree: `tab → zone → selectedGame/gameActive`.

### Zones

- **Arcade** (cyan `#00E5FF`) — 16 skill-based games (Final Kick, Puff Pong, Balloon Pop, etc.)
- **Stage** (gold `#FFD93D`) — 6 live show formats (Vibe Check, Price is Puff, Simon Puffs, etc.)
- **Oracle** (gold) — Prediction / fortune games (Slots, Blackjack, Crystal Ball, etc.)
- **Wall** (orange `#FB923C`) — Leaderboards and Champions Podium
- **World Cup 2026** (gold) — Sports prediction hub

### Core input pattern: "Puff"

Most games share a universal puff action bar. The player holds a button; duration maps to a sweet spot zone (TAP → SHORT → GOOD → PERFECT → BLINKER). Each round randomises the sweet spot position and multiplier.

### Sound

All audio is synthesised via Web Audio API at runtime — no external audio files are required for game sounds (though `assets/arena/laugh.m4a`, `win.m4a`, `lose.m4a` exist for ambient effects).

### 3D rendering

Final Kick 3D uses Three.js (loaded from CDN). The canvas is mounted/unmounted with `useEffect` tied to `gameActive`.

### Styling

Inline React styles throughout. No CSS files, no CSS modules. Glass-morphism design language with a dark base and cyan/gold/orange/purple accent palette. The viewport is fixed at 430 px width on desktop and 100% on mobile.

## Key patterns to follow when editing

- **All code stays in `moodlab-arena-v6.jsx`** — do not split into separate files.
- Each game is self-contained: it owns its `useState` hooks, phase logic (`intro → playing → result`), scoring, and render subtree.
- Adding a new game means: add a card to the zone's game list, add state hooks near the top of `MoodLabArena`, and add a render block inside the `zone === "<zone>"` conditional.
- `coins` and `xp` are global currency; award them at the end of a game's result phase.
- The live spectator ticker (`liveSpectators`, `floatingReactions`, `crowdEnergy`) is zone-agnostic and can be referenced from any zone.

## Bluetooth Low Energy (BLE) integration

The app connects to a Cali Clear vaporizer via Web Bluetooth API. Physical puffs replace the on-screen "HOLD TO PUFF" button.

### Device protocol

| Property | UUID |
|---|---|
| Service | `0000ffe0-0000-1000-8000-00805f9b34fb` |
| Notify characteristic | `0000ffe6-0000-1000-8000-00805f9b34fb` |
| Write characteristic | `0000ffe5-0000-1000-8000-00805f9b34fb` (reserved, unused) |

Packets: `b4 b4 02 00 04 4b` = puff start, `b4 b5 02 00 05 4b` = puff stop.

### Key state and refs (top of `MoodLabArena`)

| Name | Type | Purpose |
|---|---|---|
| `btPuffActive` | state | drives the top glow overlay |
| `btDeviceRef` | ref | `BluetoothDevice` handle for disconnect |
| `btCharNotify` | ref | notify characteristic handle |
| `btPuffDown` / `btPuffUp` | refs | active game's puff start/stop handlers |
| `btPuffEventDown` / `btPuffEventUp` | refs | Puff Events system handlers (always wired) |
| `btPuffTimeout` | ref | 15 s safety timer — stops puff if `PUFF_STOP` is never received |

### Stale closure solution

The `characteristicvaluechanged` listener is registered once at connect time. To avoid stale closures, a **per-render IIFE** (search for `Keep BT puff refs in sync`) writes the current game's handler closures into `btPuffDown`/`btPuffUp` refs on every render. The listener always reads from these refs, never from closed-over values.

### Adding BLE support to a new game

Find the IIFE block (search `Keep BT puff refs in sync`) and add a branch:

```js
else if (id === "mygame") { down = myGamePuffStart; up = myGamePuffStop; }
```

- Hold-based game: provide both `down` and `up`.
- Tap-based game: provide only `down`, set `up = null`.

See `Doc/BLE-Implementation.md` for the full list of wired games and remaining TODO items. The reusable hook lives in `ble/` (`bleUtils.js`, `useBleDevice.js`, `useBleArena.js`).

## Assets

Static media lives in `assets/arena/`. Each zone has a matching `.png` (thumbnail) and `.mp4` (background video).
