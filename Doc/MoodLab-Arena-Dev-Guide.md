# Mood Lab Arena -- Developer Guide

**Version:** 6.2
**Last Updated:** March 2026
**Codebase:** `moodlab-arena-v6.jsx` (21,608 lines)
**Deployment:** [moodlab-arena-demo-v2.vercel.app](https://moodlab-arena-demo-v2.vercel.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Design System](#3-design-system)
4. [Navigation & App Flow](#4-navigation--app-flow)
5. [The 5 Zones](#5-the-5-zones)
6. [Game Mechanics -- The Puff System](#6-game-mechanics--the-puff-system)
7. [All Games -- Detailed Mechanics](#7-all-games--detailed-mechanics)
8. [Tournament System](#8-tournament-system)
9. [Social Features](#9-social-features)
10. [Sound System](#10-sound-system)
11. [Visual Effects](#11-visual-effects)
12. [BLE Device Integration](#12-ble-device-integration)
13. [Key Functions Reference Table](#13-key-functions-reference-table)
14. [Data Constants Reference](#14-data-constants-reference)
15. [Deployment & Testing](#15-deployment--testing)

---

## 1. Project Overview

### Product Vision

Mood Lab Arena is a social gaming platform for cannabis consumers where **the puff device IS the controller**. Players use a real vape (BLE-connected) or simulated input to play games, compete in tournaments, and interact socially -- all through the act of puffing. Puff duration, timing, and intensity serve as the primary game input across every experience.

### Partnership

**Cali Clear x Mood Lab** for **FIFA World Cup 2026**. The entire World Cup zone is built as a limited-time event to tie into the tournament, complete with 50 national teams, group stages, bracket simulation, and live match tracking.

### Target

This is a **demo application** designed to showcase the concept to stakeholders and partners. It demonstrates the full breadth of the platform: 16 arcade games, 6 live shows, 12 fortune games, a full World Cup experience, rankings, social features, and BLE device integration.

### Tech Stack

| Component | Technology |
|---|---|
| UI Framework | React 18 (production UMD build via CDN) |
| Transpilation | Babel Standalone (in-browser JSX compilation) |
| 3D Rendering | Three.js 0.160 (CDN, used for Final Kick 3D) |
| Audio | Web Audio API (synthesized) + 3 audio files |
| Device Control | Web Bluetooth API (BLE) |
| Styling | Inline styles + CSS-in-JS via `<style>` tag |
| Animations | 87 `@keyframes` declarations (CSS-only, no animation libraries) |
| Build Step | **None** -- Babel compiles JSX directly in the browser |
| State Management | React `useState` (530 hooks) + `useRef` (95 hooks) |

### Deployment

- **Production:** Vercel at `moodlab-arena-demo-v2.vercel.app`
- **Local dev:** `serve.sh` (Python SimpleHTTPServer on port 8093)
- No build pipeline, no bundler, no npm -- push JSX and HTML directly

---

## 2. Architecture

### Single-File Architecture

The entire application lives in **one file**: `moodlab-arena-v6.jsx` at 21,608 lines. This is a deliberate choice for the demo -- no module splitting, no imports beyond React hooks, no routing library. Everything is inline.

**File breakdown by section:**

| Line Range | Content |
|---|---|
| 1--8 | Header comment, version info |
| 9--25 | `ARENA_IMAGES` and `ARENA_VIDEOS` asset paths |
| 28--52 | `Z` (zone configs), `FORTUNE_LEVELS`, `C` (color palette) |
| 54--77 | Spectator system data (`SPECTATOR_NAMES`, `EMOJIS`, `TICKER_MSGS`) |
| 79--130 | Glass morphism design system (`GLASS_CLEAR`, `GLASS_CARD`, `LG`) |
| 132--230 | Game data arrays (`PLAY_GAMES`, `SHOW_GAMES`, `MC_LINES`, `ORACLE_GAMES`, etc.) |
| 232--328 | Supporting data (strains, questions, predictions, leaderboard, badges) |
| 330--504 | Wall data, achievements, ranks, streak rewards |
| 506--564 | `WC_TEAMS` -- 50 national teams |
| 567--672 | `GAME_TEAMS` -- themed teams per game (13 games x 6 teams) |
| 674--779 | `GAME_TOURNAMENTS` -- unique tournament format per game |
| 781--786 | `WC_GROUPS` -- 12 groups (A--L) |
| 808--839 | `WC_LIVE_MATCHES` -- simulated live match data |
| 857--876 | Universal Puff Config + power zones |
| 877--886 | `HOOK_FISH` -- 8 fish types for Hooked game |
| 889--952 | Additional game constants (Simon Puffs, Puff Auction, chat, input modes, devices) |
| 957--21609 | `MoodLabArena()` -- the main React component |

### index.html -- The Loader

The `index.html` file (79 lines) handles:

1. **Phone frame container**: `#root` div at 430x932px (iPhone 14 Pro Max viewport), centered on desktop with rounded corners and shadow, full-screen on mobile
2. **Back button**: `#back-btn` positioned outside the React DOM at `z-index: 2147483647` (max). Calls `window.__moodlabGoBack()` which is set by the React component
3. **CDN loading**: React 18, ReactDOM 18, Three.js 0.160, Babel Standalone
4. **JSX compilation**: Fetches `moodlab-arena-v6.jsx` with cache-busting (`?v=Date.now()`), strips the ES module `import` statement and replaces it with destructured `React` globals, transforms via Babel, executes via `new Function()`, and renders with `ReactDOM.createRoot()`

**Import transformation performed in index.html:**
```
// This line in the JSX:
import { useState, useRef, useEffect, useCallback } from "react";

// Gets replaced at runtime with:
const { useState, useRef, useEffect, useCallback } = React;

// And `export default function` becomes just `function`
```

### Asset Structure

```
project-root/
  index.html              # Loader + phone frame
  moodlab-arena-v6.jsx    # Entire app (21,608 lines)
  serve.sh                # Local dev server (Python, port 8093)
  assets/
    arena/
      hub.png             # Hub zone background (4.7 MB)
      hub.mp4             # Hub zone video loop (596 KB)
      arcade.png          # Arcade zone background (3.7 MB)
      arcade.mp4          # Arcade zone video loop (827 KB)
      stage.png           # Stage zone background (4.7 MB)
      stage.mp4           # Stage zone video loop (1.2 MB)
      oracle.png          # Fortune zone background (17.6 MB)
      oracle.mp4          # Fortune zone video loop (755 KB)
      wall.png            # Wall zone background (4.6 MB)
      wall.mp4            # Wall zone video loop (740 KB)
      worldcup.png        # World Cup zone background (4.2 MB)
      worldcup.mp4        # World Cup zone video loop (1.7 MB)
      cali-clear-logo.png # Partner logo (6.2 MB)
      win.m4a             # Victory sound effect (88 KB)
      lose.m4a            # Defeat sound effect (147 KB)
      laugh.m4a           # Comedy sound effect (58 KB)
```

### State Management

The app uses **530 `useState` hooks** and **95 `useRef` hooks** inside a single `MoodLabArena()` component. There is no Redux, no Context API, no Zustand -- just raw React hooks.

State is organized into logical groups via comments:

- **Navigation:** `tab`, `zone`, `liveTab`, `meTab`
- **Arena State:** `coins`, `xp`, `selectedGame`, `matchmaking`, `gameActive`
- **Per-Game State:** Each of the 34 playable games has its own cluster of state variables (e.g., `kickState`, `kickRound`, `kickScore`, `kickAim`, `kickPower`, etc. for Final Kick alone)
- **Visual Effects:** `screenShake`, `screenFlash`, `confettiParticles`, `smokeParticles`, `puffWaveActive`, `dimLights`
- **Social:** `chatMessages`, `chatInput`, `liveSpectators`, `puffReactions`

### No Build Step

There is no `package.json`, no `node_modules`, no webpack/vite/esbuild. The workflow is:

1. Edit `moodlab-arena-v6.jsx` in any editor
2. Push to the git repo
3. Vercel deploys the static files
4. Babel compiles JSX to JS in the browser on page load

For local development, run `./serve.sh` and visit `localhost:8093`.

---

## 3. Design System

### Color Palette (`C` object, line 45)

```javascript
const C = {
  bg:     "#050510",   // Primary background (near-black)
  bg2:    "#0a0a20",   // Secondary background
  bg3:    "#0f0f2a",   // Tertiary background
  card:   "#12123a",   // Card background
  border: "rgba(255,255,255,0.06)",   // Subtle border
  border2:"rgba(255,255,255,0.12)",   // Visible border
  text:   "#F0EEFF",   // Primary text (lavender white)
  text2:  "#A8A3D0",   // Secondary text (muted purple)
  text3:  "#6E6A95",   // Tertiary text (dim)
  cyan:   "#00E5FF",   // Arcade zone, primary accent
  gold:   "#FFD93D",   // Stage/Fortune/WC zone accent
  pink:   "#FF4D8D",   // Accent pink
  purple: "#C084FC",   // Accent purple
  orange: "#FB923C",   // Wall zone accent
  red:    "#FF4444",   // Error / Russian Roulette
  green:  "#34D399",   // Success / Puff Pong
  lime:   "#7FFF00",   // Perfect puff zone
  blue:   "#60A5FA",   // Accent blue
  glass:  "rgba(255,255,255,0.03)",      // Glass background
  glassBorder: "rgba(255,255,255,0.08)", // Glass border
};
```

### Glass Morphism System (lines 79--130)

Four levels of glass morphism, used consistently throughout the UI:

| Style | Usage | Background Opacity | Blur |
|---|---|---|---|
| `GLASS_CLEAR` | Nav bar, side buttons, small UI elements | `rgba(255,255,255,0.06)` | `blur(50px)` |
| `GLASS_CARD` | Jumbotron, info cards, content panels | `rgba(8,8,25,0.72)` | `blur(40px)` |
| `LG.base` | Overlays, generic cards | `rgba(255,255,255,0.05)` | `blur(40px)` |
| `LG.thick` | Panels, sheets, modals | `rgba(10,10,32,0.45)` | `blur(60px)` |
| `LG.pill` | Small buttons, tags, pills | `rgba(255,255,255,0.06)` | `blur(24px)` |
| `LG.tinted(color)` | Zone-colored glass (dynamic) | `${color}08` | `blur(40px)` |

All glass styles include:
- `backdropFilter` + `-webkit-` prefix for Safari
- `saturate()` and `brightness()` for vibrancy
- Inset highlights (top: white 0.08--0.15, bottom: white 0.02--0.04)
- Outer shadow for depth

### Typography

System fonts only -- no custom font loading:
```css
font-family: -apple-system, sans-serif;
```

Font sizes are inline and vary by context (typically 8px--16px for body, 18px--32px for headings). All text uses `user-select: none`.

### Zone Theming (`Z` object, line 28)

Each zone has a consistent theme object:

```javascript
const Z = {
  arcade:   { primary:"#00E5FF", glow:"rgba(0,229,255,0.35)",   dim:"rgba(0,229,255,0.08)", name:"The Arcade",     icon:"🎮", sub:"16 Action Games" },
  stage:    { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)",   dim:"rgba(255,217,61,0.08)", name:"The Stage",      icon:"🎪", sub:"6 Live Shows" },
  oracle:   { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)",   dim:"rgba(255,217,61,0.08)", name:"The Fortune",    icon:"🔮", sub:"16 Fortune Games" },
  wall:     { primary:"#FB923C", glow:"rgba(251,146,60,0.35)",   dim:"rgba(251,146,60,0.08)", name:"The Wall",       icon:"🏆", sub:"Rankings & Glory" },
  worldcup: { primary:"#FFD93D", glow:"rgba(255,217,61,0.35)",   dim:"rgba(255,217,61,0.08)", name:"World Cup 2026", icon:"⚽", sub:"Limited Event" },
};
```

Zone colors cascade through borders, glows, text accents, and tinted glass panels within each zone's UI.

### CSS-Only Animations (87 `@keyframes`)

All animations are pure CSS -- no Framer Motion, no GSAP, no animation libraries. The `<style>` tag at lines 21518--21606 contains 87 keyframe declarations covering:

- **Core UI:** `pulse`, `fadeIn`, `sheetUp`, `spin`, `panelSlideUp`
- **Arena:** `arenaFadeIn`, `zoneEntry`, `walkFlash`, `corridorPulse`
- **Effects:** `confettiFall`, `smokeRise`, `puffWaveSweep`, `bubbleFloat`
- **Duel:** `duelHeartbeat`, `duelTumbleweed`, `duelDust`, `duelMuzzle`, `duelBreathe`
- **Games:** `bpWobble`, `bpExplode`, `hpBombPulse`, `hookFishFight`, `rpNoteGlow`
- **Neon:** `neonFlicker`, `ppNeonGlow`, `neonSign`, `glowShift`
- **Ticker/Scroll:** `tickerScroll`, `specTickerScroll`, `borderShift`

---

## 4. Navigation & App Flow

### Tab Bar

The bottom navigation is a floating pill dock using `GLASS_CLEAR` styling, hidden on the Arena hub view. Four tabs:

| Tab | Icon | Color | Status |
|---|---|---|---|
| Control | 🎛 | Cyan | Active -- device controls |
| Arena | 🎮 | Cyan | Active -- main game hub |
| Live | 📡 | Pink | Demo-only (shows "Coming Soon") |
| Me | 👤 | Purple | Demo-only (shows "Coming Soon") |

Only the **Arena** tab is fully functional in the demo. The others show a "Coming Soon -- Arena Demo Only" notification when tapped.

### Arena View States

The Arena tab navigates through a hierarchy of views:

```
hub (Arena Home)
  |
  +-- zone (arcade | stage | oracle | wall | worldcup)
        |
        +-- selectedGame (game detail overlay)
              |
              +-- matchmaking (searching -> found -> ready)
                    |
                    +-- gameActive (game is running)
```

**Key state variables:**
- `tab` -- current main tab ("arena", "live", "me", "control")
- `zone` -- current zone (null = hub, "arcade" | "stage" | "oracle" | "wall" | "worldcup")
- `arenaView` -- current zone view for zone focus screens ("hub" | zone key)
- `selectedGame` -- game detail overlay (any game object from PLAY_GAMES/SHOW_GAMES/ORACLE_GAMES)
- `matchmaking` -- matchmaking state object ({ game, mode, stage, input })
- `gameActive` -- active game state ({ ...game, activeInput })

### Back Navigation

Back navigation is handled by a button **outside the React DOM** (in `index.html`), calling `window.__moodlabGoBack()` which is registered inside the React component at line 9679.

The back handler implements smart step-back logic with this priority:

1. **In a game** (`gameActive`) -- cleanup all game state, return to zone hub
2. **In matchmaking** (`matchmaking`) -- cancel matchmaking
3. **Viewing game detail** (`selectedGame`) -- dismiss detail overlay
4. **In Vibe Check/Spin overlay** -- dismiss overlay
5. **In fan mode** -- exit fan flow
6. **In WC tournament flow** -- step back through WC phases
7. **In halftime mini-game** -- close it
8. **In puff event** -- close it
9. **In a zone** (`zone` is set) -- return to arena hub
10. **In zone welcome** (`arenaView` is a zone key) -- return to arena hub
11. **At arena home** -- do nothing

The back button visibility is managed via direct DOM access:
```javascript
const btn = document.getElementById('back-btn');
if(btn) btn.style.display = (gameActive || matchmaking || selectedGame || ...) ? 'block' : 'none';
```

### Zone Header

Each zone renders a header via `renderZoneHeader(zKey)` at line 7181, which displays:
- A "< Lobby" button to return to the arena hub
- The zone icon and name
- The zone tagline
- Zone-colored accents and glow

### Walking Transition

When moving between zones, a walking transition animation plays using the `walkFlash` keyframe, giving the impression of physically moving through the arena rather than switching screens.

---

## 5. The 5 Zones

### Arcade (🎮) -- 16 Action Games

**Color:** Cyan (`#00E5FF`)
**Tagline:** "PLAY . COMPETE . WIN"
**Renderer:** `renderArcade()` at line 7217

The Arcade is the core gaming zone with 16 skill-based, reaction-based, and luck-based games. Features:

- **Tabs:** Games, Stats
- **Hero auto-slider:** Featured games carousel at the top
- **Game grid:** Cards for all 16 games with emoji, player count, time estimate, and type badge
- **Quick Play:** Jump into a random game instantly
- **Hot badges:** Games marked as `hot: true` get a "HOT" badge

The 16 games span diverse genres: penalty kicks (3 variants), party games, duels, fishing, rhythm, racing, and more. Each game card shows supported input types.

### Stage (🎪) -- 6 Live Shows

**Color:** Gold (`#FFD93D`)
**Tagline:** "WATCH . PLAY . WIN"
**Renderer:** `renderStage()` at line 7505

The Stage is a live show format zone with MC commentary and elimination mechanics.

**Key systems:**

- **MC Commentary** (`MC_LINES`, line 162): Template strings for intro, contestant picks, round starts, correct/wrong answers, audience reactions, and finale. Rendered via a floating bar at the top of the screen during gameplay.

- **Elimination Engine** (`STAGE_CONTESTANTS`, line 9824): 8-player elimination bracket with 7 AI contestants (PuffMaster, CloudChaser, THC_Tony, NeonQueen, BlinkerBetty, VibeKing, ChillMaster). Each has a skill rating (0.55--0.85). Scores are computed as `skill * 100 + random variance`, bottom players eliminated each round.

- **Role System**: Players can be:
  - **Contestant** -- actively playing on stage
  - **Audience** -- watching with chat and puff reactions
  - Break-time chat available between rounds

### Fortune (🔮) -- 12 Fortune Games + WC Predictions

**Color:** Gold (`#FFD93D`)
**Tagline:** "PUFF YOUR FORTUNE"
**Renderer:** `renderOracle()` at line 8703

The Fortune zone combines luck-based mini-games with a sportsbook-style prediction system.

**Tabs:**
- **Sportsbook** -- World Cup match predictions (6 featured matches + specials: WC winner, top scorer, dark horse, group of death)
- **Fortune Games** -- 12 gambling/luck games

**Fortune Level System** (`FORTUNE_LEVELS`, line 36):

| Level | Title | Min Wager | Color |
|---|---|---|---|
| 1 | Bronze Gambler 🥉 | 0 | #CD7F32 |
| 2 | Silver Gambler 🥈 | 1,000 | #C0C0C0 |
| 3 | Gold Gambler 🥇 | 5,000 | #FFD700 |
| 4 | Platinum Player 💎 | 15,000 | #E5E4E2 |
| 5 | Diamond Dealer 💠 | 50,000 | #B9F2FF |
| 6 | High Roller 👑 | 200,000 | #FFD700 |

**Daily Jackpot:** Growing counter display with a Lucky Hour mechanic (random 2x multiplier period).

### Wall (🏆) -- Rankings & Glory

**Color:** Orange (`#FB923C`)
**Tagline:** "YOUR LEGACY . YOUR GLORY"
**Renderer:** `renderWall()` at line 9357

The Wall is the leaderboard and social hub.

**Tabs:**
- **Rankings** -- Filterable by: All, Arcade, Stage, Oracle, Tournament (each with 15 players in `WALL_LEADERBOARD`)
- **Records** -- 8 records with holders (`WALL_RECORDS`, line 417)
- **Activity** -- Live feed of player activities (`WALL_ACTIVITY`, line 427)
- **Achievements** -- Recent and rare achievement showcases (`WALL_ACHIEVEMENTS_RECENT`, `WALL_ACHIEVEMENTS_RARE`)
- **Friends** -- Social connections

**Champions Spotlight** (`WALL_CHAMPIONS`, line 465): Featured tournament champions with tournament name, player name, emoji, flag, and badge.

### World Cup 2026 (⚽) -- Limited Event

**Color:** Gold (`#FFD93D`)
**Tagline:** "PLAY . PREDICT . CELEBRATE"
**Renderer:** `renderWorldCupHub()` at line 9046

A complete FIFA World Cup 2026 simulation with 50 national teams.

**Tabs:**
- **Games** -- Play FK1/FK2/FK3 as your chosen nation
- **Live Matches** -- Simulated live match view with minute-by-minute events
- **Groups** -- 12 groups with standings tables
- **Bracket** -- Tournament bracket from Round of 32 to Final

**50 National Teams** (`WC_TEAMS`, line 506):
- CONCACAF: USA, Mexico, Canada
- CONMEBOL: Brazil, Argentina, Colombia, Uruguay, Ecuador, Peru, Paraguay
- UEFA: Germany, France, England, Spain, Portugal, Netherlands, Belgium, Italy, Croatia, Denmark, Switzerland, Austria, Serbia, Poland, Scotland, Wales, Turkey, Ukraine
- AFC: Japan, South Korea, Australia, Saudi Arabia, Iran, Qatar, Iraq, Uzbekistan, Indonesia, Bahrain
- CAF: Morocco, Senegal, Nigeria, Egypt, Cameroon, South Africa, Mali, DR Congo, Ivory Coast
- OFC: New Zealand
- Bonus: Vietnam, China

Each team has: `id`, `name`, `flag` (emoji), `group` (A--L), `rating` (1--5), `confederation`.

**12 Groups** (`WC_GROUPS`, line 781):
```
A: USA, Mexico, Canada, Ivory Coast
B: England, Italy, Australia, New Zealand
C: Argentina, France, Iran, Senegal
D: Netherlands, Belgium, Japan, Nigeria
E: Spain, Portugal, Indonesia, South Africa
F: Brazil, Germany, Saudi Arabia, Morocco
G: Croatia, South Korea, Ecuador, Egypt
H: Colombia, Uruguay, Uzbekistan, Cameroon
I: Poland, Ukraine, Peru, Mali
J: Denmark, Switzerland, Qatar, Iraq
K: Austria, Serbia, Turkey, DR Congo
L: Paraguay, Scotland, Wales, Bahrain
```

**Tournament Format:**
- Pick a team, play through Group Stage -> Knockout (R32 -> R16 -> QF -> SF -> Final)
- 6-hour cooldown between tournament runs
- Prizes: Champion 50K pts, Runner-Up 25K, Third 10K, Fourth 5K

**Live Matches** (`WC_LIVE_MATCHES`, line 808): Simulated live match data with minute-by-minute events (goals, cards, halftime), current score, viewer count, and next event preview.

---

## 6. Game Mechanics -- The Puff System

### Core Concept

The puff device (vape) is the game controller. **Puff duration** is the primary input -- how long you hold your puff determines the power/accuracy/outcome in every game.

### Puff Duration to Power Mapping (line 4634)

```
Time Held    Power     Zone        Description
---------    -----     ----        -----------
0--0.5s      0--15%    TAP         Barely a puff
0.5--1.5s    15--40%   SHORT       Quick hit
1.5--2.5s    40--70%   GOOD        Solid puff
2.5--3.5s    70--95%   PERFECT     Sweet spot (maximum control)
3.5--4.5s    95->75%   LONG        Held too long, power drops
5.0s+        ->30%     BLINKER     Device cutoff! Chaotic result
```

The power curve is non-linear -- it rises to a peak in the PERFECT zone (2.5--3.5s), then DROPS if you hold too long. A "blinker" (5+ seconds, which is the device's automatic cutoff) results in wild, unpredictable behavior.

### Sweet Spot Mechanic

Each round randomizes a "sweet spot" window within the puff bar:

```javascript
const randomizeSweetSpot = () => {
  const min = 40 + Math.random() * 25;  // 40--65% starting point
  const max = min + 15 + Math.random() * 15;  // +15--30% window width
  return { min: Math.round(min), max: Math.min(95, Math.round(max)) };
};
```

Hitting the sweet spot = PERFECT puff = maximum effectiveness. The sweet spot shifts every round so players cannot rely on muscle memory alone.

### Universal Puff Config (`UNIVERSAL_PUFF_CONFIG`, line 857)

```javascript
{
  blinkerThreshold: 95,  // 95%+ = blinker territory
  zones: [
    { name: "TAP",     max: 15,  color: "#555F85" },
    { name: "SHORT",   max: 40,  color: "#8892B8" },
    { name: "GOOD",    max: 65,  color: "#00E5FF" },
    { name: "PERFECT", max: 90,  color: "#7FFF00" },  // sweet spot (randomized)
    { name: "BLINKER", max: 100, color: "#FF4444" },
  ],
}
```

### Universal Puff Action Bar

Rendered by `renderUniversalPuffBar(power, charging, opts)` at line 4694. Displays:
- Power meter fill with color zones
- Sweet spot highlighted zone
- Current zone label
- Blinker warning at 95%+

### Puff Result Multipliers

```javascript
const getUniversalPuffResult = (power) => {
  // PERFECT zone: 1.5x multiplier, "PERFECT PUFF!" label
  // BLINKER (first time): 2.0x multiplier, "BLINKER BONUS!" label
  // BLINKER (used): 0.5x multiplier, "BLINKER BURNOUT" label
  // GOOD: 1.0x
  // SHORT/TAP: 0.5--0.75x
};
```

### Input Modes (line 910)

| Mode | Icon | Description |
|---|---|---|
| Auto | 🤖 | App auto-selects optimal input per game & device |
| Fixed | 📌 | Always use one input type you choose |
| Ask | ❓ | Prompts before each game |

### Input Types (line 915)

| Type | Icon | Description |
|---|---|---|
| Puff | 💨 | Real puff -- MIC + Heating ON |
| Dry Puff | 🌀 | MIC detect only -- Heating OFF |
| Button | 🔘 | Physical button press -- BLE signal |
| Tap | 👆 | Screen tap (fallback, no device needed) |

---

## 7. All Games -- Detailed Mechanics

### ARCADE GAMES (16)

#### 1. Final Kick (FK1) ⚽
**Type:** Skill | **Players:** 2 | **Time:** 1--2m | **Color:** Cyan
**Inputs:** puff, button, tap

Penalty kick 1v1. Best of 5 rounds, alternating shooter/keeper roles.

**Shoot phase:**
- Tap one of 6 goal zones (3 columns x 2 rows) to aim
- Puff to charge power (sweet spot = best chance to score)
- AI keeper dives to a random zone
- Same zone + failed puff = saved; different zone + perfect puff = GOAL

**Save phase:**
- Keeper POV -- see the AI's shot angle
- Tap a zone to dive
- Reaction time matters

**Scoring logic (kickExecute, line 4898):**
- Perfect puff zone: real chance to score (based on device pool save rate)
- Non-perfect puff: automatic fail (saved or missed)
- Blinker: always miss (ball "leaves the planet")
- TAP/SHORT: comedic miss commentary

#### 2. Final Kick 2 (FK2) ⚽🔥
**Type:** Precision | **Players:** 2 | **Time:** 2--3m | **Color:** Gold
**Inputs:** puff, button

Double puff system: Puff 1 controls horizontal aim (X-axis), Puff 2 controls vertical aim (Y-axis). The X+Y coordinates map to one of the 6 goal zones (3 cols x 2 rows). Both puffs in the sweet spot = "DOUBLE SWEET SPOT" bonus. Out of bounds detection if both puffs miss badly.

#### 3. Final Kick 3D (FK3) ⚽🌐
**Type:** 3D Precision | **Players:** 2 | **Time:** 2--3m | **Color:** Purple
**Inputs:** puff, button

Three.js-powered 3D behind-the-ball camera view. Same double-puff mechanics as FK2 but rendered in 3D perspective. The save phase shows a keeper's-eye-view with glove movement animation.

#### 4. Hot Potato 💣
**Type:** Luck | **Players:** 3--8 | **Time:** 1--3m | **Color:** Orange
**Inputs:** puff, button

A bomb jumps randomly between players. Puff to pass it to someone else. Timer decreases each round (making the game faster). When the timer expires, whoever holds the bomb is eliminated. Last alive wins.

#### 5. Russian Roulette 🎲
**Type:** Luck | **Players:** 2--6 | **Time:** 1--2m | **Color:** Red
**Inputs:** puff, button

Players take turns. 1 bullet in 6 chambers. Puff to pull the trigger. A power puff reduces your chance of being hit (dodge mechanic). Tension builds with each empty chamber click.

#### 6. Wild West Duel 🤠
**Type:** Reaction | **Players:** 2 | **Time:** 1--2m | **Color:** Gold
**Inputs:** puff, button, tap

Best of 5 showdown with full cinematic intro sequence:
1. **Enter** -- duelists approach (1.2s)
2. **Stats** -- compare records (1.2s)
3. **Countdown** -- 3... 2... 1... (2.1s)
4. **GO!** -- flash + crowd

Per round: Staredown (tension builds with progressive stages 0--3) -> "DRAW!" -> Puff as fast as possible. Reaction time measured in ms. Puff meter fills for bonus points (quick/power/legendary tiers). 6 AI opponents with different speeds (280ms--450ms): Sheriff Puffington, Quick Draw McGraw, Cactus Jack, Dusty Rhodes, Dynamite Dan, Whiskey Wilma.

#### 7. Balloon Pop 🎈
**Type:** Strategy | **Players:** 2--8 | **Time:** 1--3m | **Color:** Pink
**Inputs:** puff, button

Take turns inflating a balloon with puffs. Balloon has a hidden pop threshold. Each puff inflates it. Release to lock. The player who pops the balloon is eliminated. Last player standing wins. Strategy: small puffs are safe but slow, big puffs are risky.

#### 8. Puff Pong 🏓
**Type:** Skill | **Players:** 2 | **Time:** 1--2m | **Color:** Green
**Inputs:** puff, tap

Real-time pong at 60fps (uses `requestAnimationFrame`). Puff = move paddle up. Release = paddle falls with gravity. Rally counter for bonus points. Ball speed increases over time. First to 5 points wins.

#### 9. Rhythm Puff 🎵
**Type:** Rhythm | **Players:** 1--4 | **Time:** 1--3m | **Color:** Purple
**Inputs:** puff, button

Guitar Hero-style note highway. Notes fall in 3 lanes (Short, Medium, Long puffs). Puff on beat = points. Ratings: Perfect / Great / Good / Miss. Combo multiplier builds with consecutive hits. Blinker puff = mega bonus.

#### 10. Tug of War 💪
**Type:** Team | **Players:** 2--8 | **Time:** 30s--1m | **Color:** Blue
**Inputs:** puff, button

Two teams puff continuously. Each puff moves the rope. Rope position tracked 0--100 (50 = center). Physics simulation with surge mechanic (power puffs move more). Sudden death if tied at timer end.

#### 11. Hooked 🎣
**Type:** Skill | **Players:** 1 | **Time:** 2--5m | **Color:** Blue
**Inputs:** puff, button

Stack fishing game with 8 fish types (`HOOK_FISH`, line 877):

| Fish | Rarity | Points | Zone Width | Resistance |
|---|---|---|---|---|
| Blue Snap 🐟 | Common | 10 | 35 | 0.8 |
| Lunar Carp 🐠 | Common | 10 | 33 | 0.9 |
| Pond Darter 🐡 | Common | 10 | 38 | 0.7 |
| Neon Koi 🎏 | Rare | 25 | 22 | 1.2 |
| Glitch Fin 🦈 | Rare | 25 | 20 | 1.4 |
| Gold Pike 🐊 | Rare | 25 | 24 | 1.1 |
| Void Eel 🐉 | Legendary | 60 | 13 | 1.8 |
| Abyssal Ray 🦑 | Legendary | 60 | 12 | 2.0 |

Puff to reel in fish. Keep the reel marker inside the "zone" -- going outside increases line tension. Too much tension = fish escapes. Higher rarity fish have smaller zones and higher resistance.

#### 12. Puff RPS ✊
**Type:** Strategy | **Players:** 2 | **Time:** 1--2m | **Color:** Purple
**Inputs:** puff, button

Rock Paper Scissors with puff power. Choose your move (R/P/S), then puff for power. Higher puff power = bonus points on win. Best of 5.

#### 13. Beat Drop 🎧
**Type:** Music | **Players:** 1 | **Time:** 3--5m | **Color:** Pink
**Inputs:** puff

Hold your puff while the beat builds. Release exactly when the beat drops. Scoring based on timing accuracy: PERFECT (within 0.2s), GREAT (0.5s), GOOD (1.0s), LATE, EARLY. Blinker during a good drop = +50 bonus. Uses Web Audio API oscillators for the music buildup.

#### 14. Puff Clock ⏱️
**Type:** Precision | **Players:** 1--100+ | **Time:** 3--5m | **Color:** Orange
**Inputs:** puff

Puff for EXACTLY the target duration (e.g., 2.00s, 3.50s, 4.20s). Closest to target wins. The 4.20s round is a special bonus round (worth double in tournaments). No visual timer shown -- pure internal clock.

#### 15. Puff Limbo 🎪
**Type:** Endurance | **Players:** 1--50 | **Time:** 3--5m | **Color:** Orange
**Inputs:** puff

Target puff duration increases each round (3.0s -> 3.5s -> 4.0s -> 4.2s -> 4.5s -> 4.7s -> 5.0s). Fall short of the target = eliminated. Survive the 5.0s blinker round to win. Tournament format has 7 rounds.

#### 16. Puff Derby 🏇
**Type:** Racing | **Players:** 6 | **Time:** 2--3m | **Color:** Green
**Inputs:** puff

Pick one of 6 horses. Spam puff to make your horse run. Each puff advances the horse. But watch stamina -- the horse tires over time. AI horses race alongside with varying speeds. First horse past the finish line wins. 3 races in tournament format with total finishing positions determining final ranking.

### STAGE SHOWS (6)

All stage shows use the **elimination engine** (8 players, 7 AI contestants), **MC commentary system** (template strings with dynamic substitution), and the **role system** (contestant vs audience).

#### 1. Vibe Check 🧠
**Type:** Trivia | **Time:** 5--15m

Multiple choice trivia. 10-second timer per question. Wrong answer = eliminated. Questions drawn from `VC_QUESTIONS_V2` (line 280) covering football, WC history, stadiums, and records.

#### 2. Higher or Lower 📊
**Type:** Knowledge | **Time:** 5--10m

A number is shown. Is the next number higher or lower? Streak bonus multiplier for consecutive correct answers. Elimination on wrong guess.

#### 3. Price is Puff 💰
**Type:** Knowledge | **Time:** 5--10m

Guess product prices using your puff to control a price slider. Puff duration maps to the price range. Closest guess wins the round.

#### 4. Survival Trivia 🏆
**Type:** Trivia | **Time:** 5--15m

Trivia with progressive elimination. Questions get harder each round. Last one standing wins. Unlike Vibe Check, this uses the full elimination bracket.

#### 5. Simon Puffs 🔴
**Type:** Memory | **Time:** 3--8m

Memory pattern game. Watch a sequence of puffs: Short (< 1s, cyan), Medium (1--2.5s, gold), Long (2.5s+, pink). Repeat the pattern with your own puffs. Sequence grows each round. Comedy commentary per round from `SP_COMEDY` (line 891).

#### 6. Puff Auction 🔨
**Type:** Strategy | **Time:** 3--8m

Bid on prizes with puff duration. Biggest puff wins the item. But puff over the threshold and you're disqualified! Strategy: bid high enough to win but not so high you bust. Prizes range from 100 coins (common) to MYSTERY BOX 1000 coins (legendary) from `PA_PRIZES` (line 899).

### FORTUNE GAMES (12)

All fortune/luck based. Use puff for interaction. Win or lose coins.

#### 1. Crystal Ball 🔮
Yes/No predictions on fun questions. Puff to shake the crystal ball. Ball reveals answer with mystical animation.

#### 2. Strain Battle 🌿
Vote between two cannabis strains in bracket-style matchups. 16 strains (`SB_STRAINS`, line 232) with THC%, type (Indica/Sativa/Hybrid), effects, and flavor profiles.

#### 3. Match Predictor 📊
Predict World Cup match outcomes (Win/Draw/Lose). 6 featured matches from `ORACLE_WC_MATCHES` (line 187) + 4 special predictions (WC winner, top scorer, dark horse, group of death).

#### 4. Daily Picks 📅
3 daily prediction questions with streak multipliers. Categories: morning/afternoon/night. Questions from `DP_QUESTIONS` (line 262) -- yes/no or A/B format covering crypto, cannabis, sports, and culture.

#### 5. Puff Slots 🎰
3-reel slot machine. Puff to spin the reels. Match symbols to win multiplied coins.

#### 6. Puff Blackjack 🃏
Classic blackjack. Puff = hit, hold = stand. Standard blackjack rules with dealer AI.

#### 7. Coin Flip 🪙
50/50 coin flip. Puff confidence (duration) determines the multiplier on your bet.

#### 8. Craps & Clouds 🎲
Dice game. Puff controls the roll force, which affects (cosmetically) the dice result.

#### 9. Mystery Box 🎁
3 mystery boxes. Pick one. Puff to reveal the prize inside. Prizes vary from small coins to jackpots.

#### 10. Scratch & Puff 🎫
6 scratch areas. Puff to scratch each one. Match 3 identical symbols to win.

#### 11. Fortune Cookie 🥠
Crack open fortune cookies. Each cookie contains wisdom text + coins. Blinker puff = golden cookie (rare, high reward).

#### 12. Treasure Map 🗺️
16-tile grid. Find 3 hidden treasures. Avoid 3 hidden bombs. X-ray power-up reveals adjacent tiles. Strategy meets luck.

---

## 8. Tournament System

### World Cup Tournaments (Final Kick Games)

**Format:** Group Stage -> Knockout (Round of 32 -> Round of 16 -> Quarterfinals -> Semifinals -> Final)

- Pick one of 50 national teams
- Play Final Kick (FK1, FK2, or FK3) matches through the bracket
- 6-hour cooldown between tournament runs
- Group stage: 4 teams per group, top 2 advance

**Prizes:**

| Finish | Points | Coins |
|---|---|---|
| Champion 🏆 | 50,000 | -- |
| Runner-Up 🥈 | 25,000 | -- |
| Third Place 🥉 | 10,000 | -- |
| Fourth Place | 5,000 | -- |

### Game-Specific Tournaments (`GAME_TOURNAMENTS`, line 674)

Each non-FK game has its own unique tournament format with themed teams:

| Game | Tournament Name | Format | Duration |
|---|---|---|---|
| Wild West | The Outlaw Circuit 🤠 | 16-player Single Elimination | ~30 min |
| Russian Roulette | The Underground 🎲 | Survival Series (4 Tables -> Final) | ~20 min |
| Balloon Pop | Puff Fest 🎈 | Party Rounds (3 Heats + Final) | ~15 min |
| Puff Pong | Neon League 🏓 | Swiss System (4 Rounds + Final) | ~25 min |
| Rhythm Puff | Tour de Puff 🎵 | Score Chase (3 Songs) | ~15 min |
| Tug of War | The Puff Games 💪 | Round Robin Teams (4 Teams) | ~20 min |
| Hot Potato | Bomb Squad Cup 💣 | Heats + Grand Final | ~15 min |
| Puff RPS | Dojo Championship ✊ | Double Elimination (16 Players) | ~30 min |
| Hooked | Deep Sea Masters 🎣 | Catch Competition (3 Sessions) | ~10 min |
| Beat Drop | The Drop Zone 🎧 | Score Chase (3 Songs) | ~15 min |
| Puff Clock | Time Masters ⏱️ | Precision Tournament (5 Rounds) | ~20 min |
| Puff Limbo | Limbo Legends 🎪 | Survival (7 Rounds) | ~15 min |
| Puff Derby | Grand Derby 🏇 | Race Series (3 Races) | ~10 min |

All tournaments award the same prize structure:

| Place | Points | Coins | Example Label (varies per game) |
|---|---|---|---|
| Gold | 30,000 | 800 | Sheriff's Badge / Diamond Chip / Golden Rod |
| Silver | 15,000 | 400 | Deputy Star / Gold Chip / Silver Hook |
| Bronze | 7,500 | 200 | Wanted Poster / Silver Chip / Bronze Reel |
| Fourth | 3,000 | 100 | Bounty Hunter / Survivor / Deckhand |

### Themed Teams (`GAME_TEAMS`, line 567)

Each game has 6 themed teams players can join. Examples:

**Wild West:** Puff Bandits, Blinker Boys, Smoke Signal Posse, Cactus Cartel, Gold Rush Gang, The Tumbleweeds

**Rhythm Puff:** Rolling Clouds, Puff Daddy & Fam, Blinker Beats, 420 Hz, Bass Drops, Smoke Machine

**Puff Derby:** Thunder Stable, Cloud Riders, Sativa Sprint, Blinker Bolt, Indica Cruise, Hybrid Hustle

---

## 9. Social Features

### Live Spectator System

40 spectator names (`SPECTATOR_NAMES`, line 55) like "Puff_Master_420", "Blinker_Betty", "CloudChaser99" appear in:
- Live ticker messages scrolling across the screen
- Spectator overlay during games
- Chat messages

20 spectator emojis (`SPECTATOR_EMOJIS`, line 65) and 10 ticker message templates (`SPECTATOR_TICKER_MSGS`, line 66).

### Chat System

- **Global chat:** Hub lobby chat with bot messages from `CHAT_BOTS` (line 907) using `CHAT_MSGS` templates
- **In-game chat:** Side chat during active games (your side vs AI side)
- **Post-game chat:** Available for 10 minutes after a match
- **Quick reactions:** 8 emoji buttons (🔥 😂 🤯 👏 💀 ❤️ ⚽ 🏆)
- **Text input:** Free-form message entry

### Puff Reactions

Live puff reactions during games -- floating bubbles showing puff intensity and emoji reactions from spectators.

### Audience System (Stage Zone)

- Pick a side (you vs AI contestant)
- Switch sides mid-show ("traitor!" label)
- Fan predictions on round outcomes
- Break-time interactions between elimination rounds

### Achievements (`ACHIEVEMENTS`, line 472)

12 achievements, 5 common + 7 rare:

| Achievement | Description | Emoji | Rare? |
|---|---|---|---|
| First Puff | Puff for the first time | 💨 | No |
| Winner! | Win your first game | 🏆 | No |
| Blinker King | Hit 10 blinkers | 💀 | No |
| Sweet Spot Merchant | Hit 50 perfect puffs | 🎯 | No |
| Puff Marathon | Puff for 420 total seconds | 🏃 | Yes |
| Weekly Warrior | 7-day puff streak | 🔥 | Yes |
| Arcade Master | Play all 16 games | 🎮 | Yes |
| Champion | Win any tournament | 👑 | Yes |
| Crowd Surfer | Trigger 10 Puff Waves | 🌊 | Yes |
| Living Legend | Reach Legendary rank | ⭐ | Yes |
| The 420 | Have exactly 420 total puffs | 🌿 | Yes |
| Iron Lungs | Hit 100 blinkers | 🫁 | Yes |

### Rank System (`RANKS`, line 488)

| Rank | Emoji | Color | Min XP |
|---|---|---|---|
| Bronze | 🥉 | #CD7F32 | 0 |
| Silver | 🥈 | #C0C0C0 | 500 |
| Gold | 🥇 | #FFD700 | 2,000 |
| Platinum | 💎 | #E5E4E2 | 5,000 |
| Diamond | 💠 | #B9F2FF | 15,000 |
| Legendary | ⭐ | #FFD700 | 50,000 |

### Streak Rewards (`STREAK_REWARDS`, line 498)

| Days | Coins | Label |
|---|---|---|
| 3 | 100 | 3-Day Bonus |
| 7 | 500 | Weekly Warrior |
| 14 | 1,500 | Two-Week Terror |
| 30 | 5,000 | Monthly Monster |

### Badges (`BADGES`, line 322)

8 badges: First Win 🏅, 5 Streak 🔥, Show Star ⭐, Predictor 🔮, Bracket King 👑, 100 Games 💯, WC Champion 🏆, Social 🦋

---

## 10. Sound System

### Architecture

The sound system is built on `playFx()` (line 3101), a `useCallback`-wrapped function that handles all audio in the app.

**Two sound sources:**

1. **Audio files** (3 files in `assets/arena/`):
   - `win.m4a` (88 KB) -- victory fanfare
   - `lose.m4a` (147 KB) -- defeat sound
   - `laugh.m4a` (58 KB) -- comedy/blinker sound

2. **Web Audio API synthesis** -- all other sounds are generated in real-time using oscillators and noise buffers

### Synthesis Helpers

Two helper functions inside `playFx`:

- **`tone(freq, waveType, start, dur, vol, freqEnd)`** -- Creates an oscillator with gain envelope. Supports frequency ramps via `exponentialRampToValueAtTime`.
- **`noise(start, dur, vol)`** -- Creates a white noise burst using a buffer filled with random samples.

### Sound Categories

**Universal UI:**
- `tap` / `button_tap` -- Short high-frequency click (800Hz + 1200Hz sine)
- `select` -- Two-tone selection (600Hz + 900Hz sine)
- `nav` -- Ascending frequency ramp (440 -> 660Hz sine)
- `back` / `button_back` -- Descending frequency ramp (600 -> 300Hz sine)
- `coin_collect` / `coins` -- Three ascending tones (1200 -> 1600 -> 2000Hz)
- `level_up` / `rank_up` -- Four ascending tones (C5 -> E5 -> G5 -> C6)
- `notification` / `ping` -- Two high tones (880Hz + 1100Hz)
- `error` / `wrong` -- Low sawtooth buzz (200Hz + 150Hz)
- `countdown_tick` -- Single tick (800Hz sine, 40ms)
- `countdown_go` -- Three ascending tones with noise burst
- `blinker` -- Three repeated low square tones (300Hz)
- `success` -- Two ascending tones (C5 -> G5)

**Football / Kick:**
- `kick` -- Low thud (150Hz triangle descending) + noise
- `goal` -- Three ascending square tones (C5 -> E5 -> G5)
- `save` -- Two ascending triangle tones (400Hz -> 600Hz)
- `whistle` -- High sustained sine (2800Hz + 3200Hz)
- `charge` -- Slow ascending sine (200 -> 1200Hz over 1.5s)
- `crowd` / `crowd_cheer` -- White noise + low sawtooth

**Game-Specific:**
- Wild West: `gunshot`, `gun_click`, `gun_bang`, `revolver_spin`
- Balloon Pop: `balloon_inflate`, `balloon_pop`
- Puff Pong: `pong_hit`, `pong_wall`, `pong_score`
- Rhythm Puff: `rhythm_hit`, `rhythm_miss`, `rhythm_perfect`
- Tug of War: `rope_pull`, `rope_snap`, `mud_splash`
- Hot Potato: `bomb_tick`, `bomb_explode`, `bomb_pass`

**Global toggle:** `audioOn` state controls whether any sound plays. When `false`, `playFx` returns immediately.

---

## 11. Visual Effects

### Screen Shake (`triggerShake`, line 3557)

Sets `screenShake` state to `true` for 500ms. Applied as a CSS `animation: shake 0.5s` on the root container. The `shake` keyframe applies translateX jitter (-4px to +4px) with slight rotation.

### Screen Flash (`triggerFlash`, line 3556)

Sets `screenFlash` to a type string ("goal", "miss", "save", "blinker") for 400ms. Renders a full-screen color overlay using the `flashOverlay` keyframe (opacity 0.8 -> 0). Flash colors vary by type.

### Confetti Particles (`spawnConfetti`, line 3558)

Spawns an array of colored particle objects with random positions, sizes, colors, and rotations. Animated via `confettiFall` keyframe -- particles fall 400px with rotation over their lifetime.

```javascript
const spawnConfetti = (count=30, colors=[C.cyan, C.gold, C.green, C.pink, C.orange]) => {
  // Creates particles with: id, x (0-100%), y (-10 to -20%), size (4-8px), color, rotation
};
```

### Smoke Particles (`spawnSmoke`, line 3566)

Creates cloud-like smoke particles. Animated via `smokeRise` keyframe -- particles scale from 0.5 to 2.5 and rise 150px while fading.

### Puff Wave (`triggerPuffWave`, line 3574)

Full-screen wave effect. Sets `puffWaveActive` for 3 seconds with smoke. Animated via `puffWaveSweep` keyframe -- wave sweeps from bottom to top.

### Puff Bubbles

Floating bubbles that appear during puff charging. Random sizes, positions, and float speeds.

### Audience Bubbles

Random audience reaction bubbles that float up during games. Animated via `bubbleFloat` -- rise 200px while shrinking and fading.

### Match Intro Sequence (`startMatchIntro`, line 4516)

Four-phase cinematic intro before Final Kick matches:
1. **Enter** -- opponent walks on screen
2. **Stats** -- show player vs opponent stats
3. **Countdown** -- 3... 2... 1...
4. **Go!** -- flash + crowd cheer

### Commentator Text

Dynamic commentary appears during games. Set via `setCommentary()` / `setKickComment()` with randomized phrases from curated arrays of comedic text.

### Dim Lights (`dimLights`, line 1369)

Screen dims during puff charging for dramatic focus. Applied as an overlay that reduces brightness.

---

## 12. BLE Device Integration

### Web Bluetooth API

The app uses the Web Bluetooth API to connect to BLE-enabled vape devices. Connection flow:
1. User selects a device model from `DEVICE_MODELS`
2. BLE popup shows connection UI (`renderBlePopup`, line 20752)
3. After connection, device optimization screen shows calibration (`renderDeviceOptimize`, line 20842)
4. Input type is resolved for the connected device

### Device Models (`DEVICE_MODELS`, line 921)

| ID | Name | Short | Pool | Emoji |
|---|---|---|---|---|
| cc_s1 | Cali Clear Season 1 | CC S1 | Standard | 📱 |
| cc_s2 | Cali Clear Season 2 | CC S2 | Standard | 📱 |
| cc_s3 | Cali Clear Season 3 | CC S3 | Standard | 📱 |
| cc_sel1 | Cali Clear Select S1 | CC Select S1 | Select | ✨ |
| cc_sel2 | Cali Clear Select S2 | CC Select S2 | Select | ✨ |
| none | No Device | Tap Only | Open | 👆 |

### Device Pools (`DEVICE_POOLS`, line 929)

Pools determine matchmaking fairness and reward multipliers:

| Pool | Label | Color | AI Save Rate | AI Score Rate | Reward Multiplier |
|---|---|---|---|---|---|
| Select | Select Pool | Gold | 0.38 | 0.58 | 2x |
| Standard | Standard Pool | Cyan | 0.30 | 0.50 | 1.5x |
| Open | Open Pool | Gray | 0.20 | 0.40 | 1x |

**Select Pool** devices get harder AI (higher save rate) but double rewards. **Open Pool** (no device) gets easiest AI but base rewards only.

### Input Resolution

The `resolveInputForGame()` function determines which input type to use for each game based on:
1. The selected input mode (Auto/Fixed/Ask)
2. The connected device
3. The game's supported input types
4. Previous session choice (remembered across games)

### Session Input Memory

Once a player selects an input type for a session, it is remembered and reused for subsequent games in the same session, avoiding repeated selection prompts.

---

## 13. Key Functions Reference Table

| Function | Line | Purpose |
|---|---|---|
| `MoodLabArena()` | 957 | Main React component -- the entire app |
| `startMatch(game, mode)` | 2727 | Game dispatcher -- handles matchmaking flow and routes to game-specific initializer |
| `startKick(gameId)` | 4590 | Initializes Final Kick game (FK1/FK2/FK3) |
| `kickSelectZone(zone)` | 4620 | Handles zone aim selection in FK |
| `kickExecute(zone, power, wasBlinker, holdTime)` | 4898 | Executes an FK shot -- calculates goal/save/miss outcome |
| `startDuel()` | 2739 | Initializes Wild West Duel game |
| `startDuelRound(roundNum)` | 2784 | Starts a duel round with staredown + draw sequence |
| `playFx(type, vol)` | 3101 | Sound engine -- synthesized audio or file playback |
| `triggerFlash(type)` | 3556 | Screen flash effect |
| `triggerShake()` | 3557 | Screen shake effect |
| `spawnConfetti(count, colors)` | 3558 | Spawn confetti particle burst |
| `spawnSmoke(count)` | 3566 | Spawn smoke particle cloud |
| `triggerPuffWave()` | 3574 | Full-screen puff wave sweep |
| `startMatchIntro(opponent)` | 4516 | Cinematic match intro sequence |
| `getPuffPower(elapsed)` | 4643 | Maps puff hold duration (seconds) to power percentage (0--100) |
| `getPuffZone(power)` | 4654 | Maps power to zone label (tap/short/good/perfect/long) |
| `getUniversalPuffZone(power)` | 4667 | Maps power to universal zone with sweet spot awareness |
| `getUniversalPuffResult(power)` | 4676 | Returns full puff result object (zone, multiplier, label, color, emoji) |
| `renderUniversalPuffBar(power, charging, opts)` | 4694 | Renders the universal puff action bar UI |
| `renderAtmosphere()` | 5851 | Renders atmospheric visual effects for current zone |
| `renderTicker()` | 5876 | Renders scrolling news ticker |
| `renderGlassButtons()` | 5919 | Renders floating glass side buttons |
| `renderInlineChat()` | 5938 | Renders inline chat panel |
| `renderFocusContent(viewKey)` | 5975 | Renders zone focus/welcome screen content |
| `renderZoneFocus(viewKey)` | 6146 | Renders full zone focus view with background image/video |
| `renderPuffEvent()` | 6425 | Renders puff event overlay |
| `renderHalftime()` | 6693 | Renders halftime mini-game screen |
| `renderArenaHub()` | 6949 | Renders the main arena hub (all 5 zones) |
| `renderZoneHeader(zKey)` | 7181 | Renders zone header with back button and tagline |
| `renderArcade()` | 7217 | Renders the Arcade zone (16 games) |
| `renderStage()` | 7505 | Renders the Stage zone (6 shows) |
| `renderOracle()` | 8703 | Renders the Fortune zone (sportsbook + 12 games) |
| `renderWorldCupHub()` | 9046 | Renders the World Cup zone (teams, groups, bracket, live) |
| `renderWall()` | 9357 | Renders the Wall zone (rankings, records, activity, achievements) |
| `window.__moodlabGoBack()` | 9679 | Smart back navigation (registered on window for HTML button) |
| `cleanupAllGames()` | 9730 | Clears all game intervals, timeouts, refs, and animation frames |
| `STAGE_CONTESTANTS` | 9824 | AI contestant data for Stage elimination engine |
| `initStageElim()` | 9834 | Initializes 8-player Stage elimination bracket |
| `elimRound(yourScore)` | 9840 | Processes an elimination round (scores, eliminates, advances) |
| `renderContestantGrid()` | 9871 | Renders the contestant status grid during Stage shows |
| `startSimonPuffs()` | 10983 | Initializes Simon Puffs memory game |
| `renderGameChatPanel(gameName)` | 11342 | Renders in-game chat panel |
| `renderSpectatorOverlay()` | 11378 | Renders live spectator overlay |
| `renderGameOverlay()` | 11443 | Master game overlay renderer -- dispatches to per-game renderers |
| `renderFanMode()` | 19291 | Renders fan mode overlay |
| `renderWorldCup()` | 19750 | Renders World Cup tournament flow (team select -> group -> knockout) |
| `renderVibeCheck()` | 20403 | Renders Vibe Check game show |
| `renderSpin()` | 20630 | Renders Spin & Win fortune wheel |
| `renderBlePopup()` | 20752 | Renders BLE device connection popup |
| `renderDeviceOptimize()` | 20842 | Renders device optimization/calibration screen |
| `renderPuffLock()` | 20959 | Renders puff lock-in animation |
| `renderInputPanel()` | 20976 | Renders input type selection panel |
| `renderControl()` | 21016 | Renders Control tab (device settings) |
| `renderLive()` | 21060 | Renders Live tab (coming soon) |
| `renderProfileOverlay()` | 21146 | Renders player profile overlay |
| `renderAchievementsOverlay()` | 21231 | Renders achievements gallery overlay |
| `renderMe()` | 21266 | Renders Me tab (stats, badges, settings) |

---

## 14. Data Constants Reference

| Constant | Line | Description | Size |
|---|---|---|---|
| `ARENA_IMAGES` | 10 | Zone background image paths | 6 entries |
| `ARENA_VIDEOS` | 18 | Zone background video paths | 6 entries |
| `Z` | 28 | Zone theme configs (primary, glow, dim, name, icon, sub) | 5 zones |
| `FORTUNE_LEVELS` | 36 | Fortune tier system | 6 tiers |
| `C` | 45 | Color palette | 20 colors |
| `SPECTATOR_NAMES` | 55 | Live spectator usernames | 40 names |
| `SPECTATOR_EMOJIS` | 65 | Spectator emoji reactions | 20 emojis |
| `SPECTATOR_TICKER_MSGS` | 66 | Ticker message templates | 10 messages |
| `GLASS_CLEAR` | 82 | Glass style for nav/buttons | 1 style object |
| `GLASS_CARD` | 90 | Glass style for content panels | 1 style object |
| `LG` | 97 | Liquid Glass system (base, thick, pill, tinted) | 4 variants |
| `PLAY_GAMES` | 133 | Arcade game definitions | 16 games |
| `SHOW_GAMES` | 152 | Stage show definitions | 6 shows |
| `MC_LINES` | 162 | MC commentary templates | 7 categories |
| `ORACLE_GAMES` | 172 | Fortune game definitions | 12 games |
| `ORACLE_WC_MATCHES` | 187 | WC prediction matches | 6 matches |
| `ORACLE_WC_SPECIALS` | 196 | WC special predictions | 4 specials |
| `ORACLE_FUN_PREDS` | 203 | Fun prediction questions | 8 questions |
| `CB_PREDICTIONS` | 214 | Crystal Ball predictions | 15 predictions |
| `SB_STRAINS` | 232 | Cannabis strain data | 16 strains |
| `MP_MATCHES` | 251 | Match Predictor matches | 8 matches |
| `DP_QUESTIONS` | 262 | Daily Picks questions | 15 questions |
| `VC_QUESTIONS_V2` | 280 | Vibe Check trivia (English) | 8 questions |
| `PREDICT_TYPES` | 291 | Prediction type definitions | 6 types |
| `MATCHES` | 300 | Quick match data | 3 matches |
| `LEADERBOARD` | 306 | Quick leaderboard | 7 players |
| `TOURNAMENTS` | 316 | Featured tournaments | 3 tournaments |
| `BADGES` | 322 | Player badges | 8 badges |
| `WALL_LEADERBOARD` | 330 | Full leaderboard data (all/arcade/stage/oracle/tournament) | 5 categories x 15 players |
| `WALL_RECORDS` | 417 | Records with holders | 8 records |
| `WALL_ACTIVITY` | 427 | Live activity feed | ~10 activities |
| `WALL_ACHIEVEMENTS_RECENT` | 441 | Recent achievement showcases | ~5 entries |
| `WALL_ACHIEVEMENTS_RARE` | 448 | Rare achievement showcases | ~5 entries |
| `WALL_CHAMPIONS` | 465 | Tournament champions spotlight | 3 champions |
| `ACHIEVEMENTS` | 472 | Achievement definitions | 12 achievements |
| `RANKS` | 488 | Rank tier definitions | 6 ranks |
| `STREAK_REWARDS` | 498 | Daily streak reward tiers | 4 tiers |
| `WC_TEAMS` | 506 | World Cup national teams | 50 teams |
| `GAME_TEAMS` | 567 | Themed tournament teams per game | 13 games x 6 teams |
| `GAME_TOURNAMENTS` | 674 | Unique tournament format per game | 13 tournaments |
| `WC_GROUPS` | 781 | World Cup group assignments | 12 groups |
| `WC_LIVE_MATCHES` | 808 | Simulated live match data | 2 live matches |
| `WC_2026_GROUPS` | 842 | WC group standings (simplified) | 4 groups |
| `VC_QUESTIONS` | 849 | Vibe Check trivia (Vietnamese) | 5 questions |
| `UNIVERSAL_PUFF_CONFIG` | 858 | Puff bar config + sweet spot randomizer | 1 config |
| `HOOK_FISH` | 877 | Fish types for Hooked game | 8 fish |
| `SP_PUFF_TYPES` | 890 | Simon Puffs puff type definitions | 3 types |
| `SP_COMEDY` | 891 | Simon Puffs round commentary | 10 lines |
| `PA_PRIZES` | 899 | Puff Auction prize pool | 5 prizes |
| `CHAT_BOTS` | 907 | Chat bot usernames | 7 bots |
| `CHAT_MSGS` | 908 | Chat message templates | 10 messages |
| `INPUT_MODES` | 910 | Input mode definitions | 3 modes |
| `INPUT_TYPES` | 915 | Input type definitions | 3 types |
| `DEVICE_MODELS` | 921 | BLE device model definitions | 6 models |
| `DEVICE_POOLS` | 929 | Device matchmaking pool configs | 3 pools |
| `KICK_ZONES` | 934 | Goal zone grid (3x2) | 6 zones |
| `USER` | 939 | Default user profile | 1 object |
| `TICKER_ITEMS` | 942 | News ticker messages | 8 messages |
| `DUEL_OPPONENTS` | 1035 | Wild West AI opponents | 6 opponents |
| `STAGE_CONTESTANTS` | 9824 | Stage show AI contestants | 7 contestants |

---

## 15. Deployment & Testing

### Vercel Deployment

**Production URL:** `moodlab-arena-demo-v2.vercel.app`

Deployment is standard Vercel static hosting. No build command needed -- Vercel serves the files as-is. The project root contains:
- `index.html` -- entry point
- `moodlab-arena-v6.jsx` -- loaded at runtime
- `assets/` -- images, videos, sounds

Push to the Git repo and Vercel auto-deploys.

### Local Development Server

The `serve.sh` script starts a Python SimpleHTTPServer:

```bash
#!/bin/bash
cd "$(dirname "$0")"
PORT="${PORT:-8093}"
python3 -c "
import http.server, socketserver, os
os.chdir('$(pwd)')
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('', $PORT), handler) as httpd:
    print(f'Serving on port $PORT')
    httpd.serve_forever()
"
```

Run with `./serve.sh` and visit `http://localhost:8093`.

### Phone Frame

The app renders inside a 430x932px container (iPhone 14 Pro Max viewport dimensions):

```css
#root {
  width: 430px;
  height: 932px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
  background: #050510;
}
```

On desktop (viewport > 430px), a phone-shaped frame with rounded corners (40px) and shadow is applied. On mobile (viewport <= 430px), the container goes full-screen.

### Cache Busting

The JSX file is fetched with a timestamp query parameter to bust caches:

```javascript
fetch('moodlab-arena-v6.jsx?v=' + Date.now())
```

This ensures fresh code on every page load during development, with no stale cached versions.

### No Build Step Workflow

1. Edit `moodlab-arena-v6.jsx` in your preferred editor
2. Save the file
3. Refresh the browser (Babel recompiles on load)
4. For production: `git push` -- Vercel deploys automatically

There is no `npm install`, no `npm run build`, no bundling step. The tradeoff is a brief compilation pause on page load (Babel processes 21,608 lines), but this is acceptable for a demo application.

### Testing Notes

- **BLE testing** requires a real BLE-enabled device or Chrome's bluetooth simulation flags
- **Audio testing** requires user gesture (click/tap) before Web Audio API will play (browser autoplay policy)
- **3D testing** (FK3) requires WebGL support
- **Mobile testing** is best done on iOS Safari or Android Chrome at 430px viewport width
- All game mechanics can be tested with "Tap Only" (no device) input mode, which auto-generates puff values

---

## Appendix: File Statistics

| Metric | Value |
|---|---|
| Total lines of code | 21,608 |
| useState hooks | 530 |
| useRef hooks | 95 |
| @keyframes animations | 87 |
| Total games | 34 (16 arcade + 6 stage + 12 fortune) |
| National teams | 50 |
| WC groups | 12 |
| Tournament formats | 13 |
| Themed team sets | 13 x 6 = 78 teams |
| Sound effects | 90+ synthesized + 3 audio files |
| AI opponents (duel) | 6 |
| AI contestants (stage) | 7 |
| Fish types | 8 |
| Cannabis strains | 16 |
| Spectator names | 40 |
| Achievements | 12 |
| Rank tiers | 6 |
| Fortune levels | 6 |
| Asset files | 15 (6 PNG + 6 MP4 + 3 M4A) |
| Total asset size | ~52 MB |
