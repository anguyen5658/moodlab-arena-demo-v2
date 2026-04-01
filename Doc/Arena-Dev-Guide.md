# Mood Lab Arena -- Developer Guide

> Arena-only reference for the gaming platform. The loyalty/progression system is documented separately.

---

## 1. Project Overview

### Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | React 18 + ReactDOM | Loaded from CDN (`esm.sh`) |
| Transpilation | Babel Standalone 7 | In-browser JSX transpile, zero build step |
| 3D | Three.js r158 | CDN-loaded, used for Final Kick 3D only |
| Audio | Web Audio API | All game sounds synthesized at runtime |
| Device I/O | Web Bluetooth API | Cali Clear vaporizer BLE integration |
| Styling | Inline React styles | Glass-morphism design system, no CSS files |
| Deployment | Vercel / any static host | Single HTML entry point |

### Single-File Architecture

The entire application lives in one file:

```
moodlab-arena-v6.jsx   ~22,484 lines
```

There is no component splitting, no routing library, no state management library, no CSS files.
The browser loads `index.html`, which pulls CDN dependencies and feeds `moodlab-arena-v6.jsx` to Babel Standalone for on-the-fly transpilation.

### Partnership

Mood Lab Arena is built for **Cali Clear** -- a cannabis vaporizer brand. The device serves as the physical game controller. All "puff" mechanics map to real vaporizer usage via BLE. The platform gamifies the product experience.

