# Loyalty System Developer Guide

> Covers the Me tab and its integration with the Arena. File: `moodlab-arena-v6.jsx`.

---

## 1. Loyalty Overview

### Core Loop

```
Puff --> Play --> Earn Coins+XP --> Level Up Tier --> Unlock Multipliers+Shop --> Play More
```

The loyalty system rewards every interaction. Players earn **Mood Coins** (spendable currency) and **XP** (permanent progression) from games, daily check-ins, and challenges. Higher tiers unlock bigger multipliers, which feed back into larger rewards per game.

### Design Principles

- **Simple** -- Two currencies, five tiers, no complicated math.
- **Fun** -- Win streaks, confetti, achievement popups, sound effects at every milestone.
- **Clear** -- Reward breakdowns shown after every game, multiplier badges visible during gameplay.

---

## 2. Dual Currency

### Mood Coins (`coins`)

- **Earned** from games, daily check-ins, challenges, win streak bonuses.
- **Spent** in the Shop to buy avatars, effects, themes, power-ups.
- **Risked** in Fortune zone games (Blackjack, Slots, Craps, etc.) -- you can lose coins.
- Stored in `useState`: `const [coins, setCoins] = useState(12580);` (line 1026).

### XP (`xp`)

- **Earned** from games, daily check-ins, challenges.
- **Never lost** -- XP only goes up.
- **Drives progression** -- XP determines your loyalty tier and multiplier.
- Stored in `useState`: `const [xp, setXp] = useState(7450);` (line 1027).

### Key Difference

| Property | Coins | XP |
|---|---|---|
| Direction | Goes up and down | Only up |
| Spent in Shop | Yes | No |
| Risked in Fortune | Yes | No |
| Determines tier | No | Yes |
| Multiplied by tier | Yes | No |

---

## 3. Five-Tier System

Defined in the `LOYALTY_TIERS` constant (line 46):

```js
const LOYALTY_TIERS = [
  { name:"Bronze",  icon:"🥉", color:"#CD7F32", xpReq:0,     mult:1.0 },
  { name:"Silver",  icon:"🥈", color:"#C0C0C0", xpReq:2000,  mult:1.2 },
  { name:"Gold",    icon:"🥇", color:"#FFD700", xpReq:8000,  mult:1.5 },
  { name:"Diamond", icon:"💎", color:"#00E5FF", xpReq:25000, mult:2.0 },
  { name:"Legend",  icon:"🔥", color:"#FF4D8D", xpReq:75000, mult:3.0 },
];
```

| Tier | XP Required | Coin Multiplier | Color |
|---|---|---|---|
| Bronze | 0 | 1.0x | `#CD7F32` |
| Silver | 2,000 | 1.2x | `#C0C0C0` |
| Gold | 8,000 | 1.5x | `#FFD700` |
| Diamond | 25,000 | 2.0x | `#00E5FF` |
| Legend | 75,000 | 3.0x | `#FF4D8D` |

### getCurrentTier() (line 21552)

Iterates `LOYALTY_TIERS` from highest to lowest, returns the first tier whose `xpReq` the player meets:

```js
const getCurrentTier = () => {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LOYALTY_TIERS[i].xpReq) return { ...LOYALTY_TIERS[i], idx: i };
  }
  return { ...LOYALTY_TIERS[0], idx: 0 };
};
```

Returns the tier object plus its `idx` (index in the array). Used everywhere: multiplier calculation, UI rendering, shop tier-gating.

### getNextTier() (line 21559)

```js
const getNextTier = () => {
  const tier = getCurrentTier();
  return tier.idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[tier.idx + 1] : null;
};
```

Returns `null` when the player has reached Legend tier.

---

## 4. Multiplier System

### getCoinMultiplier() (line 21564)

```js
const getCoinMultiplier = () => {
  const tier = getCurrentTier();
  const deviceBonus = bleConnected ? 1.5 : 1.0;
  const mult = tier.mult * deviceBonus;
  return isNaN(mult) ? 1.0 : mult;
};
```

**Formula:** `tierMultiplier x deviceBonus`

### Stacking Examples

| Tier | Device | Calculation | Total |
|---|---|---|---|
| Bronze, no device | 1.0 x 1.0 | = | **1.0x** |
| Silver, no device | 1.2 x 1.0 | = | **1.2x** |
| Gold, with device | 1.5 x 1.5 | = | **2.25x** |
| Diamond, with device | 2.0 x 1.5 | = | **3.0x** |
| Legend, with device | 3.0 x 1.5 | = | **4.5x** |

### Where the Multiplier Is Applied

The multiplier is applied in these locations:

