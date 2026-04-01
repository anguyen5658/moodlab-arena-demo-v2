# Mood Lab Arena — Multiplayer Development Plan
## 34 Games × Unique Multiplayer Modes

### Status: MP Data Added ✅ | Gameplay Implementation: Pending

---

## Current State (What's Done)

### ✅ Infrastructure Built
- 50 Bot Personalities (BOT_POOL) with names, emojis, catchphrases, play styles
- Comedy Engine (CROWD_ROASTS, STONER_COMMENTARY, GAME_HUMOR, AUDIENCE_REACTIONS)
- Visual Overlays (Shame Cam, Hype Cam, Emoji Rain)
- Comedy auto-triggers on every recordGameResult (win → VictoryParade, lose → ShameCam)
- Enhanced matchmaking lobby with bot personality display
- Chat panels in all games
- MP mode badges on all game cards + detail screens

### ✅ MP Mode Data on 34/37 Games
Every game card shows its unique multiplayer mode name, player count, and badge. Users can SEE the multiplayer vision. But the actual gameplay is still 1v1 vs basic AI.

### ❌ What's NOT Done Yet
The actual multiplayer GAMEPLAY logic — converting each game from "solo vs basic AI" to "unique multiplayer experience with bots that have personalities, chat, and social mechanics."

---

## Development Priority Tiers

### 🔴 TIER 1 — Highest Impact, Natural Fit (Build First)
These games are BORN multiplayer. The upgrade is relatively straightforward because the core mechanics already support multiple players.

| # | Game | MP Mode | What to Build | Est. Lines |
|---|------|---------|--------------|-----------|
| 1 | **Puff Blackjack** | High Rollers Table (6) | Add 5 bot players at same table. Show all hands. Insurance mechanic. Dealer personality from GAME_HUMOR. | ~80 |
| 2 | **Craps & Clouds** | Casino Floor (8) | Shooter rotation. 7 bot bettors. Communal energy. Pass/Don't Pass visualization. | ~100 |
| 3 | **Russian Roulette** | The Gauntlet (1000→1) | Mass elimination ticker. Groups of 6 → regroup → final 6. Graveyard chat. Dramatic countdown. | ~120 |
| 4 | **Strain Battle** | Strain World Cup (50+) | 64-strain bracket. Community voting per matchup. Fan sections. Upset alerts. Sports commentary. | ~100 |
| 5 | **Tug of War** | 50v50 War (100) | 50-bot armies per side. Traitor mechanic. War Cry synchronized puff surge. Army strength graph. | ~80 |
| 6 | **Hot Potato** | Pass the Nuke (16) | 16-player circle. Bomb mood swings. Bomb splitting. Skip/YEET puff mechanics. Death cam replay. | ~90 |

**Total Tier 1: ~570 lines, 6 games**

### 🟡 TIER 2 — Strong Fit, Medium Complexity
These require more significant gameplay changes but the multiplayer concept is strong.

| # | Game | MP Mode | What to Build | Est. Lines |
|---|------|---------|--------------|-----------|
| 7 | **Crystal Ball** | Prophecy Circle (8) | 8-player simultaneous prediction. Majority-wins mechanic. Contrarian bonus (3x for correct minority). Dramatic reveal circle. | ~70 |
| 8 | **Treasure Map** | Treasure Race (4) | Shared 16-tile map. 4 explorers. Your bombs only hurt YOU. Compass puff costs a life. Race to 3 treasures. | ~60 |
| 9 | **Mystery Box** | Heist Crew (4 co-op) | 12 boxes in vault. Alarm traps. One alarm = everyone fails. Heat signature hints. Coordination. | ~80 |
| 10 | **Puff Slots** | Slot Tournament (16) | Timed speed competition. Live leaderboard. Jackpot interruptions. Top 4 → MEGA SPIN finale. | ~90 |
| 11 | **Wild West** | High Noon Town (8) | 8-player bracket. Location changes per round. Environmental distractions (tumbleweeds, trains). Wanted poster board. | ~80 |
| 12 | **Balloon Pop** | Relay Race (2×4) | Team relay. Target inflation (75%). Can't see teammate's puff amount. Trust-based mechanic. | ~70 |
| 13 | **Final Kick** | 100 Keepers (1v100) | 10×10 grid of mini-goalkeepers. Find the sleeping one. Keeper personalities + chat. | ~100 |
| 14 | **Puff Limbo** | The Eliminator (50) | 50-player endurance. Dizzy meter (screen rotates). Eliminated become heckling ghosts. | ~70 |
| 15 | **Hooked** | Fishing Tournament (8) | 8 anglers, shared lake, limited fish. Contested catches. Legendary fish finale. | ~80 |