### Running Locally

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Then open http://localhost:8080
```

No `npm install`, no build step, no bundler.

---

## 2. Architecture

### File Structure

```
.
├── index.html                  # Entry point, CDN script tags
├── moodlab-arena-v6.jsx        # Entire application (22,484 lines)
├── assets/arena/
│   ├── hub.png / hub.mp4       # Zone thumbnails + background videos
│   ├── arcade.png / arcade.mp4
│   ├── stage.png / stage.mp4
│   ├── oracle.png / oracle.mp4
│   ├── wall.png / wall.mp4
│   ├── worldcup.png / worldcup.mp4
│   ├── laugh.m4a               # Ambient audio files
│   ├── win.m4a
│   └── lose.m4a
└── Doc/                        # Developer documentation
```

### State Management

All state lives inside a single `MoodLabArena()` function component:

| Metric | Count |
|---|---|
| `useState` hooks | 544 |
| `useRef` hooks | 111 |
| `useEffect` hooks | ~40 |
| `useCallback` hooks | ~10 |
| Total lines | 22,484 |

State is **not** persisted -- page refresh resets everything. There is no localStorage, no backend, no database.

### Navigation State Machine

Navigation is driven by a handful of `useState` values at the top of `MoodLabArena`:

```
tab ──> zone ──> selectedGame ──> gameActive
```

| State | Type | Values | Purpose |
|---|---|---|---|
| `tab` | string | `"arena"` / `"live"` / `"me"` | Top-level tab bar |
| `zone` | string/null | `null` / `"arcade"` / `"stage"` / `"oracle"` / `"wall"` / `"worldcup"` | Current zone (`null` = Hub) |
| `selectedGame` | string/null | Game ID string | Which game card was tapped |
| `gameActive` | object/null | `{id, name, emoji, color}` | Active game (playing) |
| `matchmaking` | object/null | Matchmaking state | Searching for opponent |

The render function is a large conditional tree: `tab` -> `zone` -> `selectedGame`/`gameActive`. Each game owns its own state hooks, phase logic, scoring, and render subtree.

### Zone Configuration (line 28)

```js
const Z = {
  arcade:   { primary:"#00E5FF", name:"The Arcade",   icon:"🎮", sub:"16 Action Games" },
  stage:    { primary:"#FFD93D", name:"The Stage",     icon:"🎪", sub:"6 Live Shows"    },
  oracle:   { primary:"#FFD93D", name:"The Fortune",   icon:"🔮", sub:"16 Fortune Games" },
  wall:     { primary:"#FB923C", name:"The Wall",      icon:"🏆", sub:"Rankings & Glory" },
  worldcup: { primary:"#FFD93D", name:"World Cup 2026",icon:"⚽", sub:"Limited Event"   },
};
```

### Design System Constants (line 97)

```js
const C = {
  bg:"#050510", bg2:"#0a0a20", bg3:"#0f0f2a", card:"#12123a",
  cyan:"#00E5FF", gold:"#FFD93D", pink:"#FF4D8D", purple:"#C084FC",
  orange:"#FB923C", red:"#FF4444", green:"#34D399", lime:"#7FFF00", blue:"#60A5FA",
};
```

### Glass-Morphism System (line 131)

Four glass presets are used throughout:

| Preset | Use Case | Background |
|---|---|---|
| `GLASS_CLEAR` | Nav, side buttons, small UI | `rgba(255,255,255,0.06)` + 50px blur |
| `GLASS_CARD` | Jumbotron, info cards, content panels | `rgba(8,8,25,0.72)` + 40px blur |
| `LG.base` | Overlays, cards, panels | `rgba(255,255,255,0.05)` + 40px blur |
| `LG.thick` | Panels, sheets | `rgba(10,10,32,0.45)` + 60px blur |
| `LG.pill` | Small buttons, tags | `rgba(255,255,255,0.06)` + 24px blur |
| `LG.tinted(color)` | Zone-colored glass | Dynamic color tint |

---

## 3. Device Required -- BLE Connection

### Overview

The app connects to a Cali Clear vaporizer via Web Bluetooth API. Physical puffs replace the on-screen "HOLD TO PUFF" button. **A connected BLE device is mandatory to play any game** -- every game launch checks `bleConnected` and blocks with a popup if not connected.

### 5 Gates (Device Required Checkpoints)

Every zone's game launcher includes a gate:

```js
if (!bleConnected) {
  setShowBlePopup(true);
  notify("Connect your device to play!", C.orange);
  return;
}
```

These gates exist at:
1. **Arcade** game launch (line ~2829)
2. **Stage** show launch (line ~5400)
3. **Stage** individual game launch (line ~5512)
4. **World Cup** tournament start (line ~7817)
5. **Fortune** game launch (line ~9073)

### BLE Protocol (line 1007)

| Property | UUID |
|---|---|
| Service | `0000ffe0-0000-1000-8000-00805f9b34fb` |
| Notify characteristic | `0000ffe6-0000-1000-8000-00805f9b34fb` |
| Write characteristic | `0000ffe5-0000-1000-8000-00805f9b34fb` (reserved, unused) |

| Packet | Hex Bytes | Meaning |
|---|---|---|
| `BLE_PUFF_START` | `b4 b4 02 00 04 4b` | Heating on -- puff begins |
| `BLE_PUFF_STOP` | `b4 b5 02 00 05 4b` | Heating off -- puff ends |

### Connection Flow (`connectBle`, line 6534)

1. Call `navigator.bluetooth.requestDevice()` with service UUID filter
2. Store device in `btDeviceRef`
3. Listen for `gattserverdisconnected` event
4. Connect GATT server -> get primary service -> get notify characteristic
5. Register `characteristicvaluechanged` listener (registered ONCE at connect time)
6. Start notifications
7. Set `bleConnected = true`
8. Launch Device Optimization screen (5-stage progress animation)

### Safety Timeout (line 6572)

If `BLE_PUFF_STOP` is never received (e.g., device firmware bug, connection drop), a 15-second safety timer auto-stops the puff:

```js
btPuffTimeout.current = setTimeout(() => {
  setBtPuffActive(false);
  btPuffUp.current?.();
  btPuffEventUp.current?.();
}, 15000);
```

The timeout is cleared on every valid `PUFF_START` and `PUFF_STOP`.

### BLE Refs (line 1548)

| Ref | Type | Purpose |
|---|---|---|
| `btDeviceRef` | `BluetoothDevice` | Handle for disconnect |
| `btCharNotify` | Characteristic | Notify characteristic handle |
| `btPuffDown` | Function | Active game's puff-start handler |
| `btPuffUp` | Function | Active game's puff-stop handler |
| `btPuffEventDown` | Function | Puff Events system puff-start (always wired) |
| `btPuffEventUp` | Function | Puff Events system puff-stop (always wired) |
| `btPuffTimeout` | Timer ID | 15s safety timer |
| `btPuffActive` | State (bool) | Drives top glow overlay when puffing |

### Per-Render IIFE -- Stale Closure Solution (line 6621)

The `characteristicvaluechanged` listener is registered **once** at connect time. To avoid stale closures, a per-render IIFE writes the current game's handler closures into refs on every render:

```js
// Keep BT puff refs in sync with whichever game is currently active.
(() => {
  const id = gameActive?.id;
  let down = null, up = null;
  if (id === "finalkick" || id === "finalkick2" || id === "finalkick3") {
    down = kickStartCharge; up = kickStopCharge;
  }
  else if (id === "balloon")    { down = bpStartCharge;  up = bpStopCharge;   }
  else if (id === "wildwest")   { down = duelShoot;      up = duelReleasePuff;}
  // ... 30+ more branches for all 35 games ...
  btPuffDown.current = down;
  btPuffUp.current   = up;
  // Puff Events always wired regardless of active game
  btPuffEventDown.current = puffEventHoldDown;
  btPuffEventUp.current   = puffEventHoldUp;
})();
```

The listener always reads from these refs, never from closed-over values.

### Adding BLE Support to a New Game

1. Find the IIFE block (search `Keep BT puff refs in sync`)
2. Add a branch matching your game ID:
   - **Hold-based game:** provide both `down` and `up`
   - **Tap-based game:** provide only `down`, set `up = null`

```js
else if (id === "mygame") { down = myGamePuffStart; up = myGamePuffStop; }
```

---

## 4. The 3 Core Zones

### Arcade -- "The Arcade" (cyan `#00E5FF`)

16 skill-based action games. Array: `PLAY_GAMES` (line 185).