1. **`recordGameResult()`** (line 21663) -- All game completions (48+ call sites across Arcade, Stage, Oracle, World Cup games).
2. **`claimDaily()`** (line 21577) -- Daily check-in coin rewards.
3. **`completeChallenge()`** (line 21599) -- Daily challenge coin rewards (including the all-done bonus).
4. **Fortune zone direct calls** -- Many Fortune games apply `getCoinMultiplier()` directly when awarding prizes:
   - Spin & Win segments (`setCoins(c => c + Math.round(seg.coins * getCoinMultiplier()))`)
   - Blackjack wins
   - Mystery Box prizes
   - Scratch Card payouts
   - Fortune Cookie rewards
   - Treasure Map discoveries
   - Craps wins

### NaN Guard

The `isNaN(mult) ? 1.0 : mult` guard (line 21568) prevents broken multipliers if `tier.mult` or `deviceBonus` ever resolve to `undefined`.

---

## 5. Device Bonus

### How It Works

When a Cali Clear BLE device is connected (`bleConnected === true`), the player receives a permanent **1.5x** multiplier that stacks with their tier multiplier.

### State

- `bleConnected` -- boolean state tracking BLE connection.
- `prevBleConnected` -- useRef tracking previous connection state (line 1042).

### Visual Indicators

1. **Header connect button** (line 22254) -- Green dot + "Connected" when active; orange dot + "Connect" when inactive.
2. **Me tab profile card** (line 21942) -- Shows "1.5x Device Bonus Active" badge when connected.
3. **In-game multiplier badge** (line 22206) -- Shows separate "1.5x" badge below the tier badge.
4. **Reward breakdown panels** -- Shows "Device Bonus x1.5" line when connected.
5. **Daily check-in** (line 22073) -- Shows "X.Xx multiplier active on rewards!" text.

### "Connect Your Cali Clear" Card (line 7407)

When `!bleConnected`, a floating card appears at the bottom of the Arena hub:

```
Connect Your Cali Clear
Tap to pair and start playing
[1.5x Coin Bonus] [Play All Games]
```

Clicking it opens the BLE popup (`setShowBlePopup(true)`).

---

## 6. Daily Check-in

### DAILY_REWARDS Constant (line 54)

```js
const DAILY_REWARDS = [
  { day:1, coins:10,  xp:15 },
  { day:2, coins:15,  xp:20 },
  { day:3, coins:20,  xp:25 },
  { day:4, coins:30,  xp:30, bonus:"🎁" },
  { day:5, coins:40,  xp:40 },
  { day:6, coins:50,  xp:50 },
  { day:7, coins:100, xp:100, bonus:"🏆 Chest!" },
];
```

| Day | Coins | XP | Bonus |
|---|---|---|---|
| 1 | 10 | 15 | -- |
| 2 | 15 | 20 | -- |
| 3 | 20 | 25 | -- |
| 4 | 30 | 30 | Gift |
| 5 | 40 | 40 | -- |
| 6 | 50 | 50 | -- |
| 7 | 100 | 100 | Chest |

### claimDaily() (line 21577)

```js
const claimDaily = () => {
  if (dailyCheckedIn) return;                    // 1. Guard: already claimed
  const dayIdx = dailyStreak % 7;                // 2. Cycle through 7 days
  const reward = DAILY_REWARDS[dayIdx];          // 3. Get today's reward
  const mult = getCoinMultiplier();              // 4. Apply multiplier
  const earnedCoins = Math.round(reward.coins * mult);
  setCoins(c => c + earnedCoins);                // 5. Award coins (multiplied)
  setXp(x => x + reward.xp);                    // 6. Award XP (not multiplied)
  setDailyStreak(s => s + 1);                    // 7. Increment streak
  setDailyCheckedIn(true);                       // 8. Mark claimed
  playFx("coin_collect");                        // 9. Sound effect
  notify(...);                                   // 10. Notification
  if ((dailyStreak + 1) % 7 === 0) {             // 11. Every 7th day:
    playFx("crowd");                             //     - crowd cheer
    // Award "Week Warrior" badge if not earned
  }
};
```

### State Variables

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `dailyStreak` | `useState(0)` | 0 | Total consecutive days claimed |
| `dailyCheckedIn` | `useState(false)` | false | Whether today's reward was claimed |

### Key Behaviors

- **Coin rewards are multiplied** by `getCoinMultiplier()`.
- **XP rewards are NOT multiplied** -- added raw.
- **7-day cycle** -- streak resets visually every 7 days via `dayIdx = dailyStreak % 7`.
- **Week Warrior badge** -- awarded every time streak hits a multiple of 7.
- Note: `dailyCheckedIn` resets to `false` on page reload since there is no persistence layer.

---

## 7. Daily Challenges

### DAILY_CHALLENGES Constant (line 64)

```js
const DAILY_CHALLENGES = [
  { id:"play3",    task:"Play 3 games today", reward:25, xpReward:20, icon:"🎮" },
  { id:"win1",     task:"Win 1 game",         reward:30, xpReward:25, icon:"🏆" },
  { id:"fortune1", task:"Try 1 Fortune game",  reward:20, xpReward:15, icon:"🔮" },
];
```