**Total Tier 2: ~700 lines, 9 games**

### 🟢 TIER 3 — Creative Fit, Higher Complexity
These require the most creative engineering but will be the most impressive when done.

| # | Game | MP Mode | What to Build | Est. Lines |
|---|------|---------|--------------|-----------|
| 16 | **Fish War** | Ocean Royale (50 BR) | Shrinking zone. 50-bot fish. Kill feed. Evolution triggers. Sushi death animation. | ~100 |
| 17 | **Tank War** | Clan Wars (4v4) | Team ammo/shield pool. Friendly fire. Commander role. War Crime counter. | ~100 |
| 18 | **Final Kick 2** | Pressure Cooker (8) | Round-robin. Escalating crowd pressure. Screen shake increases. Confidence voting. | ~80 |
| 19 | **Final Kick 3D** | World Stage (32) | Full bracket with nation flags. Weather effects per round. VAR Review system. | ~120 |
| 20 | **Puff Pong** | Doubles Chaos (2v2) | Rubber band between paddles. Simultaneous puff = MEGA paddle. Sync score. | ~90 |
| 21 | **Rhythm Puff** | Band Battle (4-piece) | Multi-instrument tracks. Combined performance rating. Wrong note = comedy squeak. | ~100 |
| 22 | **Puff RPS** | Thunderdome (16) | 16-player bracket. Modifier cards per round (REVERSE, DOUBLE DOWN, MIND READER). | ~60 |
| 23 | **Beat Drop** | DJ Battle (4) | Simultaneous drops. Your release affects shared timeline. Crowd votes best drop. | ~70 |
| 24 | **Puff Clock** | World Sync (500+) | Mass simultaneous puff. Bell curve distribution. Perfect Sync bonus. Outlier call-outs. | ~60 |
| 25 | **Puff Derby** | Grand National (12) | Dual jockeys per horse. Speed + steering. Out-of-sync = stumble. Obstacles + shortcuts. | ~80 |
| 26 | **Match Predictor** | Pundit Panel (6) | Hot take generator. Dunce Chair. Pundit accuracy leaderboard. | ~60 |
| 27 | **Fortune Cookie** | Fortune Circle (8) | Simultaneous crack + trade before reveal. Golden fortune 10x. Negotiation. | ~70 |
| 28 | **Spin & Win** | Wheel of Misfortune (6) | Shared wheel + punishments. Section betting. Bankrupt/Steal mechanics. | ~70 |

**Total Tier 3: ~1,060 lines, 13 games**

### Stage Games — Already Multiplayer (Enhancement Only)

| # | Game | Enhancement | Est. Lines |
|---|------|-------------|-----------|
| 29 | **Vibe Check** | Crowd sabotage voting, Trust Meter, troll bots | ~50 |
| 30 | **Higher or Lower** | 10-player relay chain, Chain breaker shame | ~40 |
| 31 | **Price is Puff** | 6 simultaneous guesses, dramatic reveal, price adjustment | ~50 |
| 32 | **Survival Trivia** | Lifeline Puffs (50/50, phone-a-friend), lightning round | ~60 |
| 33 | **Simon Puffs** | 4-player co-op, split pattern, limited communication | ~70 |
| 34 | **Puff Auction** | 16 bidders, absurd items, lung depletion across rounds | ~50 |

**Total Stage: ~320 lines, 6 games**

### ⬜ Intentionally Solo (No MP)

| Game | Reason |
|------|--------|
| Daily Picks | Personal daily ritual. Streak = retention mechanic. |
| Coin Flip | Pure 50/50 luck. No meaningful social interaction possible. |
| Scratch & Puff | Solo tactile experience. Personal reveal is the point. |

---

## Implementation Strategy

### Approach: "Progressively Social"
Instead of building each game's full multiplayer mode from scratch, use a **layered approach**:

**Layer 1: Bot Lobby + Chat (Already Done ✅)**
All games now have chat panels, bot personalities in matchmaking, and comedy triggers on win/lose. Even without gameplay changes, games feel MORE social.