| # | ID | Name | Emoji | Type | Players | Puff Mechanic |
|---|---|---|---|---|---|---|
| 1 | `finalkick` | Final Kick | ⚽ | Skill | 2 | Hold = power meter |
| 2 | `finalkick2` | Final Kick 2 | ⚽🔥 | Precision | 2 | Double puff: X then Y aim |
| 3 | `finalkick3` | Final Kick 3D | ⚽🌐 | 3D Precision | 2 | Three.js 3D + double puff |
| 4 | `hotpotato` | Hot Potato | 💣 | Luck | 3-8 | Hold to pass bomb |
| 5 | `russian` | Russian Roulette | 🎲 | Luck | 2-6 | Hold for dodge power |
| 6 | `wildwest` | Wild West Duel | 🤠 | Reaction | 2 | Tap on DRAW (reaction time) |
| 7 | `balloon` | Balloon Pop | 🎈 | Strategy | 2-8 | Hold = inflate amount |
| 8 | `puffpong` | Puff Pong | 🏓 | Skill | 2 | Hold = move paddle up |
| 9 | `rhythm` | Rhythm Puff | 🎵 | Rhythm | 1-4 | Tap on beat |
| 10 | `tugofwar` | Tug of War | 💪 | Team | 2-8 | Tap spam = pull force |
| 11 | `hooked` | Hooked | 🎣 | Skill | 1 | Hold = reel (suction control) |
| 12 | `rps` | Puff RPS | ✊ | Strategy | 2 | Hold = puff power |
| 13 | `beatdrop` | Beat Drop | 🎧 | Music | 1 | Hold until drop, release on time |
| 14 | `puffclock` | Puff Clock | ⏱️ | Precision | 1-100+ | Hold for exact target time |
| 15 | `pufflimbo` | Puff Limbo | 🎪 | Endurance | 1-50 | Hold longer each round |
| 16 | `puffderby` | Puff Derby | 🏇 | Racing | 6 | Tap spam = horse speed |

### Stage -- "The Stage" (gold `#FFD93D`)

6 live show formats with MC commentary. Array: `SHOW_GAMES` (line 204).

| # | ID | Name | Emoji | Type | Players | Puff Mechanic |
|---|---|---|---|---|---|---|
| 1 | `vibecheck` | Vibe Check | 🧠 | Trivia | 1-100+ | Puff duration = answer (A/B/C/D) |
| 2 | `higherlower` | Higher or Lower | 📊 | Knowledge | 1-100+ | Short puff = Lower, Long = Higher |
| 3 | `pricepuff` | The Price is Puff | 💰 | Knowledge | 2-50+ | Hold = increase price guess |
| 4 | `survivaltrivia` | Survival Trivia | 🏆 | Trivia | 2-100+ | Puff duration = answer (A/B/C/D) |
| 5 | `simonpuffs` | Simon Puffs | 🔴 | Memory | 1-50+ | Puff duration matches pattern |
| 6 | `puffauction` | Puff Auction | 🔨 | Strategy | 2-50+ | Hold = bid duration |

### Fortune -- "The Fortune" (gold `#FFD93D`)

15 fortune/prediction games organized in 5 sub-tabs. Rendered via `FORTUNE_GAMES` inside `renderOracle()` (line 9026).

**Sportsbook (4 games):**

| # | ID | Name | Emoji | Puff Mechanic |
|---|---|---|---|---|
| 1 | `crystalball` | Fortune Teller | 🔮 | Hold duration = prediction confidence |
| 2 | `strainbattle` | Strain Battle | 🌿 | Short = left, Long = right vote |
| 3 | `matchpredictor` | Match Predictor | 📊 | Duration selects Home/Draw/Away |
| 4 | `dailypicks` | Daily Bets | 📅 | Duration selects Yes/No or A/B |

**Luck (3 games):**

| # | ID | Name | Emoji | Puff Mechanic |
|---|---|---|---|---|
| 5 | `spinwin` | Spin & Win | 🎡 | Tap to spin wheel |
| 6 | `puffslots` | Puff Slots | 🎰 | Tap to spin reels |
| 7 | `coinflip` | Coin Flip | 🪙 | Hold = confidence multiplier |

**Table (3 games):**

| # | ID | Name | Emoji | Puff Mechanic |
|---|---|---|---|---|
| 8 | `puffblackjack` | Puff Blackjack | 🃏 | Short = Hit, Long = Stand |
| 9 | `highcard` | High Card Puff | 🎴 | Hold = bet size |
| 10 | `crapsnclouds` | Craps & Clouds | 🎲 | Hold duration = dice roll |

**Mystery (4 games):**

| # | ID | Name | Emoji | Puff Mechanic |
|---|---|---|---|---|
| 11 | `mysterybox` | Mystery Box | 🎁 | Hold to reveal picked box |
| 12 | `scratchpuff` | Scratch & Puff | 🎫 | Hold to scratch area |
| 13 | `fortunecookie` | Fortune Cookie | 🥠 | Hold to crack cookie |
| 14 | `treasuremap` | Treasure Map | 🗺️ | Hold to dig selected tile |

**Arena Bets (1 game):**

| # | ID | Name | Emoji | Puff Mechanic |
|---|---|---|---|---|
| 15 | `puffderby` | Puff Derby | 🏇 | Tap spam = horse speed |

> Note: Puff Derby appears in both Arcade (`PLAY_GAMES`) and Fortune (`FORTUNE_GAMES`) arrays. It is the same game rendered in both zones.

---

## 5. World Cup 2026 -- Special Event Zone