| ID | Task | Coin Reward | XP Reward | Icon |
|---|---|---|---|---|
| `play3` | Play 3 games today | 25 | 20 | 🎮 |
| `win1` | Win 1 game | 30 | 25 | 🏆 |
| `fortune1` | Try 1 Fortune game | 20 | 15 | 🔮 |

### Auto-Completion Wiring

Challenges are completed automatically by game logic, not manually:

- **`win1`** -- Triggered inside `recordGameResult()` when `won === true` (line 21676).
- **`play3`** -- Triggered inside `recordGameResult()` when `playerProfile.gamesPlayed >= 3` (line 21681).
- **`fortune1`** -- Triggered inside the Fortune zone's oracle game flow (line 9075) when any Fortune game is played.

### completeChallenge(challengeId) (line 21599)

```js
const completeChallenge = (challengeId) => {
  if (completedChallenges.includes(challengeId)) return;  // 1. Guard: already done
  const ch = DAILY_CHALLENGES.find(c => c.id === challengeId);
  if (!ch) return;                                         // 2. Guard: invalid ID
  const mult = getCoinMultiplier();
  const earnedCoins = Math.round(ch.reward * mult);        // 3. Multiply coins
  setCoins(c => c + earnedCoins);                          // 4. Award coins
  setXp(x => x + ch.xpReward);                            // 5. Award XP (raw)
  setCompletedChallenges(cc => [...cc, challengeId]);      // 6. Mark complete
  playFx("success");                                       // 7. Sound
  notify("+"+earnedCoins+" coins Challenge complete!", C.green);
  if (completedChallenges.length + 1 >= DAILY_CHALLENGES.length) {  // 8. All done?
    setTimeout(() => {
      const bonusCoins = Math.round(50 * mult);            // 9. +50 bonus (multiplied)
      setCoins(c => c + bonusCoins);
      notify("All challenges done! +"+bonusCoins+" BONUS", C.gold);
      playFx("win");
    }, 800);
  }
};
```

### State Variable

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `completedChallenges` | `useState([])` | `[]` | Array of completed challenge IDs |

### All-Done Bonus

When all 3 challenges are complete, a **50-coin bonus** (multiplied) is awarded after an 800ms delay.

---

## 8. Twelve Badges

### LOYALTY_BADGES Constant (line 81)

```js
const LOYALTY_BADGES = [
  { id:"fp",          icon:"💨",  name:"First Puff",      desc:"Play your first game" },
  { id:"puff100",     icon:"🌬️", name:"Cloud Chaser",    desc:"Play 100 games" },
  { id:"blinker",     icon:"😤",  name:"Blinker Beast",   desc:"Hit 10 blinkers" },
  { id:"streak5",     icon:"🔥",  name:"On Fire",         desc:"5 win streak" },
  { id:"streak10",    icon:"💥",  name:"Unstoppable",     desc:"10 win streak" },
  { id:"showchamp",   icon:"🌟",  name:"Show Champ",      desc:"Win a Stage show" },
  { id:"fortuneking", icon:"👑",  name:"Fortune King",    desc:"Win 5,000 coins in Fortune" },
  { id:"social",      icon:"🦋",  name:"Social Butterfly", desc:"Chat 50 messages" },
  { id:"collector",   icon:"📦",  name:"Collector",       desc:"Buy 5 shop items" },
  { id:"weekwarrior", icon:"🛡️", name:"Week Warrior",    desc:"7-day streak" },
  { id:"legend",      icon:"🏆",  name:"Legend",          desc:"Reach Legend tier" },
  { id:"allgames",    icon:"🎯",  name:"Explorer",        desc:"Try every game" },
];
```

### Full Badge Table

| ID | Icon | Name | Condition | Where Wired | Auto/Manual |
|---|---|---|---|---|---|
| `fp` | 💨 | First Puff | Play first game | `recordGameResult()` line 21694 -- shows popup on first game | Auto (pre-earned) |
| `puff100` | 🌬️ | Cloud Chaser | Play 100 games | `recordGameResult()` line 21692 -- checks `gamesPlayed >= 100` | Auto |
| `blinker` | 😤 | Blinker Beast | Hit 10 blinkers | `recordGameResult()` line 21688 -- checks `blinkerCount >= 10` | Auto |
| `streak5` | 🔥 | On Fire | 5 consecutive wins | `recordGameResult()` line 21705 -- inside win streak updater | Auto |
| `streak10` | 💥 | Unstoppable | 10 consecutive wins | `recordGameResult()` line 21706 -- inside win streak updater | Auto |
| `showchamp` | 🌟 | Show Champ | Win a Stage show | `recordGameResult()` line 21698 (checks `zone === "stage"`) + individual Stage games (line 11468) | Auto |
| `fortuneking` | 👑 | Fortune King | Accumulate 5,000 fortune XP | `updateFortuneXP()` line 8261 -- checks `fortuneXP >= 5000` | Auto |
| `social` | 🦋 | Social Butterfly | Send 50 chat messages | `sendChat()` line 2792 -- checks `chatsSent >= 50` | Auto |
| `collector` | 📦 | Collector | Buy 5 shop items | `buyShopItem()` line 21632 -- checks `ownedItems.length >= 5` | Auto |
| `weekwarrior` | 🛡️ | Week Warrior | Complete a 7-day daily streak | `claimDaily()` line 21591 -- checks `(dailyStreak+1) % 7 === 0` | Auto |
| `legend` | 🏆 | Legend | Reach Legend tier (75K XP) | `awardXP()` line 21651 -- checks during tier-up | Auto |
| `allgames` | 🎯 | Explorer | Play every game in PLAY_GAMES | `recordGameResult()` line 21690 -- checks `gamesPlayed >= PLAY_GAMES.length` | Auto |