**Layer 2: Bot Spectators During Gameplay (~2 lines per game)**
Add periodic bot chat messages DURING gameplay (not just at the end). A bot says "nice shot!" or "BRO WHAT" during key moments. This makes every game feel like people are watching.

**Layer 3: Per-Game Multiplayer Mechanics (The big build)**
Implement the unique rules for each game as described in the tier tables above.

### Recommended Build Order

**Week 1: Quick Wins (Layer 2 for all + Tier 1 gameplay)**
1. Add in-game bot commentary to all 34 games (2-3 lines each, ~70 lines total)
2. Build Blackjack High Rollers Table (natural multiplayer, highest impact)
3. Build Craps Casino Floor (natural multiplayer)
4. Build Russian Roulette Gauntlet (1000→1 is the WOW factor)

**Week 2: Social Games (Tier 1 continued + Tier 2 start)**
5. Build Strain Battle World Cup (voting is inherently social)
6. Build Tug of War 50v50 (team games are visceral)
7. Build Hot Potato Pass the Nuke (party game energy)
8. Build Crystal Ball Prophecy Circle (quick build, high fun)
9. Build Treasure Map Treasure Race (shared map mechanic)

**Week 3: Competitive Games (Tier 2 continued)**
10. Build Wild West High Noon Town (bracket + environment)
11. Build Balloon Pop Relay Race (team trust mechanic)
12. Build Final Kick 100 Keepers (the signature mode)
13. Build Puff Slots Tournament (speed competition)
14. Build Mystery Box Heist Crew (co-op tension)
15. Build Puff Limbo Eliminator (endurance + ghosts)

**Week 4: Complex Games (Tier 3)**
16. Build Fish War Ocean Royale (shrinking zone BR)
17. Build Tank War Clan Wars (team resource management)
18. Build Rhythm Puff Band Battle (multi-instrument)
19. Build Puff Pong Doubles Chaos (rubber band physics)
20. Build remaining Tier 3 + Stage enhancements

### Technical Pattern for Each Game

Every multiplayer upgrade follows the same code pattern:

```javascript
// 1. Add MP state hooks (3-5 per game)
const [gameMP_bots, setGameMP_bots] = useState([]);
const [gameMP_leaderboard, setGameMP_leaderboard] = useState([]);

// 2. Modify start function to initialize bots
const startGame_MP = () => {
  const bots = BOT_POOL.slice(0, playerCount).map(b => ({...b, score: 0, alive: true}));
  setGameMP_bots(bots);
  // ... existing start logic
};

// 3. Add bot AI decision logic (runs on intervals)
const gameMP_botTurn = (bot) => {
  // Bot makes a decision based on personality
  if(bot.style === "reckless") { /* aggressive play */ }
  if(bot.style === "chill") { /* conservative play */ }
  // Inject bot chat message
  setSideChat(p => ({...p, ai: [...p.ai, {u: bot.name, m: pickArr(botMessages), c: bot.color, t: Date.now()}]}));
};

// 4. Add bot visualization in render (leaderboard, avatars, etc.)
{gameMP_bots.map(bot => (
  <div key={bot.name}>{bot.emoji} {bot.name}: {bot.score}</div>
))}

// 5. Wire to comedy engine at key moments
if(spectacularFail) triggerCrowdRoast("general_fail");
if(clutchPlay) triggerHype();
```

---

## Total Scope Estimate

| Category | Games | Lines | Priority |
|----------|-------|-------|----------|
| Tier 1 — Natural MP | 6 | ~570 | HIGH — Build first |
| Tier 2 — Strong MP | 9 | ~700 | MEDIUM — Build second |
| Tier 3 — Creative MP | 13 | ~1,060 | LOWER — Build third |
| Stage Enhancements | 6 | ~320 | Can parallelize |
| **TOTAL** | **34** | **~2,650** | |

### Current File: 24,420 lines
### After Full MP: ~27,070 lines (estimated)

---

## Quality Gates

Before each deployment:
1. ✅ Zero Babel compilation errors
2. ✅ Zero runtime ReferenceErrors (check TDZ on new refs)
3. ✅ All games launch without black screen (test each one)
4. ✅ Back button cleanly exits all games
5. ✅ Comedy triggers fire on win/lose
6. ✅ Chat panel visible during gameplay
7. ✅ No stale state causing freezes (use refs for puff guards)