The World Cup 2026 zone (`zone === "worldcup"`) is a **limited-time event hub** that adds a tournament wrapper around existing games. It is NOT a core zone in the same sense as Arcade/Stage/Fortune.

### Key Data

- **50 teams** defined in `WC_TEAMS` (line 558) -- 48 qualified + Vietnam + China as bonus
- **12 groups** (A-L) in `WC_GROUPS` (line 833), 4 teams per group
- **6 confederations** in `WC_CONFEDERATIONS` (line 848)
- **Live match simulation** in `WC_LIVE_MATCHES` (line 860)
- **Group standings** in `WC_2026_GROUPS` (line 894)
- **6-hour cooldown** between tournament entries (`WC_COOLDOWN_MS`, line 857)

### Tournament Flow

1. `wcPhase = "team_select"` -- Pick a national team
2. `wcPhase = "group_draw"` -- Animated group draw
3. `wcPhase = "group_stage"` -- 3 matchdays, play actual game vs opponents
4. `wcPhase = "knockout"` -- R16 -> QF -> SF -> Final bracket
5. `wcPhase = "result"` -- Gold/Silver/Bronze/Fourth/Group exit

### Prize Tiers (`WC_PRIZES`, line 840)

| Finish | Points | Coins | Title |
|---|---|---|---|
| Champion | 50,000 | 500 | World Champion |
| Runner-Up | 25,000 | 250 | Runner-Up |
| Third | 10,000 | 100 | Third Place |
| Fourth | 5,000 | 50 | Semifinalist |
| Group Exit | 1,000 | 10 | Group Stage |

---

## 6. All 35 Games -- Complete Reference

| # | Game | Emoji | Zone | Type | Puff | Base Coins | BLE Down | BLE Up |
|---|---|---|---|---|---|---|---|---|
| 1 | Final Kick | ⚽ | Arcade | Skill | Hold=power | 50 | `kickStartCharge` | `kickStopCharge` |
| 2 | Final Kick 2 | ⚽🔥 | Arcade | Precision | Double hold | 50 | `kickStartCharge` | `kickStopCharge` |
| 3 | Final Kick 3D | ⚽🌐 | Arcade | 3D | Double hold | 50 | `kickStartCharge` | `kickStopCharge` |
| 4 | Hot Potato | 💣 | Arcade | Luck | Hold=pass | 30 | `hpStartPuff` | `hpStopPuff` |
| 5 | Russian Roulette | 🎲 | Arcade | Luck | Hold=dodge | 30 | `rrStartPuff` | `rrStopPuff` |
| 6 | Wild West Duel | 🤠 | Arcade | Reaction | Tap on DRAW | 50 | `duelShoot` | `duelReleasePuff` |
| 7 | Balloon Pop | 🎈 | Arcade | Strategy | Hold=inflate | 30 | `bpStartCharge` | `bpStopCharge` |
| 8 | Puff Pong | 🏓 | Arcade | Skill | Hold=paddle up | 30 | `ppPuffUp` | `ppPuffRelease` |
| 9 | Rhythm Puff | 🎵 | Arcade | Rhythm | Tap on beat | 30 | `rpPuffHit` | `null` |
| 10 | Tug of War | 💪 | Arcade | Team | Tap=pull | 30 | `towPuff` | `null` |
| 11 | Hooked | 🎣 | Arcade | Skill | Hold=reel | 30 | `hookStartPuff` | `hookStopPuff` |
| 12 | Puff RPS | ✊ | Arcade | Strategy | Hold=power | 30 | `rpsStartPuff` | `rpsStopPuff` |
| 13 | Beat Drop | 🎧 | Arcade | Music | Hold until drop | 30 | `bdStartHold` | `bdReleaseHold` |
| 14 | Puff Clock | ⏱️ | Arcade | Precision | Hold=exact time | 30 | `pcStartPuff` | `pcStopPuff` |
| 15 | Puff Limbo | 🎪 | Arcade | Endurance | Hold longer | 30 | `plStartPuff` | `plReleasePuff` |
| 16 | Puff Derby | 🏇 | Arcade | Racing | Tap spam | 30 | `pdPuff` | `null` |
| 17 | Vibe Check | 🧠 | Stage | Trivia | Duration=answer | 50 | `vcPuffStart` | `vcPuffStop` |
| 18 | Higher or Lower | 📊 | Stage | Knowledge | Short/Long | 30 | closure | closure |
| 19 | The Price is Puff | 💰 | Stage | Knowledge | Hold=price | 30 | `pipStartPuff` | `pipStopPuff` |
| 20 | Survival Trivia | 🏆 | Stage | Trivia | Duration=answer | 50 | `stPuffStart` | `stPuffStop` |
| 21 | Simon Puffs | 🔴 | Stage | Memory | Duration=type | 30 | `spStartPuff` | `spEndPuff` |
| 22 | Puff Auction | 🔨 | Stage | Strategy | Hold=bid | 30 | `paStartBid` | `paEndBid` |
| 23 | Fortune Teller | 🔮 | Fortune | Prediction | Hold=confidence | 20 | `cbHandlePuff` | `cbHandlePuffEnd` |
| 24 | Strain Battle | 🌿 | Fortune | Vote | Short/Long | 20 | `sbHandlePuff` | `sbHandlePuffEnd` |
| 25 | Match Predictor | 📊 | Fortune | Sports | Duration=pick | 20 | `mpHandlePuff` | `mpHandlePuffEnd` |
| 26 | Daily Bets | 📅 | Fortune | Daily | Duration=answer | 20 | `dpHandlePuff` | `dpHandlePuffEnd` |
| 27 | Spin & Win | 🎡 | Fortune | Luck | Tap=spin | 20 | closure | `null` |
| 28 | Puff Slots | 🎰 | Fortune | Luck | Tap=spin | 20 | `slotsHandlePuff` | `slotsHandlePuffEnd` |
| 29 | Coin Flip | 🪙 | Fortune | 50/50 | Hold=confidence | 20 | `cfHandlePuff` | `cfHandlePuffEnd` |
| 30 | Puff Blackjack | 🃏 | Fortune | Cards | Short=Hit Long=Stand | 20 | `bjHandlePuff` | `bjHandlePuffEnd` |
| 31 | Craps & Clouds | 🎲 | Fortune | Dice | Hold=roll | 20 | `crapsHandlePuff` | `crapsHandlePuffEnd` |
| 32 | Mystery Box | 🎁 | Fortune | Discovery | Hold=reveal | 20 | `mbHandlePuff` | `mbHandlePuffEnd` |
| 33 | Scratch & Puff | 🎫 | Fortune | Discovery | Hold=scratch | 20 | `scHandlePuff` | `scHandlePuffEnd` |
| 34 | Fortune Cookie | 🥠 | Fortune | Fortune | Hold=crack | 20 | `fcHandlePuff` | `fcHandlePuffEnd` |
| 35 | Treasure Map | 🗺️ | Fortune | Adventure | Hold=dig | 20 | `tmHandlePuff` | `tmHandlePuffEnd` |