### showAchievementPopup(badge) (line 21571)

```js
const showAchievementPopup = (badge) => {
  setAchievementPopup(badge);
  playFx("achievement");
  setTimeout(() => setAchievementPopup(null), 3000);
};
```

Displays a full-screen overlay for 3 seconds with the badge icon (72px), name, and description. Dismissible by tap. Plays the `"achievement"` sound effect.

### State Variables

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `earnedBadges` | `useState(["fp"])` | `["fp"]` | Array of earned badge IDs. "fp" is pre-earned. |
| `achievementPopup` | `useState(null)` | `null` | Currently displayed badge object, or null |

---

## 9. Eight Shop Items

### SHOP_ITEMS Constant (line 70)

```js
const SHOP_ITEMS = [
  { id:"avatar_cat",   icon:"🐱", name:"Cat Avatar",   price:200, cat:"Avatar" },
  { id:"avatar_alien", icon:"👽", name:"Alien Avatar",  price:200, cat:"Avatar" },
  { id:"effect_smoke", icon:"💨", name:"Smoke Trail",   price:300, cat:"Puff Effect" },
  { id:"effect_fire",  icon:"🔥", name:"Fire Trail",    price:500, cat:"Puff Effect" },
  { id:"frame_gold",   icon:"✨", name:"Gold Frame",    price:400, cat:"Frame",    tier:"Gold" },
  { id:"theme_neon",   icon:"🎨", name:"Neon Theme",    price:600, cat:"Theme",    tier:"Diamond" },
  { id:"shield",       icon:"🛡️", name:"Streak Shield", price:100, cat:"Power-up" },
  { id:"extratime",    icon:"⏰", name:"Extra Time x3", price:150, cat:"Power-up" },
];
```

| ID | Icon | Name | Price | Category | Tier Required |
|---|---|---|---|---|---|
| `avatar_cat` | 🐱 | Cat Avatar | 200 | Avatar | -- |
| `avatar_alien` | 👽 | Alien Avatar | 200 | Avatar | -- |
| `effect_smoke` | 💨 | Smoke Trail | 300 | Puff Effect | -- |
| `effect_fire` | 🔥 | Fire Trail | 500 | Puff Effect | -- |
| `frame_gold` | ✨ | Gold Frame | 400 | Frame | Gold |
| `theme_neon` | 🎨 | Neon Theme | 600 | Theme | Diamond |
| `shield` | 🛡️ | Streak Shield | 100 | Power-up | -- |
| `extratime` | ⏰ | Extra Time x3 | 150 | Power-up | -- |

### buyShopItem(item) (line 21620)

```js
const buyShopItem = (item) => {
  if (ownedItems.includes(item.id)) return;        // 1. Already owned
  if (coins < item.price) {                        // 2. Insufficient coins
    notify("Not enough coins!", C.red); return;
  }
  if (item.tier) {                                  // 3. Tier gate check
    const tier = getCurrentTier();
    const tierIdx = LOYALTY_TIERS.findIndex(t => t.name === item.tier);
    if (tier.idx < tierIdx) {
      notify("Requires "+item.tier+" tier!", C.orange); return;
    }
  }
  setCoins(c => c - item.price);                   // 4. Deduct coins
  setOwnedItems(o => [...o, item.id]);             // 5. Add to owned
  playFx("success");                               // 6. Sound
  notify("Purchased "+item.name+"!", C.green);     // 7. Notification
  // 8. Check Collector badge (5 items)
  if (ownedItems.length + 1 >= 5 && !earnedBadges.includes("collector")) {
    setEarnedBadges(b => [...b, "collector"]);
    showAchievementPopup(LOYALTY_BADGES.find(b => b.id === "collector"));
  }
};
```

### Functional Effects of Purchased Items

- **Avatars** (`avatar_cat`, `avatar_alien`) -- Change the profile card avatar display. The Me tab checks `ownedItems.includes("avatar_cat")` to render the cat emoji instead of the default star (line 21901).
- **Other items** -- Currently cosmetic/placeholder. No game mechanic effects are wired for shields, extra time, effects, frames, or themes.

### State Variable

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `ownedItems` | `useState([])` | `[]` | Array of purchased item IDs |

---

## 10. Me Tab UI

