# Mood Lab Arena -- Complete Developer Guide v2

> **The definitive reference for the Mood Lab Arena codebase.**
> If you read only one document, make it this one.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Device Required -- BLE Integration](#3-device-required----ble-integration)
4. [The 3 Core Zones](#4-the-3-core-zones)
5. [All 35 Games -- Brief Mechanics](#5-all-35-games----brief-mechanics)
6. [Puff Mechanics](#6-puff-mechanics)
7. [Loyalty System](#7-loyalty-system)
8. [Loyalty-Arena Integration](#8-loyalty-arena-integration)
9. [Sound System](#9-sound-system)
10. [Visual Effects](#10-visual-effects)
11. [Tournament System](#11-tournament-system)
12. [Social Features](#12-social-features)
13. [Key Functions Reference](#13-key-functions-reference)
14. [Data Constants Reference](#14-data-constants-reference)
15. [Deployment](#15-deployment)

---

## 1. Project Overview

### What Is Mood Lab Arena?

Mood Lab Arena is a cannabis gaming platform where the puff device IS the controller. Players use a Cali Clear vaporizer connected via Bluetooth to play 35+ mini-games across three zones: Arcade (skill), Stage (live shows), and Fortune (luck/prediction). The app features a dual-currency loyalty system (Mood Coins + XP), win streaks, daily challenges, badges, a shop, and a full tournament system including a World Cup 2026 special event.

### Partnership

**Cali Clear x Mood Lab** -- Cali Clear vaporizer devices serve as the exclusive game controller. Device models include Season 1-3 (Standard pool) and Select S1-S2 (Select pool), each with different reward multipliers.

### World Cup 2026

The WC 2026 zone is a limited-time special event, not the core product. It features 50 teams across 12 groups with a full bracket system, but the core experience is the three permanent zones.

### Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework (production CDN build) |
| Babel Standalone | Latest | In-browser JSX transpilation |
| Three.js | 0.160.0 | 3D rendering for Final Kick 3D |
| Web Audio API | Native | All synthesized game sounds (90+ types) |
| Web Bluetooth API | Native | Cali Clear device connection |
| CSS-in-JS | Inline | All styling via React inline styles |

### Single-File Architecture

The entire application lives in one file:

- **`moodlab-arena-v6.jsx`** -- 22,484 lines
- **`index.html`** -- 78 lines (loader, phone frame, back button)

No build step. No bundler. No CSS files. No component splitting. Babel transpiles in the browser at runtime.

### How It Loads

1. `index.html` loads React 18, ReactDOM, Three.js, and Babel from CDN
2. Fetches `moodlab-arena-v6.jsx` as raw text
3. Regex-replaces the `import` statement and `export default` to work without modules
4. Babel transforms JSX to JavaScript
5. `new Function()` evaluates the code and returns `MoodLabArena`
6. `ReactDOM.createRoot` renders the component into `#root`

The `#root` div is fixed at 430x932px on desktop (with phone-frame border-radius and shadow) and 100% on mobile.

---

## 2. Architecture

### File Structure

```
/
  index.html              -- Loader, CDN scripts, phone frame
  moodlab-arena-v6.jsx    -- Entire application (22,484 lines)
  assets/arena/
    hub.png, arcade.png, stage.png, oracle.png, wall.png, worldcup.png
    hub.mp4, arcade.mp4, stage.mp4, oracle.mp4, wall.mp4, worldcup.mp4
    laugh.m4a, win.m4a, lose.m4a
  Doc/                    -- Developer documentation
  ble/                    -- Reusable BLE hooks (bleUtils.js, useBleDevice.js, useBleArena.js)
```

### Codebase Breakdown by Line Range

| Lines | Content |
|---|---|
| 1-95 | Constants: zone colors, loyalty tiers, daily rewards, challenges, shop, badges |
| 96-104 | Color palette (`C` object) |
| 105-260 | Spectator system, glass design constants, game data arrays |
| 260-500 | Oracle games, WC matches, predictions, Crystal Ball, Strain Battle data |
| 500-560 | Wall data: leaderboards, records, activity, achievements, friends, champions |
| 560-850 | World Cup teams (50), themed tournament teams (13 games), tournament formats |
| 850-1015 | WC groups/prizes, live matches, puff config, fish data, Simon Puffs, auction |
| 1018-1840 | `MoodLabArena()` component start: ~544 `useState` hooks, ~111 `useRef` |
| 1840-2000 | `useEffect` hooks: timers, jackpot, BLE celebration, coin pulse |
| 2000-2830 | Spectator engine, atmosphere engine, action timer, Three.js 3D scene |
| 2830-3200 | `startMatch`, `startDuel`, sound system setup |
| 3200-3670 | `playFx` -- 90+ synthesized sound types |
| 3670-4600 | Visual effects: confetti, smoke, screen shake/flash, puff wave |
| 4600-5520 | Match intro, Final Kick engine, World Cup tournament logic |
| 5520-6530 | WC knockout, game-specific tournaments, BLE connect/disconnect |
| 6530-6670 | BLE IIFE: per-render puff ref sync (35 game branches) |
| 6670-7800 | Puff Events system, Halftime mini-games, Beat Drop, Puff Limbo, Derby |
| 7800-9100 | Stage zone render, Fortune zone render, Fortune game launchers |
| 9100-21550 | All 35 game render blocks and logic |
| 21550-21740 | Loyalty system helpers: `getCurrentTier`, `getCoinMultiplier`, `awardXP`, `recordGameResult` |
| 21740-21860 | Profile overlay render |
| 21860-22200 | Me tab render (loyalty sub-tabs) |
| 22200-22484 | Bottom nav, root render, CSS keyframes (`<style>` tag) |

### State Management

No external state library. Everything lives in React hooks at the top of `MoodLabArena`:

- **~544 `useState` calls** -- every game, UI panel, animation, and system feature has its own state
- **~111 `useRef` calls** -- timers, intervals, DOM refs, BLE handles, game loop refs

### Navigation State Machine

Navigation is driven by four primary state values:

```
tab ("arena" | "live" | "me")
  |
  +-- zone (null | "arcade" | "stage" | "oracle" | "wall" | "worldcup")
        |
        +-- selectedGame (game ID string | null)
              |
              +-- gameActive (game object | null)
```

| State | Values | Meaning |
|---|---|---|
| `tab` | `"arena"` / `"live"` / `"me"` | Top-level navigation tab |
| `zone` | `null` / `"arcade"` / `"stage"` / `"oracle"` / `"wall"` / `"worldcup"` | Current zone (null = Hub) |
| `selectedGame` | Game ID string or null | Which game card was tapped (shows detail card) |
| `gameActive` | Game object or null | The game is running |

The render function is a large conditional tree: `tab -> zone -> selectedGame/gameActive`.

---

## 3. Device Required -- BLE Integration

### BLE Connection Is Mandatory

A Cali Clear device must be connected via Bluetooth to play ANY game. There are **5 BLE gates** that block gameplay without a connection:

| Gate Function | Zone | Check |
|---|---|---|
| `startMatch()` | Arcade | `if(!bleConnected) { setShowBlePopup(true); return; }` |
| `startShowGame()` | Stage | Same guard |
| `launchGame()` | Fortune | Same guard |
| `wcStartGroupMatch()` | World Cup | Same guard |
| `wcStartKnockoutMatch()` | World Cup | Same guard |

When blocked, the app shows a BLE connection popup and notifies the user.

### Hub Welcome Card

The arena hub displays a "Connect Your Cali Clear" welcome card when no device is connected, prompting the user to pair.

### Connection Celebration

When a device connects for the first time in a session, the app triggers:
- A notification: "Device Connected! 1.5x Coin Bonus Active!"
- The `achievement` sound effect
- The 1.5x device multiplier activates

### Input Mode Selector -- REMOVED

The input mode selector (Auto/Fixed/Ask) still exists in state but is vestigial. Puff via BLE is the only meaningful input. The on-screen puff button serves as fallback for testing only.

### Device Protocol

| Property | Value |
|---|---|
| BLE Service UUID | `0000ffe0-0000-1000-8000-00805f9b34fb` |
| Notify Characteristic | `0000ffe6-0000-1000-8000-00805f9b34fb` |
| Write Characteristic | `0000ffe5-0000-1000-8000-00805f9b34fb` (reserved, unused) |

**Packet format** (6 bytes each):

| Packet | Hex | Meaning |
|---|---|---|
| Puff Start | `b4 b4 02 00 04 4b` | Heating element activates, puff begins |
| Puff Stop | `b4 b5 02 00 05 4b` | Heating cancelled, puff ends |

### Connection Flow

```
connectBle()
  -> navigator.bluetooth.requestDevice({ filters: [{ services: [BLE_SERVICE_UUID] }] })
  -> device.gatt.connect()
  -> server.getPrimaryService(BLE_SERVICE_UUID)
  -> service.getCharacteristic(BLE_NOTIFY_CHAR_UUID)
  -> charNotify.addEventListener("characteristicvaluechanged", handler)
  -> charNotify.startNotifications()
  -> setBleConnected(true)
  -> Show Device Optimization screen (progress bar animation)
```

### 15-Second Safety Timeout

If a `PUFF_STOP` packet is never received (e.g., BLE glitch), a safety timer auto-stops the puff after 15 seconds:

```javascript
btPuffTimeout.current = setTimeout(() => {
  setBtPuffActive(false);
  btPuffUp.current?.();
  btPuffEventUp.current?.();
}, 15000);
```

### Per-Render IIFE for Stale Closure Prevention

The BLE `characteristicvaluechanged` listener is registered **once** at connect time. To avoid stale closures, a per-render IIFE (immediately invoked function expression) writes the current game's handler closures into refs:

```javascript
// Keep BT puff refs in sync with whichever game is currently active.
(() => {
  const id = gameActive?.id;
  let down = null, up = null;
  if (id === "finalkick" || ...) { down = kickStartCharge; up = kickStopCharge; }
  else if (id === "balloon")     { down = bpStartCharge;  up = bpStopCharge; }
  // ... 35 total branches ...
  btPuffDown.current = down;
  btPuffUp.current   = up;
  btPuffEventDown.current = puffEventHoldDown;
  btPuffEventUp.current   = puffEventHoldUp;
})();
```

The notification handler always reads from `btPuffDown.current` / `btPuffUp.current`, never from closed-over values.

### All 35 Games Wired to BLE

Every game has a branch in the IIFE. Games fall into two categories:

| Category | Behavior | Example |
|---|---|---|
| Hold-based | `down` = start charging, `up` = release | Final Kick, Balloon Pop, Hooked |
| Tap-based | `down` = fire action, `up` = null | Tug of War, Puff Derby, Rhythm Puff |

---

## 4. The 3 Core Zones

### Arcade -- 16 Skill-Based Games

**Color:** Cyan `#00E5FF`
**Icon:** Joystick
**Entry function:** `startMatch(game, mode)`

| # | Game | Emoji | Type | Puff Style |
|---|---|---|---|---|
| 1 | Final Kick | Soccer | Skill | Hold (power charge) |
| 2 | Final Kick 2 | Soccer+Fire | Precision | Double hold (X then Y aim) |
| 3 | Final Kick 3D | Soccer+Globe | 3D Precision | Double hold in 3D (Three.js) |
| 4 | Hot Potato | Bomb | Luck | Hold (pass speed) |
| 5 | Russian Roulette | Dice | Luck | Hold (dodge) |
| 6 | Wild West Duel | Cowboy | Reaction | Tap (draw speed) |
| 7 | Balloon Pop | Balloon | Strategy | Hold (air amount) |
| 8 | Puff Pong | Ping Pong | Skill | Hold=up, release=drift |
| 9 | Rhythm Puff | Music Note | Rhythm | Tap (hit notes) |
| 10 | Tug of War | Muscle | Team | Tap (spam puffs) |
| 11 | Hooked | Fishing Rod | Skill | Hold (reel suction) |
| 12 | Puff RPS | Fist | Strategy | Hold (power charge) |
| 13 | Beat Drop | Headphones | Music | Hold (wait for drop, release on beat) |
| 14 | Puff Clock | Stopwatch | Precision | Hold (time exactly) |
| 15 | Puff Limbo | Circus Tent | Endurance | Hold (match increasing targets) |
| 16 | Puff Derby | Horse Racing | Racing | Tap spam (speed) |

### Stage -- 6 Live Shows

**Color:** Gold `#FFD93D`
**Icon:** Circus Tent
**Entry function:** `startShowGame(game)`

Features an MC system with commentary lines, elimination engine, audience side-picking, and role selection (contestant/audience/judge).

| # | Show | Emoji | Type | Puff Style |
|---|---|---|---|---|
| 1 | Vibe Check | Brain | Trivia | Duration-based (TAP=A, SHORT=B, MED=C, LONG=D) |
| 2 | Higher or Lower | Chart | Knowledge | Hold (short=lower, long=higher) |
| 3 | The Price is Puff | Money | Knowledge | Hold (price guess via duration) |
| 4 | Survival Trivia | Trophy | Trivia | Duration-based answer selection |
| 5 | Simon Puffs | Red Circle | Memory | Hold (match duration pattern) |
| 6 | Puff Auction | Gavel | Strategy | Hold (bid duration) |

### Fortune -- 15 Games (13 Oracle + 2 shared)

**Color:** Gold `#FFD93D`
**Icon:** Crystal Ball
**Entry function:** `launchGame(game)`

Fortune games are organized into sub-categories within the zone:

| Sub-tab | Games |
|---|---|
| Sportsbook | Fortune Teller, Strain Battle, Match Predictor, Daily Bets |
| Luck | Spin & Win, Puff Slots, Coin Flip |
| Table | Puff Blackjack, High Card Puff (coming soon), Craps & Clouds |
| Mystery | Mystery Box, Scratch & Puff, Fortune Cookie, Treasure Map |
| Bets | Puff Derby |

Fortune has its own progression system:

| Level | Min Wagered | Color |
|---|---|---|
| Bronze Gambler | 0 | #CD7F32 |
| Silver Gambler | 1,000 | #C0C0C0 |
| Gold Gambler | 5,000 | #FFD700 |
| Platinum Player | 15,000 | #E5E4E2 |
| Diamond Dealer | 50,000 | #B9F2FF |
| High Roller | 200,000 | #FFD700 |

---

## 5. All 35 Games -- Brief Mechanics

### Arcade Games (16)

| Game | Puff Mechanic | Base Coins | BLE Down Handler | BLE Up Handler |
|---|---|---|---|---|
| Final Kick | Hold to charge shot power | 50 | `kickStartCharge` | `kickStopCharge` |
| Final Kick 2 | Double hold: X-axis then Y-axis aim | 50 | `kickStartCharge` | `kickStopCharge` |
| Final Kick 3D | Double hold in 3D view (Three.js) | 50 | `kickStartCharge` | `kickStopCharge` |
| Hot Potato | Hold to charge pass speed | 30 | `hpStartPuff` | `hpStopPuff` |
| Russian Roulette | Hold to attempt dodge | 30 | `rrStartPuff` | `rrStopPuff` |
| Wild West Duel | Tap to draw (reaction speed) | 40 | `duelShoot` | `duelReleasePuff` |
| Balloon Pop | Hold to inflate (don't pop!) | 30 | `bpStartCharge` | `bpStopCharge` |
| Puff Pong | Hold = paddle moves up | 30 | `ppPuffUp` | `ppPuffRelease` |
| Rhythm Puff | Tap on beat | 30 | `rpPuffHit` | null (tap-only) |
| Tug of War | Tap spam = pulling force | 30 | `towPuff` | null (tap-only) |
| Hooked | Hold = reel suction level | 30 | `hookStartPuff` | `hookStopPuff` |
| Puff RPS | Hold to charge power after choice | 30 | `rpsStartPuff` | `rpsStopPuff` |
| Beat Drop | Hold during build, release on drop | 30 | `bdStartHold` | `bdReleaseHold` |
| Puff Clock | Hold for exact target time | 30 | `pcStartPuff` | `pcStopPuff` |
| Puff Limbo | Hold to match increasing targets | 30 | `plStartPuff` | `plReleasePuff` |
| Puff Derby | Tap spam = horse speed | 30 | `pdPuff` | null (tap-only) |

### Stage Shows (6)

| Show | Puff Mechanic | Base Coins | BLE Down | BLE Up |
|---|---|---|---|---|
| Vibe Check | Duration = answer (TAP/SHORT/MED/LONG) | 50 | `vcPuffStart` | `vcPuffStop` |
| Higher or Lower | Short puff = lower, long = higher | 40 | inline lambda | inline lambda |
| The Price is Puff | Hold duration = price guess | 40 | `pipStartPuff` | `pipStopPuff` |
| Survival Trivia | Duration = answer selection | 50 | `stPuffStart` | `stPuffStop` |
| Simon Puffs | Hold duration = match pattern type | 40 | `spStartPuff` | `spEndPuff` |
| Puff Auction | Hold = bid duration | 40 | `paStartBid` | `paEndBid` |

### Fortune Games (13)

| Game | Puff Mechanic | BLE Down | BLE Up |
|---|---|---|---|
| Fortune Teller (Crystal Ball) | Hold to choose yes/no | `cbHandlePuff` | `cbHandlePuffEnd` |
| Strain Battle | Hold to vote left/right | `sbHandlePuff` | `sbHandlePuffEnd` |
| Match Predictor | Hold to pick outcome | `mpHandlePuff` | `mpHandlePuffEnd` |
| Daily Bets | Hold to answer | `dpHandlePuff` | `dpHandlePuffEnd` |
| Spin & Win | Tap to spin | inline lambda | null |
| Puff Slots | Hold to spin reels | `slotsHandlePuff` | `slotsHandlePuffEnd` |
| Coin Flip | Hold for confidence multiplier | `cfHandlePuff` | `cfHandlePuffEnd` |
| Puff Blackjack | Short=Hit, Long=Stand | `bjHandlePuff` | `bjHandlePuffEnd` |
| Craps & Clouds | Hold duration = dice roll | `crapsHandlePuff` | `crapsHandlePuffEnd` |
| Mystery Box | Hold to reveal | `mbHandlePuff` | `mbHandlePuffEnd` |
| Scratch & Puff | Hold to scratch | `scHandlePuff` | `scHandlePuffEnd` |
| Fortune Cookie | Hold to crack | `fcHandlePuff` | `fcHandlePuffEnd` |
| Treasure Map | Hold to dig | `tmHandlePuff` | `tmHandlePuffEnd` |

---

## 6. Puff Mechanics

### Universal Puff Action Bar

Most games share a universal puff action bar with a power meter that fills while the player holds. The bar has five power zones:

| Zone | Max % | Color | Description |
|---|---|---|---|
| TAP | 15% | `#555F85` (dim gray) | Barely touched |
| SHORT | 40% | `#8892B8` (light gray) | Quick puff |
| GOOD | 65% | `#00E5FF` (cyan) | Decent hit |
| PERFECT | 90% | `#7FFF00` (lime) | Sweet spot zone |
| BLINKER | 100% | `#FF4444` (red) | Maximum power, risky |

### Sweet Spot Randomization

Each round randomizes the sweet spot position:

```javascript
randomizeSweetSpot: () => {
  const min = 30 + Math.random() * 20; // 30-50%
  const max = min + 20 + Math.random() * 20; // +20-40% window
  return { min: Math.round(min), max: Math.min(95, Math.round(max)) };
}
```

The window is deliberately wide (20-40% range) for accessibility. Players can see the sweet spot zone on the bar and aim for it.

### Blinker Threshold

95%+ on the power meter = blinker territory. Blinkers are the maximum-power, maximum-risk play. They trigger special effects, sounds, and bonus multipliers in many games.

### Trivia Puff-to-Answer

For Vibe Check and Survival Trivia, puff duration maps to answer selection:

```javascript
const getTriviaPuffAnswer = (ms) =>
  ms < 800 ? 0 :    // TAP   = Answer A
  ms < 2000 ? 1 :   // SHORT = Answer B
  ms < 3500 ? 2 :   // MED   = Answer C
  3;                 // LONG  = Answer D
```

### Difficulty Rebalance Summary (21 Changes)

The codebase includes 21 difficulty reductions for accessibility:
- Wider sweet spot zones
- More forgiving timing windows
- Lower AI difficulty in early rounds
- Extended timer durations
- Reduced elimination speed in Stage shows

---

## 7. Loyalty System

### Dual Currency

| Currency | Symbol | Behavior | Usage |
|---|---|---|---|
| Mood Coins | Coins icon | Spendable -- can go down (purchases, bets) | Shop purchases, wagers |
| XP | XP bar | Never decreases -- only goes up | Tier progression |

### 5 Loyalty Tiers

| Tier | Icon | XP Required | Coin Multiplier | Color |
|---|---|---|---|---|
| Bronze | Medal-3 | 0 | 1.0x | `#CD7F32` |
| Silver | Medal-2 | 2,000 | 1.2x | `#C0C0C0` |
| Gold | Medal-1 | 8,000 | 1.5x | `#FFD700` |
| Diamond | Gem | 25,000 | 2.0x | `#00E5FF` |
| Legend | Fire | 75,000 | 3.0x | `#FF4D8D` |

### Multiplier Stacking

```
Total Multiplier = Tier Multiplier x Device Bonus

Device Bonus:
  - BLE connected: 1.5x
  - No device: 1.0x

Example (Gold tier + device):
  1.5 (Gold) x 1.5 (device) = 2.25x coin multiplier
```

Implementation:
```javascript
const getCoinMultiplier = () => {
  const tier = getCurrentTier();
  const deviceBonus = bleConnected ? 1.5 : 1.0;
  const mult = tier.mult * deviceBonus;
  return isNaN(mult) ? 1.0 : mult; // NaN safety guard
};
```

### Daily Check-in

7-day cycle with escalating rewards, resets after day 7:

| Day | Coins | XP | Bonus |
|---|---|---|---|
| 1 | 10 | 15 | -- |
| 2 | 15 | 20 | -- |
| 3 | 20 | 25 | -- |
| 4 | 30 | 30 | Gift |
| 5 | 40 | 40 | -- |
| 6 | 50 | 50 | -- |
| 7 | 100 | 100 | Chest! + Week Warrior badge |

Coins from daily check-in are multiplied by `getCoinMultiplier()`.

### 3 Daily Challenges

| ID | Task | Coin Reward | XP Reward | Icon | Auto-Detection |
|---|---|---|---|---|---|
| `play3` | Play 3 games today | 25 | 20 | Joystick | `gamesPlayed >= 3` in `recordGameResult` |
| `win1` | Win 1 game | 30 | 25 | Trophy | `won === true` in `recordGameResult` |
| `fortune1` | Try 1 Fortune game | 20 | 15 | Crystal Ball | Triggered in `launchGame()` |

Completing all 3 grants a bonus of `50 * getCoinMultiplier()` coins.

### 12 Badges

| ID | Icon | Name | Unlock Condition | Wired? |
|---|---|---|---|---|
| `fp` | Puff | First Puff | Play your first game | Yes -- auto-granted at start |
| `puff100` | Wind | Cloud Chaser | Play 100 games | Yes -- checked in `recordGameResult` |
| `blinker` | Angry Face | Blinker Beast | Hit 10 blinkers | Yes -- checked in `recordGameResult` |
| `streak5` | Fire | On Fire | 5 win streak | Yes -- checked in `recordGameResult` |
| `streak10` | Explosion | Unstoppable | 10 win streak | Yes -- checked in `recordGameResult` |
| `showchamp` | Star | Show Champ | Win a Stage show | Yes -- checked in `recordGameResult` when zone=stage |
| `fortuneking` | Crown | Fortune King | Win 5,000 coins in Fortune | Partially -- condition exists, not fully wired |
| `social` | Butterfly | Social Butterfly | Chat 50 messages | Partially -- `chatsSent` tracked |
| `collector` | Box | Collector | Buy 5 shop items | Yes -- checked in `buyShopItem` |
| `weekwarrior` | Shield | Week Warrior | 7-day check-in streak | Yes -- checked in `claimDaily` |
| `legend` | Trophy | Legend | Reach Legend tier | Yes -- checked in `awardXP` |
| `allgames` | Target | Explorer | Try every game | Yes -- checked in `recordGameResult` |

### 8 Shop Items

| ID | Icon | Name | Price | Category | Tier Required |
|---|---|---|---|---|---|
| `avatar_cat` | Cat | Cat Avatar | 200 | Avatar | -- |
| `avatar_alien` | Alien | Alien Avatar | 200 | Avatar | -- |
| `effect_smoke` | Smoke | Smoke Trail | 300 | Puff Effect | -- |
| `effect_fire` | Fire | Fire Trail | 500 | Puff Effect | -- |
| `frame_gold` | Sparkle | Gold Frame | 400 | Frame | Gold |
| `theme_neon` | Palette | Neon Theme | 600 | Theme | Diamond |
| `shield` | Shield | Streak Shield | 100 | Power-up | -- |
| `extratime` | Clock | Extra Time x3 | 150 | Power-up | -- |

Items with a `tier` requirement check the player's current tier before allowing purchase.

### Me Tab -- 5 Sub-Tabs

The Me tab (`tab === "me"`) renders `renderMe()`, which contains 5 loyalty sub-tabs:

| Sub-Tab | Content |
|---|---|
| Overview | Profile card, tier progress bar, stats grid, multiplier display, quick stats |
| Daily | 7-day check-in calendar, claim button, streak counter |
| Challenges | 3 daily challenges with progress indicators, completion rewards |
| Badges | 12 badges grid, earned vs locked state, unlock descriptions |
| Shop | 8 items grid, tier-gated items, purchase flow |

---

## 8. Loyalty-Arena Integration

### `recordGameResult(won, baseCoins, baseXP)`

The central function that bridges gameplay and the loyalty system. Called at the end of every game.

**What it does:**
1. Applies `getCoinMultiplier()` to base coins: `totalCoins = baseCoins * multiplier`
2. Adds bonus XP: `totalXP = baseXP + (won ? 15 : 5)`
3. Awards coins and XP to the player
4. Updates player profile stats (`gamesPlayed`, `gamesWon`, `totalPuffs`, `rankProgress`)
5. Shows floating reward popup animation
6. Checks and auto-completes daily challenges (`win1`, `play3`)
7. Checks and awards badges (`blinker`, `allgames`, `puff100`, `showchamp`, `streak5`, `streak10`)
8. Manages win streak: increment on win, reset on loss, bonus coins at milestones
9. Triggers tier-up detection via `awardXP`

**48 call sites** across all 35 games ensure every game result flows through this function.

### `getCoinMultiplier()`

Returns `tierMultiplier * deviceBonus` with NaN safety:
- Tier multiplier from `LOYALTY_TIERS` based on current XP
- Device bonus: 1.5x if BLE connected, 1.0x if not
- Falls back to 1.0 if result is NaN

### `awardXP(amount, reason)`

Awards XP and detects tier-ups:
1. Safely converts amount (NaN guard)
2. Adds XP to total
3. Loops through remaining tiers to check if any threshold was crossed
4. If tier-up detected: plays `level_up` sound, shows notification with new multiplier, spawns confetti
5. If reached Legend tier: awards the `legend` badge

### In-Game Multiplier Badge

During gameplay, a small badge appears in the top-right showing the active multiplier:

```
[Medal-1 1.5x] [Puff 1.5x]  (Gold tier + device connected)
```

Shown in Arcade, Stage, and Fortune zone hub headers.

### Floating Reward Popup

After every game, a `+X coins +Y XP` animation floats up from the center of the screen:

```javascript
const showFloatingReward = (coins, xpAmt) => {
  setFloatingReward({ coins, xp: xpAmt, key: Date.now() });
  setTimeout(() => setFloatingReward(null), 2000);
};
```

Uses the `rewardFloatUp` CSS keyframe animation.

### Win Streak Tracking

| Streak | Reward |
|---|---|
| 3 | Notification "3 Win Streak!" |
| 5 | +50 bonus coins + `streak_fire` sound + `streak5` badge |
| 10 | +200 bonus coins + `crowd` sound + confetti + `streak10` badge |

The current win streak is displayed in the header when >= 2, and resets to 0 on any loss.

### Reward Breakdown Panels

10 games display detailed reward breakdowns at their result screens, showing:
- Base coins earned
- Multiplier applied (tier + device)
- Total coins after multiplier
- XP earned

### My Progress Buttons

11 games include a "My Progress" button on their result screens that navigates to the Me tab.

### Achievement Unlock Popup

When a badge is earned, a full-screen popup appears for 3 seconds with:
- Badge icon, name, and description
- The `achievement` sound effect
- Scale-in animation

### Coin Pulse Animation

Every time the `coins` state changes, a brief pulse animation triggers on the coin display in the header:

```javascript
useEffect(() => {
  if(coins > 0) { setCoinPulse(true); setTimeout(() => setCoinPulse(false), 600); }
}, [coins]);
```

### XP Micro-Progress Bar

A thin progress bar below the header shows XP progress toward the next tier.

### Zone Hub Loyalty Status Badges

Each zone hub (Arcade, Stage, Fortune) displays loyalty status badges:
- Current tier icon and multiplier
- Device bonus badge (if BLE connected)
- Win streak badge (if streak >= 2)

### Coin Earn Preview on Arcade Game Cards

Arcade game cards show a "Earn X coins" preview based on the current multiplier, giving players an incentive before entering a game.

### NaN Safety Guards

Multiple scoring functions include NaN guards:

```javascript
const safeCoins = Math.max(0, Math.round(Number(baseCoins) || 0));
const safeXP = Math.max(0, Number(baseXP) || 0);
const mult = isNaN(mult) ? 1.0 : mult;
```

---

## 9. Sound System

### Architecture

All game sounds are synthesized at runtime using the Web Audio API. A shared `AudioContext` is reused across calls (no longer creates a new context per `playFx` call).

```javascript
const sharedAudioCtx = useRef(null);
const playFx = useCallback((type, vol=1.0) => {
  if(!audioOn) return;
  // Check for real audio files first (win, lose, laugh)
  // Otherwise, synthesize via Web Audio API
  if(!sharedAudioCtx.current || sharedAudioCtx.current.state === 'closed') {
    sharedAudioCtx.current = new AudioContext();
  }
  // ... switch(type) with 90+ synthesized sound cases
}, [audioOn]);
```

### Audio Files (3)

| File | Purpose | Volume |
|---|---|---|
| `assets/arena/win.m4a` | Win moments | 0.7 |
| `assets/arena/lose.m4a` | Loss moments | 0.6 |
| `assets/arena/laugh.m4a` | Comedy moments | 0.6 |

### Synthesized Sound Categories (90+)

| Category | Sounds |
|---|---|
| Universal UI | `tap`, `select`, `nav`, `back`, `coin_collect`, `level_up`, `notification`, `error`, `countdown_tick`, `countdown_go`, `streak_fire`, `blinker`, `success`, `puff`, `miss` |
| Football / Kick | `kick`, `goal`, `save`, `whistle`, `charge`, `crowd` |
| Wild West | `gunshot`, `gun_click`, `gun_bang`, `revolver_spin` |
| Balloon Pop | `balloon_inflate`, `balloon_pop` |
| Puff Pong | `pong_hit`, `pong_wall`, `pong_score` |
| Rhythm Puff | `rhythm_hit`, `rhythm_miss`, `rhythm_perfect` |
| Tug of War | `rope_pull` |
| And many more... | `explosion`, `bomb_tick`, `reel_spin`, `card_deal`, `dice_roll`, `auction_gavel`, `show_intro`, `lucky_hour`, `achievement`, etc. |

### Loyalty-Specific Sounds

| Sound | When Played |
|---|---|
| `coin_collect` | Daily check-in, challenge completion |
| `success` | Shop purchase, challenge complete |
| `level_up` | Tier promotion |
| `crowd` | 7-day streak completion, 10-win streak |
| `achievement` | Badge earned, BLE connection celebration |
| `streak_fire` | 5-win streak |

### Total Call Sites

**379 `playFx` call sites** across the entire codebase, covering every game action, UI interaction, and loyalty event.

---

## 10. Visual Effects

### Core Effects

| Effect | Function | Description |
|---|---|---|
| Screen Shake | `triggerScreenShake()` | Brief CSS transform shake on the root element |
| Screen Flash | `triggerScreenFlash(type)` | Full-screen color overlay -- types: `"goal"` (green), `"save"` (cyan), `"miss"` (red), `"blinker"` (gold) |
| Confetti | `spawnConfetti(count, colors)` | Spawns animated particles that fall and fade |
| Smoke | `spawnSmoke(count)` | Floating gray particles rising upward |
| Puff Wave | `triggerPuffWave()` | Circular wave expanding outward |
| Puff Bubbles | `setPuffBubbles(...)` | Floating bubble particles during puff charge |

### Match Intro Sequence

A cinematic sequence before competitive games:

```
"enter" -> Opponent slides in
"stats" -> Show matchup stats
"countdown" -> 3... 2... 1...
"go" -> Screen flash + crowd cheer
```

### Dim Lights

During puff charge phases, the background dims to focus attention on the power meter.

### BLE Glow Overlay

When a physical puff is active (`btPuffActive === true`), a full-screen cyan-to-purple gradient overlay pulses:

```css
@keyframes btPuffGlow { ... }
```

### CSS Keyframes

**90 `@keyframes` declarations** embedded in a `<style>` tag within the render output. Key animations include:

| Keyframe | Purpose |
|---|---|
| `rewardFloatUp` | Floating reward notification rising and fading |
| `scaleIn` | Badge/achievement popup entrance |
| `btPuffGlow` | BLE puff active glow overlay |
| `fadeIn` | Generic fade-in for panels and overlays |
| `pulse` | Pulsing effect for live indicators |
| `breathe` | Slow scale breathing for ambient elements |
| `sheetUp` | Bottom sheet sliding up entrance |
| `tickerScroll` | CSS-driven ticker marquee (no React re-renders) |
| `confetti` | Confetti particle fall animation |
| `countPulse` | Countdown number pulsing |
| `coinPulse` | Header coin balance glow on change |

---

## 11. Tournament System

### World Cup 2026 (Special Event)

A limited-time tournament zone featuring:

- **50 teams** across 6 confederations (CONCACAF, CONMEBOL, UEFA, AFC, CAF, OFC) + 2 bonus teams (Vietnam, China)
- **12 groups** of 4 teams each
- **Full bracket system**: Group Stage (3 matches) -> Knockout rounds -> Final
- **6-hour cooldown** between tournament entries (`WC_COOLDOWN_MS`)
- **Multiple game modes**: Players can play the WC bracket using Final Kick 1/2/3, Puff Pong, Balloon Pop, Russian Roulette, Hot Potato, Hooked, RPS, Rhythm, or Tug of War
- **Prize structure**: Champion (50K pts/500 coins), Runner-Up (25K/250), Third (10K/100), Fourth (5K/50), Group Exit (1K/10)

### Game-Specific Tournaments (13 Unique Formats)

Each Arcade game has its own themed tournament format stored in `GAME_TOURNAMENTS`:

| Game | Tournament Name | Format | Rounds |
|---|---|---|---|
| Wild West | The Outlaw Circuit | 16-player Single Elimination | 4 rounds |
| Russian Roulette | The Underground | Survival Series (4 Tables -> Final) | 5 rounds |
| Balloon Pop | Puff Fest | Party Rounds (3 Heats + Final) | 4 rounds |
| Puff Pong | Neon League | Swiss System (4 Rounds + Final) | 5 rounds |
| Rhythm Puff | Tour de Puff | Score Chase (3 Songs) | 3 rounds |
| Tug of War | The Puff Games | Round Robin Teams | 4 rounds |
| Hot Potato | Bomb Squad Cup | Heats + Grand Final | 3 rounds |
| Puff RPS | Dojo Championship | Double Elimination (16 Players) | 7 rounds |
| Hooked | Deep Sea Masters | Catch Competition (3 Sessions) | 3 rounds |
| Beat Drop | The Drop Zone | Score Chase (3 Songs) | 3 rounds |
| Puff Clock | Time Masters | Precision Tournament (5 Rounds) | 5 rounds |
| Puff Limbo | Limbo Legends | Survival (7 Rounds) | 7 rounds |
| Puff Derby | Grand Derby | Race Series (3 Races) | 3 rounds |

Each tournament has 6 themed teams with unique names and emojis. Prize structure is uniform: Gold (30K pts/800 coins), Silver (15K/400), Bronze (7.5K/200), Fourth (3K/100).

---

## 12. Social Features

### The Wall (5 Tabs)

The Wall zone displays leaderboards and records:

| Tab | Content |
|---|---|
| All | Overall coin leaderboard (15 players) |
| Arcade | Win count leaderboard |
| Stage | Win count leaderboard |
| Oracle | Win percentage leaderboard |
| Tournament | Tournament wins leaderboard |

Additional Wall content:
- **Records Board**: 8 records (Fastest Draw, Longest Puff Limbo, Highest Combo, etc.)
- **Activity Feed**: Recent actions from other players
- **Champions Podium**: Tournament winners with badges
- **Friends**: Online status, last seen
- **Recent Opponents**: Rematch history

### Chat System

Global chat with bot-generated messages for atmosphere. Players can send messages that are tracked via `chatsSent` for the Social Butterfly badge.

```javascript
const CHAT_BOTS = ["VibeKing","ChillMaster","NeonQueen","BlazedPanda",...];
const CHAT_MSGS = ["Let's go!","Ez","GG","Nah that's cap","LETSGOOO",...];
```

### Spectator System

During games, a live spectator ticker shows simulated spectators:
- **40 unique spectator names** with 20 emojis
- Spectators spawn from screen edges and float across
- 10 ticker messages (e.g., "just joined the arena", "puffed a blinker")
- Crowd energy meter (0-100, builds with activity)
- Crowd eruption at 95+ energy (gold particle burst)

### Audience Side System

During competitive games, spectators can pick sides ("you" vs "ai") with:
- Side-specific chat channels
- Fan counts per side
- Traitor detection (switching sides)
- Predictions on outcomes

### Puff Reactions

Players can send puff reactions during games -- emojis that float across the screen with particle effects.

### Synchronized Puff Events

Arena-wide events that all players participate in simultaneously:
- **Countdown Puff**: Everyone puffs together, combined duration tracked
- **Blinker Challenge**: See who can hold the longest blinker
- **Puff Chain**: Keep the chain alive by puffing before the timer expires
- **4:20 Challenge**: Hold for exactly 4.20 seconds

Events cycle every 90 seconds (demo timing) with a 2-minute initial delay.

---

## 13. Key Functions Reference

| Function | Line | Description |
|---|---|---|
| `MoodLabArena()` | 1018 | Root component -- all state, logic, and render |
| `connectBle()` | 6534 | Web Bluetooth connection flow |
| `disconnectBle()` | 6613 | Graceful BLE disconnect |
| `startMatch(game, mode)` | 2828 | Entry point for Arcade games (BLE gate) |
| `startShowGame(game)` | 7816 | Entry point for Stage shows (BLE gate) |
| `launchGame(game)` | 9072 | Entry point for Fortune games (BLE gate) |
| `wcStartGroupMatch(idx)` | 5399 | Start a WC group match (BLE gate) |
| `wcStartKnockoutMatch()` | 5511 | Start a WC knockout match (BLE gate) |
| `playFx(type, vol)` | 3208 | Synthesized sound effects (90+ types) |
| `playAudio(src, vol)` | 3204 | Play external audio file |
| `notify(msg, color)` | 2791 | Toast notification (2.2s auto-dismiss) |
| `setCommentary(text)` | 3688 | In-game commentator text |
| `spawnConfetti(count, colors)` | 3671 | Particle confetti effect |
| `spawnSmoke(count)` | 3679 | Smoke particle effect |
| `triggerScreenShake()` | via `setScreenShake(true)` | Screen shake effect |
| `triggerScreenFlash(type)` | via `setScreenFlash(type)` | Flash overlay (goal/save/miss/blinker) |
| `startMatchIntro(opponent)` | 4630 | Cinematic match intro sequence |
| `getCoinMultiplier()` | 21564 | Calculate tier x device multiplier |
| `awardXP(amount, reason)` | 21640 | Award XP with tier-up detection |
| `recordGameResult(won, base$, baseXP)` | 21663 | Central game result processor |
| `showFloatingReward(coins, xp)` | 21658 | Animated reward popup |
| `claimDaily()` | 21577 | Claim daily check-in reward |
| `completeChallenge(id)` | 21599 | Complete a daily challenge |
| `buyShopItem(item)` | 21620 | Purchase from shop |
| `showAchievementPopup(badge)` | 21571 | Full-screen badge unlock popup |
| `getCurrentTier()` | 21552 | Get player's current loyalty tier |
| `walkTo(zone)` | (callback) | Zone navigation with walk animation |
| `spawnSpectatorPuff()` | 1865 | Generate a spectator puff cloud |
| `randomizeUniversalSweetSpot()` | via `UNIVERSAL_PUFF_CONFIG` | Randomize sweet spot for next round |
| `getTriviaPuffAnswer(ms)` | 928 | Map puff duration to trivia answer index |
| `renderMe()` | 21860 | Render the Me tab with loyalty sub-tabs |
| `updateProfileAfterGame(won)` | 21727 | Update player profile stats |

---

## 14. Data Constants Reference

| Constant | Line | Description |
|---|---|---|
| `ARENA_IMAGES` / `ARENA_VIDEOS` | 10-25 | Zone background media paths |
| `Z` | 28-34 | Zone configuration (colors, names, icons) |
| `FORTUNE_LEVELS` | 36-43 | 6 Fortune gambling progression levels |
| `LOYALTY_TIERS` | 46-52 | 5 loyalty tiers with XP requirements and multipliers |
| `DAILY_REWARDS` | 54-62 | 7-day check-in reward schedule |
| `DAILY_CHALLENGES` | 64-68 | 3 daily challenge definitions |
| `SHOP_ITEMS` | 70-79 | 8 purchasable items with prices and tier gates |
| `LOYALTY_BADGES` | 81-94 | 12 badge definitions with unlock conditions |
| `C` | 97-104 | Master color palette (18 colors) |
| `SPECTATOR_NAMES` | 107-116 | 40 simulated spectator names |
| `GLASS_CLEAR` / `GLASS_CARD` / `LG` | 132-182 | Liquid glass design system styles |
| `PLAY_GAMES` | 185-202 | 16 Arcade game definitions |
| `SHOW_GAMES` | 204-212 | 6 Stage show definitions |
| `MC_LINES` | 214-222 | MC commentary template strings |
| `ORACLE_GAMES` | 224-237 | 12 Oracle/Fortune game definitions |
| `VC_QUESTIONS_V2` | 332-341 | 8 English trivia questions (Vibe Check) |
| `UNIVERSAL_PUFF_CONFIG` | 910-927 | Puff bar zones, sweet spot, blinker threshold |
| `HOOK_FISH` | 930-939 | 8 fish types for Hooked (common/rare/legendary) |
| `WC_TEAMS` | 558-616 | 50 World Cup teams with ratings and confederations |
| `WC_GROUPS` | 833-838 | 12 group assignments |
| `GAME_TEAMS` | 619-724 | Themed teams for 13 game tournaments (6 teams each) |
| `GAME_TOURNAMENTS` | 726-831 | 13 tournament format definitions |
| `WALL_LEADERBOARD` | 382-468 | 5 leaderboard datasets (15 players each) |
| `WALL_RECORDS` | 469-478 | 8 all-time record entries |
| `ACHIEVEMENTS` | 524-537 | 12 achievement definitions (separate from loyalty badges) |
| `RANKS` | 540-547 | 6 social ranks (Bronze through Legendary) |
| `DEVICE_MODELS` | 974-981 | 6 device model definitions (CC S1-S3, Select S1-S2, None) |
| `DEVICE_POOLS` | 982-986 | 3 device pools with reward multipliers |
| `BLE_SERVICE_UUID` | 1008 | BLE service UUID |
| `BLE_PUFF_START` / `BLE_PUFF_STOP` | 1012-1013 | 6-byte BLE packet payloads |

---

## 15. Deployment

### Vercel (Production)

The app is deployed on Vercel with zero build configuration. Vercel serves `index.html` and static assets directly.

### Local Development

No build step required. Any static file server works:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Or just open index.html in a browser (some BLE features require HTTPS)
```

**Note:** Web Bluetooth requires a secure context (HTTPS or localhost). For BLE testing, use `localhost` or deploy to Vercel.

### No Build Pipeline

There is no:
- Webpack, Vite, Rollup, or any bundler
- npm, yarn, or any package manager
- TypeScript
- CSS modules, Tailwind, or any CSS framework
- ESLint, Prettier, or any linting tool
- Test framework

The codebase is intentionally kept as a single-file monolith with zero dependencies beyond CDN-loaded libraries.

### Key Files

| File | Purpose |
|---|---|
| `index.html` | Entry point, CDN scripts, phone frame, Babel loader |
| `moodlab-arena-v6.jsx` | Entire application (22,484 lines) |
| `assets/arena/*.png` | Zone thumbnail images |
| `assets/arena/*.mp4` | Zone background videos |
| `assets/arena/*.m4a` | Audio files (win, lose, laugh) |

---

## Appendix: Quick Reference Card

```
ENTRY POINTS
  Arcade:  startMatch(game, "ai")     -> matchmaking -> gameActive
  Stage:   startShowGame(game)         -> gameActive
  Fortune: launchGame(game)            -> gameActive
  WC:      wcStartGroupMatch(idx)      -> gameActive
           wcStartKnockoutMatch()      -> gameActive

BLE GATES
  All 5 entry points check: if(!bleConnected) { block + show popup }

GAME RESULT FLOW
  Game ends -> recordGameResult(won, baseCoins, baseXP)
    -> coins * getCoinMultiplier() awarded
    -> XP + bonus awarded
    -> Profile updated
    -> Challenges auto-checked
    -> Badges auto-checked
    -> Win streak updated
    -> Floating reward shown
    -> Tier-up detection

MULTIPLIER FORMULA
  getCoinMultiplier() = LOYALTY_TIERS[currentTier].mult * (bleConnected ? 1.5 : 1.0)

NAVIGATION
  tab -> zone -> selectedGame -> gameActive
  "arena"  null    null          null         = Hub
  "arena"  "arcade" null        null         = Arcade Hub
  "arena"  "arcade" "finalkick" null         = Game Detail Card
  "arena"  "arcade" null        {id:"finalkick"} = Game Active
  "me"     --       --          --           = Loyalty / Profile
```

---

*Last updated: 2026-03-29 | Covers moodlab-arena-v6.jsx (22,484 lines)*