> "closure" in the BLE column means the handler is an inline arrow function defined in the IIFE block, not a named function.

---

## 7. Puff Mechanics

### Universal Puff Action Bar (`UNIVERSAL_PUFF_CONFIG`, line 910)

Every hold-based game shares a common puff bar with 5 power zones:

| Zone | Range | Color | Hex |
|---|---|---|---|
| TAP | 0--15% | Dark gray | `#555F85` |
| SHORT | 15--40% | Medium gray | `#8892B8` |
| GOOD | 40--65% | Cyan | `#00E5FF` |
| PERFECT | 65--90% | Lime | `#7FFF00` |
| BLINKER | 90--100% | Red | `#FF4444` |

### Sweet Spot Randomization

Each round randomizes the sweet spot position:

```js
randomizeSweetSpot: () => {
  const min = 30 + Math.random() * 20; // 30-50%
  const max = min + 20 + Math.random() * 20; // +20-40% window
  return { min: Math.round(min), max: Math.min(95, Math.round(max)) };
}
```

The blinker threshold is fixed at 95%.

### Trivia Puff-to-Answer (line 928)

For Vibe Check and Survival Trivia, puff duration maps to answer choice:

```js
const getTriviaPuffAnswer = (ms) =>
  ms < 800  ? 0   // Answer A (tap)
  : ms < 2000 ? 1 // Answer B (short)
  : ms < 3500 ? 2 // Answer C (medium)
  : 3;             // Answer D (long)
```

While holding, a live highlight shows which answer the player would select if they released now.

### Difficulty Rebalance

All games have been rebalanced for accessibility:
- AI opponents have reduced speed/accuracy
- Sweet spot windows are wider at lower rounds
- Timer pressures are reduced for early rounds
- Blinker rewards are enhanced to incentivize risk

---

## 8. Tournament System

### World Cup Format

The WC tournament wraps any supported game (`finalkick`, `finalkick2`, `finalkick3`, `puffpong`, `balloon`, `russian`) in a group-stage + knockout bracket using 50 national teams.

### 13 Game-Specific Tournaments (`GAME_TOURNAMENTS`, line 726)

Each Arcade game has its own themed tournament format:

| Game | Tournament Name | Format | Duration |
|---|---|---|---|
| Wild West Duel | The Outlaw Circuit | 16-player Single Elimination | ~30 min |
| Russian Roulette | The Underground | Survival (4 Tables + Final) | ~20 min |
| Balloon Pop | Puff Fest | 3 Heats + Grand Final | ~15 min |
| Puff Pong | Neon League | Swiss System (4 Rounds + Final) | ~25 min |
| Rhythm Puff | Tour de Puff | Score Chase (3 Songs) | ~15 min |
| Tug of War | The Puff Games | Round Robin Teams (4 Teams) | ~20 min |
| Hot Potato | Bomb Squad Cup | Heats + Grand Final | ~15 min |
| Puff RPS | Dojo Championship | Double Elimination (16 Players) | ~30 min |
| Hooked | Deep Sea Masters | Catch Competition (3 Sessions) | ~10 min |
| Beat Drop | The Drop Zone | Score Chase (3 Songs) | ~15 min |
| Puff Clock | Time Masters | Precision Tournament (5 Rounds) | ~20 min |
| Puff Limbo | Limbo Legends | Survival (7 Rounds) | ~15 min |
| Puff Derby | Grand Derby | Race Series (3 Races) | ~10 min |