### Navigation

The Me tab is reached via `tab === "me"` in the bottom nav. It renders by calling `renderMe()` (line 21860).

### 5 Sub-Tabs (loyaltyTab)

| Sub-Tab ID | Label | Color | Content |
|---|---|---|---|
| `overview` | Overview | `C.pink` | Tier progress, quick stats, quick actions |
| `daily` | Daily | `C.green` | 7-day check-in grid, claim button, multiplier notice |
| `challenges` | Challenges | `C.orange` | 3 daily challenges, completion buttons, all-done bonus |
| `badges` | Badges | `C.purple` | 12 badge grid (3 columns), earned count |
| `shop` | Shop | `C.gold` | 8 items in 2-column grid, coin balance, buy buttons |

### renderMe() Structure (line 21860)

```
renderMe()
├── Ambient background gradient (tier-colored)
├── Me Header (title + tier icon + total multiplier badge)
├── Profile Card
│   ├── Avatar (with tier ring + badge corner icon)
│   ├── Name + streak + badge count
│   ├── XP progress bar (tier-colored gradient)
│   ├── Featured badges row (first 4 earned)
│   └── Multiplier badges (tier mult + device bonus + total)
├── Stats Row (4 items: Coins, Games, Win%, Streak)
├── Tab Pills (Overview, Daily, Challenges, Badges, Shop)
└── Tab Content
    ├── overview: Tier Progress card, Quick Stats grid, Quick Actions 2x2
    ├── daily: Check-in 7-day grid, Claim button, multiplier notice
    ├── challenges: 3 challenge rows with buttons, all-done banner
    ├── badges: 3-column badge grid with earned/locked states
    └── shop: 2-column item grid with buy/owned/locked states
```

### Profile Card Details

- **Avatar** -- Shows purchased avatar emoji or default star. Has a glowing ring in the tier's color. Tier icon badge in bottom-right corner.
- **XP Progress Bar** -- Width calculated as `((xp - tier.xpReq) / (nextTier.xpReq - tier.xpReq)) * 100`. Animated gradient background.
- **Multiplier Badges** -- Up to 3 pills:
  1. Tier multiplier (always shown): e.g., "🥇 1.5x Gold Multiplier"
  2. Device bonus (only when BLE connected): "💨 1.5x Device Bonus Active"
  3. Total multiplier (when > 1.0x): "= 2.25x Total"

### State Variables

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `loyaltyTab` | `useState("overview")` | `"overview"` | Active sub-tab within Me |

---

## 11. Arena Integration

### recordGameResult(won, baseCoins, baseXP) (line 21663)

This is the central function called when any game ends. It handles coin/XP awards, challenge tracking, badge checks, and win streak management.

**Step-by-step:**

```js
const recordGameResult = (won, baseCoins, baseXP) => {
  // 1. NaN guards
  const safeCoins = Math.max(0, Math.round(Number(baseCoins) || 0));
  const safeXP = Math.max(0, Number(baseXP) || 0);

  // 2. Apply multiplier to coins
  const mult = getCoinMultiplier();
  const totalCoins = Math.round(safeCoins * mult);

  // 3. XP bonus: +15 for win, +5 for loss (added to base)
  const totalXP = safeXP + (won ? 15 : 5);

  // 4. Award coins
  setCoins(c => c + totalCoins);

  // 5. Award XP (with tier-up detection)
  awardXP(totalXP, won ? "game_win" : "game_played");

  // 6. Update profile stats (gamesPlayed, gamesWon, etc.)
  updateProfileAfterGame(won);

  // 7. Show floating reward popup
  showFloatingReward(totalCoins, totalXP);

  // 8. Auto-complete daily challenges
  //    - win1: if won && not yet completed
  //    - play3: if gamesPlayed >= 3 && not yet completed

  // 9. Check badge conditions:
  //    - blinker: playerProfile.blinkerCount >= 10
  //    - allgames: playerProfile.gamesPlayed >= PLAY_GAMES.length
  //    - puff100: playerProfile.gamesPlayed >= 100
  //    - fp: show welcome popup on first game
  //    - showchamp: if won && zone === "stage"

  // 10. Win streak management
  if (won) {
    // Increment streak, check milestones:
    //   3 wins: notification
    //   5 wins: +50 bonus coins + streak_fire sound
    //   10 wins: +200 bonus coins + crowd sound + confetti
    //   Streak5/Streak10 badges
  } else {
    // Notify if streak ended at 3+, reset to 0
  }
};
```

### awardXP(amount, reason) (line 21640)

```js
const awardXP = (amount, reason) => {
  const safeAmount = Math.max(0, Number(amount) || 0);  // NaN guard
  setXp(x => x + safeAmount);
  const newXp = xp + safeAmount;
  const currentIdx = getCurrentTier().idx;
  // Check if any higher tier is now reached
  for (let i = currentIdx + 1; i < LOYALTY_TIERS.length; i++) {
    if (newXp >= LOYALTY_TIERS[i].xpReq) {
      // Tier up!
      playFx("level_up");
      notify("TIER UP! " + tier.icon + " " + tier.name + " -- " + tier.mult + "x multiplier!");
      spawnConfetti(50, [tier.color, C.gold, "#fff"]);
      // Legend badge if reaching Legend tier
      break;
    }
  }
};
```