### Themed Teams (`GAME_TEAMS`, line 619)

Each tournament has 6 themed teams. Examples:

- Wild West: "Puff Bandits", "Blinker Boys", "Smoke Signal Posse", etc.
- Balloon Pop: "Birthday Blinkers", "Pop Squad", "Inflate Nation", etc.
- Puff RPS: "Stone Temple Puffers", "Scissor Sensei", "Blinker Dojo", etc.

### Tournament Prizes (uniform across all 13)

| Place | Points | Coins | Example Label |
|---|---|---|---|
| Gold | 30,000 | 800 | (themed per tournament) |
| Silver | 15,000 | 400 | (themed per tournament) |
| Bronze | 7,500 | 200 | (themed per tournament) |
| Fourth | 3,000 | 100 | (themed per tournament) |

---

## 9. Sound System

### Architecture

- **Shared AudioContext** stored in `sharedAudioCtx` ref (line 3202)
- Reused across all `playFx()` calls -- never closed
- Falls back to `webkitAudioContext` for Safari
- Respects `audioOn` state toggle

### Audio Files (3 total)

| File | Type | Used For |
|---|---|---|
| `assets/arena/win.m4a` | File playback | Win moments |
| `assets/arena/lose.m4a` | File playback | Loss moments |
| `assets/arena/laugh.m4a` | File playback | Comedy moments |

### Synthesized Sounds (89 unique sound types)

All other sounds are synthesized using `OscillatorNode` + `GainNode` with the `tone()` and `noise()` helpers inside `playFx()` (line 3208).

The `playFx()` function (`useCallback`, line 3208) supports 89 unique sound identifiers called across 378 call sites:

**UI sounds:** `tap`, `select`, `nav`, `back`, `coin_collect`, `level_up`, `notification`, `error`, `countdown_tick`, `countdown_go`, `streak_fire`, `blinker`, `success`, `puff`, `miss`

**Football:** `kick`, `goal`, `save`, `whistle`, `charge`, `crowd`, `crowd_cheer`, `stadium_roar`, `goal_horn`, `referee_whistle`, `vuvuzela`

**Arcade:** `gunshot`, `gun_click`, `gun_bang`, `revolver_spin`, `balloon_inflate`, `balloon_pop`, `pong_hit`, `pong_wall`, `pong_score`, `rhythm_hit`, `rhythm_miss`, `rhythm_perfect`, `rope_pull`, `rope_snap`, `mud_splash`, `bomb_tick`, `bomb_explode`, `bomb_pass`, `bomb_hit`, `fishing_cast`, `fishing_bite`, `fishing_reel`, `fishing_catch`, `fishing_snap`, `punch_clash`, `beat_buildup`, `beat_drop`, `horse_gallop`, `horse_whinny`, `clock_tick_precise`, `limbo_bar_raise`

**Fortune:** `slot_spin`, `slot_stop`, `spin`, `wheel_spin`, `wheel_tick`, `wheel_stop`, `jackpot`, `jackpot_alarm`, `blackjack`, `card_deal`, `coin_flip`, `coin_land`, `dice_roll`, `dice_shake`, `box_open`, `scratch`, `cookie_crack`, `treasure_find`, `reveal_drumroll`, `lucky_hour`

**Stage:** `show_intro`, `correct_ding`, `eliminated`, `disqualified`, `auction_bid`, `auction_gavel`, `crowd_gasp`, `crowd_ooh`, `timer_urgent`

**Social:** `chat_message`, `achievement`, `streak_break`

---

## 10. Visual Effects

### Effect Functions (line 3668)

| Function | Effect | Duration |
|---|---|---|
| `triggerFlash(type)` | Full-screen flash (goal/save/miss/blinker) | 400ms |
| `triggerShake()` | Screen shake animation | 500ms |
| `spawnConfetti(count, colors)` | Confetti particle burst | 3000ms |
| `spawnSmoke(count)` | Smoke puff particles | 4000ms |
| `triggerPuffWave()` | Combined wave + smoke effect | 3000ms |
| `spawnPuffReaction(key, user)` | Emoji reaction float-up | 2-2.5s |
| `spawnSpectatorPuff(color)` | Spectator puff cloud from edge | 4000ms |

### Screen Flash Types

| Type | When Used |
|---|---|
| `"goal"` | Player scores a goal |
| `"save"` | Keeper makes a save |
| `"miss"` | Shot goes wide |
| `"blinker"` | Player hits blinker zone (95%+) |

### CSS Keyframe Animations (90 total)

Injected via `<style>` in JSX. Key animations include:

| Animation | Purpose |
|---|---|
| `fadeIn` | General entry animation |
| `sheetUp` | Bottom sheet slide up |
| `pulse` | Continuous glow pulse |
| `tickerScroll` | News ticker scroll |
| `confettiFall` | Confetti particle descent |
| `smokePuff` | Smoke expansion + fade |
| `puffReactFloat` | Emoji reaction float upward |
| `specPuff` | Spectator puff cloud travel |
| `ballFlight` | Football arc trajectory |
| `glowPulse` | BLE active glow overlay |
| `tumbleweed` | Western duel tumbling |
| `marqueeChase` | Theater marquee border lights |

### BLE Glow Overlay (line 22181)

When `btPuffActive` is true, a full-screen cyan glow overlay appears at the top of the viewport:

```js
opacity: btPuffActive ? 1 : 0,
transition: btPuffActive ? "opacity 0.18s ease-out" : "opacity 0.6s ease-in",
```

---

## 11. Social Features

### The Wall (zone `"wall"`)

The Wall is a social/competitive hub with multiple data views:

- **Leaderboards** (`WALL_LEADERBOARD`, line 382): All-time, Arcade, Stage, Oracle, Tournament
- **Records** (`WALL_RECORDS`, line 469): Speed records, longest puffs, highest combos
- **Activity Feed** (`WALL_ACTIVITY`, line 479): Live activity stream
- **Champions Podium** (`WALL_CHAMPIONS`, line 517): Tournament winners display
- **Friends List** (`WALL_FRIENDS`, line 505): Online/offline status
- **Recent Opponents** (`WALL_OPPONENTS`, line 512): Match history

### Chat System

- Global chat array: `chatMessages` state (line 1476)
- Side-specific chat during games: `sideChat` state (line 1460)
- Bot names: `CHAT_BOTS` (line 960)
- Canned messages: `CHAT_MSGS` (line 961)
- Chat tracks `chatsSent` for Social Butterfly badge

### Live Spectator System (line 1592)

Active during any game (`gameActive`, `matchmaking`, or `wcPhase`):

- **`spectatorCount`**: Simulated viewer count (~120-200 base)
- **`liveSpectators`**: Floating puff clouds from screen edges
- **`crowdEnergy`**: 0-100 energy meter, decays over time
- **`spectatorTicker`**: Scrolling activity messages
- **`crowdEruption`**: Triggered at 95%+ energy -- gold puff burst

Spectators spawn every 2-5 seconds during gameplay. Energy increases by 4-10 per spectator, decays by 2 every 1.5 seconds.

### Audience Side System (line 1457)

During games, spectators can pick sides:

- `audienceSide`: `"you"` or `"ai"`
- `audienceTraitor`: True if player switched sides
- `audienceSwitchCount`: Number of side switches
- `sideFans`: Fan counts per side
- `kickPrediction`: Match outcome prediction

### Puff Events System (line 1654)

Synchronized community events that occur every ~90-150 seconds:

| Event | ID | Duration | Description |
|---|---|---|---|
| Countdown Puff | `countdown` | 10s | Everyone puffs together on countdown |
| Blinker Challenge | `blinker` | 30s | Who can hit a blinker? |
| Puff Chain | `chain` | 60s | Keep the chain alive with sequential puffs |
| The 420 Challenge | `420` | 15s | Puff for exactly 4.20 seconds |

### Puff Reactions System (line 3692)

Duration-based emoji reactions during games:

| Duration | Reaction | Emoji |
|---|---|---|
| < 0.5s | Clap | 👏 |
| 0.5-1.5s | Fire | 🔥 |
| 1.5-3.0s | OMG | 😱 |
| 3.0-4.5s | Mind Blown | 🤯 |
| 4.5s+ | INSANE | 💀 |
| 3 rapid puffs | Wave | 🌊 |
| 2 quick double-tap | Love | ❤️ |

AI audience members also spawn reactions every 3-8 seconds during games.

---

## 12. Key Functions Reference

| Function | Line | Purpose |
|---|---|---|
| `MoodLabArena()` | 1018 | Main component -- everything lives here |
| `playFx(type, vol)` | 3208 | Sound effects engine (89 sounds, 378 calls) |
| `triggerFlash(type)` | 3669 | Screen flash effect |
| `triggerShake()` | 3670 | Screen shake effect |
| `spawnConfetti(count, colors)` | 3671 | Confetti particles |
| `spawnSmoke(count)` | 3679 | Smoke particles |
| `triggerPuffWave()` | 3687 | Combined puff wave effect |
| `connectBle()` | 6534 | BLE device connection flow |
| `disconnectBle()` | 6613 | BLE device disconnect |
| `puffEventHoldDown()` | 6468 | Puff Events system -- hold start |
| `puffEventHoldUp()` | 6477 | Puff Events system -- hold stop |
| `notify(msg, color)` | 2791 | Toast notification (2.2s) |
| `puffLockIn(cb)` | 2793 | Lock-in animation + callback (1.1s) |
| `kickStartCharge()` | 4946 | Final Kick puff start |
| `kickStopCharge()` | 4987 | Final Kick puff stop |
| `duelShoot()` | 3006 | Wild West Duel puff handler |
| `spawnSpectatorPuff(color)` | 1865 | Spectator system puff spawn |
| `spawnPuffReaction(key, user)` | 3703 | Puff reaction emoji spawn |
| `detectPuffReaction(duration)` | 3714 | Auto-detect reaction from puff duration |
| `spawnAudienceBubble()` | 4941 | Audience puff bubble during FK games |
| `getCoinMultiplier()` | 21564 | Loyalty tier x device bonus multiplier |
| `recordGameResult(won, coins, xp)` | 21663 | End-of-game reward + badge + streak tracking |
| `awardXP(amount, reason)` | 21640 | XP grant with tier-up detection |
| `renderOracle()` | 9025 | Fortune zone renderer |