### updateProfileAfterGame(won) (line 21727)

```js
const updateProfileAfterGame = (won) => {
  setPlayerProfile(p => ({
    ...p,
    gamesPlayed: p.gamesPlayed + 1,
    gamesWon: won ? p.gamesWon + 1 : p.gamesWon,
    totalPuffs: p.totalPuffs + 1,
    rankProgress: Math.min(100, p.rankProgress + (won ? 8 : 3)),
  }));
};
```

### Typical Call Sites

Games call `recordGameResult()` at the end of their result phase:

```js
// Wild West Duel -- win
recordGameResult(true, duelBase, 30);

// Balloon Pop -- end
const won = bpLoser && !bpLoser.isYou;
const baseR = won ? 80 + Math.floor(Math.random() * 40) : 10;
recordGameResult(won, baseR, won ? 20 : 5);

// Final Kick -- end
recordGameResult(kickWon, baseReward, kickWon ? 25 : kickDraw ? 10 : 5);

// Fortune games (Blackjack, Craps, etc.)
recordGameResult(true, winAmt, 15);
```

---

## 12. In-Game Visual Feedback

### Multiplier Badge (line 22199)

A fixed-position badge in the top-right corner during active gameplay (`gameActive` is truthy):

```
[🥇 1.5x]     <-- Tier multiplier
[💨 1.5x]     <-- Device bonus (only when BLE connected)
```

Rendered at `position:"fixed", top:12, right:12, zIndex:200`.

### Floating Reward Popup (line 22223)

After `recordGameResult()`, a centered popup floats up and fades:

```
+150 🪙
+35 XP
```

State: `floatingReward` with `{ coins, xp, key }`. Auto-clears after 2000ms.

### Coin Pulse (line 22258)

The header coin counter scales up briefly (`transform: scale(1.15)`) when `coinPulse` is true. This creates a visual "pulse" when coins change.

### XP Micro-Bar (line 22270)

A 2px-tall progress bar below the header, always visible. Shows XP progress toward the next tier using a gradient from the current tier color to purple.

```js
width: ((xp - currentTier.xpReq) / (nextTier.xpReq - currentTier.xpReq)) * 100 + "%"
```

### Win Streak Header Badge (line 22261)

When `currentWinStreak >= 2`, a fire badge appears in the header:

```
[🔥 5]
```

Color shifts from orange (< 5) to gold (>= 5).

### Reward Breakdown Panels

Shown in game result screens for approximately 10 games. Standard structure:

```
REWARD BREAKDOWN
Base                    +80 🪙
🥇 Gold                 x1.5
💨 Device Bonus         x1.5     (only when bleConnected)
────────────────────────────────
TOTAL                   +180 🪙
```

Games with reward breakdowns include: Wild West Duel, Final Kick (all variants), Balloon Pop, Russian Roulette, Puff Pong, Hot Potato, Tug of War, Hooked, Vibe Check, and more.

### "My Progress" Buttons

Approximately 11 games include a "My Progress" button in their result screen that navigates directly to the Me tab:

```js
onClick={() => {
  resetGame();
  setGameActive(null);
  setTab("me");
  setZone(null);
  setSelectedGame(null);
}}
```

Style: Purple-tinted pill button with "👤 My Progress" text.

### Achievement Unlock Popup (line 22236)

Full-screen overlay with:

```
ACHIEVEMENT UNLOCKED
[72px badge icon with gold drop shadow]
Badge Name
Badge Description
Tap to continue
```

Background: 85% opaque with blur. Auto-dismisses after 3000ms or on tap.

---

## 13. Sound Effects

All loyalty-related sounds are synthesized via Web Audio API in the `playFx()` function (line 3208).

| Sound ID | When Played | Description |
|---|---|---|
| `coin_collect` | `claimDaily()`, coin awards, Fortune prizes | Three ascending sine tones (1200/1600/2000 Hz) -- bright "cha-ching" |
| `success` | `completeChallenge()`, `buyShopItem()` | Two ascending sine tones (523/784 Hz) -- quick positive chime |
| `level_up` | `awardXP()` tier-up detection | Four ascending sine tones (C5-E5-G5-C6) -- triumphant fanfare |
| `crowd` | 7-day streak in `claimDaily()`, 10 win streak | Noise burst + rising sawtooth -- crowd cheer |
| `achievement` | `showAchievementPopup()` | Four ascending sine tones (C5-E5-G5-C6) -- similar to level_up but different envelope |
| `streak_fire` | 5 win streak in `recordGameResult()`, game-specific 5-streaks | Three rapid ascending sawtooth tones (400/600/900 Hz) -- fire crackle |
| `win` | All-done challenge bonus | Loaded from `assets/arena/win.m4a` -- audio file |

---

## 14. Safety Guards

### getCoinMultiplier() NaN Guard (line 21568)

```js
return isNaN(mult) ? 1.0 : mult;
```

If `tier.mult` is undefined or the calculation produces NaN, falls back to 1.0x.

### awardXP() NaN Guard (line 21641)

```js
const safeAmount = Math.max(0, Number(amount) || 0);
```

Converts non-numeric input to 0. Prevents negative XP.

### recordGameResult() NaN Guards (line 21664-21665)

```js
const safeCoins = Math.max(0, Math.round(Number(baseCoins) || 0));
const safeXP = Math.max(0, Number(baseXP) || 0);
```

Both coin and XP inputs are sanitized to non-negative numbers. The `Number() || 0` pattern catches `undefined`, `null`, `NaN`, and non-numeric strings.

---

## 15. State Variables

### Complete List of Loyalty-Specific State

| Variable | Hook | Default | Line | Purpose |
|---|---|---|---|---|
| `coins` | `useState(12580)` | 12580 | 1026 | Spendable currency |
| `xp` | `useState(7450)` | 7450 | 1027 | Permanent progression points |
| `loyaltyTab` | `useState("overview")` | `"overview"` | 1030 | Active Me sub-tab |
| `dailyStreak` | `useState(0)` | 0 | 1031 | Consecutive daily check-in count |
| `dailyCheckedIn` | `useState(false)` | false | 1032 | Today's check-in claimed? |
| `ownedItems` | `useState([])` | `[]` | 1033 | Array of purchased shop item IDs |
| `earnedBadges` | `useState(["fp"])` | `["fp"]` | 1034 | Array of earned badge IDs |
| `completedChallenges` | `useState([])` | `[]` | 1035 | Array of completed challenge IDs |
| `currentWinStreak` | `useState(0)` | 0 | 1036 | Current consecutive wins |
| `bestWinStreak` | `useState(0)` | 0 | 1037 | All-time best win streak |
| `floatingReward` | `useState(null)` | null | 1038 | Active floating reward popup data |
| `coinPulse` | `useState(false)` | false | 1039 | Coin counter pulse animation flag |
| `achievementPopup` | `useState(null)` | null | 1040 | Active achievement popup badge object |
| `chatsSent` | `useState(0)` | 0 | 1041 | Chat messages sent (for Social Butterfly badge) |

### Related useRef

| Variable | Line | Purpose |
|---|---|---|
| `prevBleConnected` | 1042 | Tracks previous BLE connection state |

### Related Profile State (playerProfile object)

| Field | Default | Updated By |
|---|---|---|
| `gamesPlayed` | 47 | `updateProfileAfterGame()` |
| `gamesWon` | 28 | `updateProfileAfterGame()` |
| `totalPuffs` | 420 | `updateProfileAfterGame()` |
| `blinkerCount` | 69 | Game-specific puff handlers |
| `streak` | 5 | Profile display |
| `rankProgress` | 35 | `updateProfileAfterGame()` |

---

## 16. Constants Reference

### LOYALTY_TIERS

```js
const LOYALTY_TIERS = [
  { name:"Bronze",  icon:"🥉", color:"#CD7F32", xpReq:0,     mult:1.0 },
  { name:"Silver",  icon:"🥈", color:"#C0C0C0", xpReq:2000,  mult:1.2 },
  { name:"Gold",    icon:"🥇", color:"#FFD700", xpReq:8000,  mult:1.5 },
  { name:"Diamond", icon:"💎", color:"#00E5FF", xpReq:25000, mult:2.0 },
  { name:"Legend",  icon:"🔥", color:"#FF4D8D", xpReq:75000, mult:3.0 },
];
```

### DAILY_REWARDS

```js
const DAILY_REWARDS = [
  { day:1, coins:10,  xp:15 },
  { day:2, coins:15,  xp:20 },
  { day:3, coins:20,  xp:25 },
  { day:4, coins:30,  xp:30, bonus:"🎁" },
  { day:5, coins:40,  xp:40 },
  { day:6, coins:50,  xp:50 },
  { day:7, coins:100, xp:100, bonus:"🏆 Chest!" },
];
```

### DAILY_CHALLENGES

```js
const DAILY_CHALLENGES = [
  { id:"play3",    task:"Play 3 games today", reward:25, xpReward:20, icon:"🎮" },
  { id:"win1",     task:"Win 1 game",         reward:30, xpReward:25, icon:"🏆" },
  { id:"fortune1", task:"Try 1 Fortune game",  reward:20, xpReward:15, icon:"🔮" },
];
```

### SHOP_ITEMS