---

## 13. Data Constants Reference

| Constant | Line | Content |
|---|---|---|
| `ARENA_IMAGES` | 10 | Zone thumbnail paths (6 zones) |
| `ARENA_VIDEOS` | 18 | Zone background video paths (6 zones) |
| `Z` | 28 | Zone colors, names, icons |
| `C` | 97 | Design system color palette |
| `GLASS_CLEAR` / `GLASS_CARD` / `LG` | 131-182 | Glass-morphism style presets |
| `PLAY_GAMES` | 185 | Arcade game definitions (16 games) |
| `SHOW_GAMES` | 204 | Stage show definitions (6 shows) |
| `MC_LINES` | 214 | MC commentary templates |
| `ORACLE_GAMES` | 224 | Fortune game definitions (12 in constant, 15 in render) |
| `UNIVERSAL_PUFF_CONFIG` | 910 | Puff bar zones, sweet spot randomizer |
| `HOOK_FISH` | 930 | Hooked fish types (8 fish, 3 rarities) |
| `SP_PUFF_TYPES` | 943 | Simon Puffs puff durations |
| `PA_PRIZES` | 952 | Puff Auction prize pool |
| `WC_TEAMS` | 558 | World Cup teams (50 teams) |
| `WC_GROUPS` | 833 | Group assignments (12 groups, 4 teams each) |
| `WC_PRIZES` | 840 | WC tournament prize tiers |
| `GAME_TEAMS` | 619 | Themed teams for 13 game tournaments |
| `GAME_TOURNAMENTS` | 726 | Tournament formats for 13 games |
| `WALL_LEADERBOARD` | 382 | Leaderboard data (4 categories, 15 players each) |
| `WALL_RECORDS` | 469 | Arena records (8 records) |
| `WALL_CHAMPIONS` | 517 | Tournament champions (3 champions) |
| `ACHIEVEMENTS` | 524 | Achievement definitions (12 achievements) |
| `RANKS` | 540 | Player rank tiers (6 ranks) |
| `SPECTATOR_NAMES` | 107 | Simulated spectator names (40 names) |
| `BLE_SERVICE_UUID` | 1008 | BLE service UUID |
| `BLE_PUFF_START` / `BLE_PUFF_STOP` | 1012-1013 | BLE packet definitions |
| `PE_TYPES` | 6347 | Puff Event types (4 events) |
| `FORTUNE_LEVELS` | 36 | Fortune zone progression (6 levels) |
| `DEVICE_MODELS` | 974 | Supported device models (6 models) |
| `DEVICE_POOLS` | 982 | Device pool tiers (Select/Standard/Open) |
| `KICK_ZONES` | 987 | Final Kick aim grid (6 zones) |

---

## 14. Deployment

### Vercel (Production)

The project deploys to Vercel as a static site. No build command is needed -- Vercel serves the files as-is.

### Local Development

```bash
# Any static file server works
python3 -m http.server 8080
npx serve .
```

Open `http://localhost:8080` in a browser that supports Web Bluetooth (Chrome, Edge, Opera -- NOT Firefox/Safari).

### No Build Step

There is no `package.json`, no `node_modules`, no webpack/vite/parcel. The browser handles everything:

1. `index.html` loads React, ReactDOM, Three.js, Babel from CDN
2. Babel transpiles `moodlab-arena-v6.jsx` in the browser
3. React renders the app

### Browser Requirements

- **Web Bluetooth API** required for device connection (Chrome 56+, Edge 79+)
- **Web Audio API** required for sound effects (all modern browsers)
- **ES2020+** features used throughout (optional chaining, nullish coalescing)

### Key Files

| File | Purpose |
|---|---|
| `index.html` | Entry point, CDN imports, Babel config |
| `moodlab-arena-v6.jsx` | Entire application |
| `assets/arena/*.png` | Zone thumbnails |
| `assets/arena/*.mp4` | Zone background videos |
| `assets/arena/*.m4a` | Audio files (win/lose/laugh) |

---

## Loyalty Integration Points

The Arena platform integrates with the loyalty/progression system through two key functions. These are documented in the separate Loyalty System guide:

- **`getCoinMultiplier()`** (line 21564): Returns `tier.mult * deviceBonus`. Loyalty tier multiplier (1.0x-3.0x) times device bonus (1.5x if BLE connected, 1.0x if not). Used everywhere coins are awarded.

- **`recordGameResult(won, baseCoins, baseXP)`** (line 21663): Called at the end of every game. Applies coin multiplier, awards XP, updates profile stats, checks badge unlocks, manages win streaks, and triggers daily challenge completions.

The loyalty constants (`LOYALTY_TIERS`, `DAILY_REWARDS`, `DAILY_CHALLENGES`, `SHOP_ITEMS`, `LOYALTY_BADGES`) are defined at lines 46-94 but their system is covered in the separate Loyalty guide.