```js
const SHOP_ITEMS = [
  { id:"avatar_cat",   icon:"🐱", name:"Cat Avatar",    price:200, cat:"Avatar" },
  { id:"avatar_alien", icon:"👽", name:"Alien Avatar",   price:200, cat:"Avatar" },
  { id:"effect_smoke", icon:"💨", name:"Smoke Trail",    price:300, cat:"Puff Effect" },
  { id:"effect_fire",  icon:"🔥", name:"Fire Trail",     price:500, cat:"Puff Effect" },
  { id:"frame_gold",   icon:"✨", name:"Gold Frame",     price:400, cat:"Frame",    tier:"Gold" },
  { id:"theme_neon",   icon:"🎨", name:"Neon Theme",     price:600, cat:"Theme",    tier:"Diamond" },
  { id:"shield",       icon:"🛡️", name:"Streak Shield",  price:100, cat:"Power-up" },
  { id:"extratime",    icon:"⏰", name:"Extra Time x3",  price:150, cat:"Power-up" },
];
```

### LOYALTY_BADGES

```js
const LOYALTY_BADGES = [
  { id:"fp",          icon:"💨",  name:"First Puff",       desc:"Play your first game" },
  { id:"puff100",     icon:"🌬️", name:"Cloud Chaser",     desc:"Play 100 games" },
  { id:"blinker",     icon:"😤",  name:"Blinker Beast",    desc:"Hit 10 blinkers" },
  { id:"streak5",     icon:"🔥",  name:"On Fire",          desc:"5 win streak" },
  { id:"streak10",    icon:"💥",  name:"Unstoppable",      desc:"10 win streak" },
  { id:"showchamp",   icon:"🌟",  name:"Show Champ",       desc:"Win a Stage show" },
  { id:"fortuneking", icon:"👑",  name:"Fortune King",     desc:"Win 5,000 coins in Fortune" },
  { id:"social",      icon:"🦋",  name:"Social Butterfly", desc:"Chat 50 messages" },
  { id:"collector",   icon:"📦",  name:"Collector",        desc:"Buy 5 shop items" },
  { id:"weekwarrior", icon:"🛡️", name:"Week Warrior",     desc:"7-day streak" },
  { id:"legend",      icon:"🏆",  name:"Legend",           desc:"Reach Legend tier" },
  { id:"allgames",    icon:"🎯",  name:"Explorer",         desc:"Try every game" },
];
```

---

## Quick Reference: Adding to the Loyalty System

### Add a New Tier

1. Add an entry to `LOYALTY_TIERS` with `name`, `icon`, `color`, `xpReq`, `mult`.
2. That is it -- `getCurrentTier()`, `getNextTier()`, `getCoinMultiplier()`, and all UI automatically pick it up.

### Add a New Badge

1. Add entry to `LOYALTY_BADGES` with `id`, `icon`, `name`, `desc`.
2. Wire the condition check anywhere appropriate (typically inside `recordGameResult()` or a game-specific function):
   ```js
   if (!earnedBadges.includes("mybadge") && someCondition) {
     setEarnedBadges(b => [...b, "mybadge"]);
     const badge = LOYALTY_BADGES.find(b => b.id === "mybadge");
     if (badge) setTimeout(() => showAchievementPopup(badge), 800);
   }
   ```

### Add a New Shop Item

1. Add entry to `SHOP_ITEMS` with `id`, `icon`, `name`, `price`, `cat`, and optional `tier`.
2. The Shop tab grid renders it automatically.
3. If the item should have a functional effect, add a check for `ownedItems.includes("myitem")` in the relevant game or UI code.

### Add a New Daily Challenge

1. Add entry to `DAILY_CHALLENGES` with `id`, `task`, `reward`, `xpReward`, `icon`.
2. Wire auto-completion by calling `completeChallenge("myid")` at the appropriate trigger point.
3. Update the all-done bonus threshold if needed (currently hardcoded to `DAILY_CHALLENGES.length`).

### Add a Reward Breakdown Panel to a Game

Use this pattern in the game's result screen:

```jsx
<div style={{padding:10,borderRadius:12,background:"rgba(255,255,255,0.03)",
  border:"1px solid rgba(255,255,255,0.06)"}}>
  <div style={{fontSize:9,color:C.text3,letterSpacing:1,marginBottom:6}}>
    REWARD BREAKDOWN
  </div>
  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.text2,marginBottom:3}}>
    <span>Base</span>
    <span style={{color:C.gold}}>+{baseCoins} coins</span>
  </div>
  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.text2,marginBottom:3}}>
    <span>{getCurrentTier().icon} {getCurrentTier().name}</span>
    <span style={{color:getCurrentTier().color}}>x{getCurrentTier().mult}</span>
  </div>
  {bleConnected && (
    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.text2,marginBottom:3}}>
      <span>Device Bonus</span>
      <span style={{color:C.cyan}}>x1.5</span>
    </div>
  )}
  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:6,marginTop:3,
    display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:800}}>
    <span style={{color:C.text}}>TOTAL</span>
    <span style={{color:C.gold}}>+{Math.round(baseCoins * getCoinMultiplier())} coins</span>
  </div>
</div>
```
