# Mood Lab Arena -- Game Review Report (New Core Logic Audit)

**Date:** 2026-03-30
**Scope:** All 35 games reviewed against the new core rules
**Status:** Research only -- no code changes made

---

## New Core Rules Summary

1. **Puff = Power Move** -- each game should use 2-5 puffs per session, not every action
2. **Game wins = flat coins** -- no tier multiplier on game wins
3. **Reward tiers** -- S/A/B/C/D/E based on skill + difficulty + duration
4. **Flat XP** -- 20 win / 8 loss for all games
5. **MIC only** -- no button/dry_puff
6. **Adaptive difficulty** -- games should have hooks for invisible difficulty adjustment

---

## ARCADE ZONE (16 games)

---

### [1] Final Kick (finalkick) -- Arcade
- **Current puffs:** 5 per session (1 puff per shoot round across 5 rounds)
- **Recommended puffs:** 5 (keep -- 1 puff per kick, perfect match)
- **Tap actions:** Zone selection (tap one of 6 grid zones), dive direction during save phase
- **Puff moments:** Power charge during kick (hold-to-puff determines shot quality via sweet spot)
- **Current reward:** Win 80, Draw 30, Loss 10 coins base; XP 25/10/5
- **Recommended tier:** A -- 80 coins base (high skill, sweet spot precision, good duration)
- **Duration:** 2-3m
- **Issues:** (1) XP is 25 win / 5 loss, not flat 20/8. (2) Uses `getCoinMultiplier()` tier multiplier on rewards. (3) `autoFail=true` for non-perfect puffs means tap/short/good/long zones all fail -- very punishing. (4) No adaptive difficulty hook; AI save chance is static per device pool.
- **Improvements:** Add adaptive AI save chance based on player win rate. Remove tier coin multiplier. Flatten XP to 20/8. Consider making "good" zone still score (not just "perfect").

---

### [2] Final Kick 2 (finalkick2) -- Arcade
- **Current puffs:** 10 per session (2 puffs per round x 5 rounds -- one for X aim, one for Y aim)
- **Recommended puffs:** 5 (reduce to 1 puff per round: make X-aim a tap/swipe, keep Y-aim as puff)
- **Tap actions:** None currently -- both axes use hold-to-puff
- **Puff moments:** X-axis position (puff 1), Y-axis position (puff 2) per round
- **Current reward:** Same as FK1 (80 win, shared code path)
- **Recommended tier:** S -- 100 coins base (double precision requirement, highest skill ceiling in arcade)
- **Duration:** 3-4m
- **Issues:** (1) 10 puffs per session is too many -- exceeds the 2-5 target. (2) Shares reward code with FK1 so same multiplier/XP problems. (3) Both axes mapped as puff makes it exhausting.
- **Improvements:** Make X-axis a tap-to-lock (swipe left/right), keep only Y-axis as the puff moment. This halves puff count to 5. Add adaptive keeper intelligence.

---

### [3] Final Kick 3D (finalkick3) -- Arcade
- **Current puffs:** 10 per session (same as FK2 -- double puff per round)
- **Recommended puffs:** 5 (same fix as FK2)
- **Tap actions:** None currently
- **Puff moments:** Same as FK2 but in 3D view
- **Current reward:** Same as FK1/FK2
- **Recommended tier:** S -- 100 coins base (3D + double precision)
- **Duration:** 3-4m
- **Issues:** Same as FK2 plus Three.js canvas mount/unmount can be janky. 10 puffs too many.
- **Improvements:** Same as FK2. X-axis becomes tap, Y-axis stays puff. The 3D view alone justifies S-tier.

---

### [4] Wild West Duel (wildwest) -- Arcade
- **Current puffs:** 3-5 per session (1 puff per round, best of 5 rounds)
- **Recommended puffs:** 3-5 (keep -- naturally fits the 2-5 range)
- **Tap actions:** None -- reaction time is the primary mechanic
- **Puff moments:** After DRAW signal, hold-to-puff determines shot power tier (basic/quick/power/legendary)
- **Current reward:** Win 150 + accumulated bonus coins, Loss 0; XP 30/5
- **Recommended tier:** A -- 80 coins base (reaction skill + puff bonus is satisfying but session is short)
- **Duration:** 1-2m
- **Issues:** (1) Reward is variable (150 + bonus up to 50 per round = potentially 400+ coins). Should be flat. (2) XP is 30/5, not 20/8. (3) Bonus coins awarded per-round during match, not just at end. (4) Uses `getCoinMultiplier()`. (5) No adaptive difficulty -- AI draw speed uses `getAiDrawSpeed(round)` but it is not player-skill-adaptive.
- **Improvements:** Remove per-round bonus coin awards. Make base reward flat 80. Flatten XP. Add adaptive AI draw speed based on player reaction times.

---

### [5] Balloon Pop (balloon) -- Arcade
- **Current puffs:** 3-8 per session (variable -- 1 puff per turn, number of turns varies with player count)
- **Recommended puffs:** 2-5 (cap at 5 turns for the player by adjusting player count or turn order)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff to inflate balloon (duration = amount of air added). Strategy: puff just enough to not pop it.
- **Current reward:** Win 80-120 (80 + random 0-40), Loss 10; XP 20/5
- **Recommended tier:** B -- 60 coins base (luck-heavy, moderate skill)
- **Duration:** 1-3m
- **Issues:** (1) Reward has random variance (80+random*40) -- should be flat. (2) XP 20/5, not 20/8. (3) Pop threshold is random 80-120, no adaptive difficulty. (4) Uses `getCoinMultiplier()`.
- **Improvements:** Flat 60 coins. Flatten XP to 20/8. Add adaptive threshold based on player skill level. Remove coin multiplier.

---

### [6] Puff Pong (puffpong) -- Arcade
- **Current puffs:** Continuous (hold = paddle moves up, release = paddle drifts down) -- effectively 1 sustained puff for the entire match
- **Recommended puffs:** 3-5 (redesign: make puff a "power shot" mechanic, use tap/swipe for basic paddle movement)
- **Tap actions:** Currently none (gravity pulls paddle down constantly)
- **Puff moments:** Currently: hold button = paddle moves up. This is continuous hold, not discrete puffs.
- **Current reward:** Win 80, Loss 15; XP 20/5
- **Recommended tier:** A -- 80 coins base (high skill, real-time reaction)
- **Duration:** 1-3m
- **Issues:** (1) The continuous hold mechanic makes this a "hold for entire game" puff, not 2-5 discrete puffs. Major redesign needed. (2) XP 20/5, not 20/8. (3) Uses `getCoinMultiplier()`. (4) No adaptive difficulty -- AI paddle speed is fixed formula.
- **Improvements:** Redesign: paddle should auto-track ball loosely (tap to fine-adjust). Puff = "smash shot" power move (2-5 per game). Add adaptive AI speed. Fix XP/rewards.

---

### [7] Rhythm Puff (rhythm) -- Arcade
- **Current puffs:** Many (one puff per note hit, plus blinker puff ability) -- 15+ puffs per session
- **Recommended puffs:** 3-5 (redesign: use tap for note hits, puff for "mega clear" power move 3-5 times per song)
- **Tap actions:** Currently: tap specific lane buttons to hit notes
- **Puff moments:** Currently: "rpPuffHit" catches all notes in hit zone; blinker clears all notes. Both are puff-based.
- **Current reward:** Variable -- `Math.min(Math.floor(score/10), 100)` coins; XP 15 flat
- **Recommended tier:** B -- 60 coins base (moderate skill, score-dependent)
- **Duration:** 2-4m
- **Issues:** (1) Too many puffs (every note can be puff-hit). (2) Reward is score-based, not flat. (3) XP is flat 15 for win and loss. (4) No adaptive difficulty -- note speed ramps linearly, not based on player. (5) Uses `getCoinMultiplier()`.
- **Improvements:** Make lane taps the primary mechanic (no puff needed). Reserve puff for 3-5 "mega puff" clears per song. Flat reward. Adaptive note speed.

---

### [8] Tug of War (tugofwar) -- Arcade
- **Current puffs:** Many (spam puff to pull -- unlimited puffs in 30s match + hold mechanic)
- **Recommended puffs:** 3-5 (redesign: auto-pull with tap, puff = "surge burst" 3-5 times per match)
- **Tap actions:** Currently: tap = individual pull; hold = continuous pull
- **Puff moments:** Currently: every tap/hold is treated as a puff
- **Current reward:** Win 80, Loss 15; XP 20/5
- **Recommended tier:** B -- 60 coins base (spam-heavy, moderate strategy)
- **Duration:** 30s-1m
- **Issues:** (1) Unlimited puff spam -- completely contradicts 2-5 puff rule. (2) XP 20/5. (3) Uses `getCoinMultiplier()`. (4) "Surge" mechanic exists but is time-based, not puff-triggered. (5) No adaptive difficulty -- AI pull strength is random.
- **Improvements:** Redesign: rope auto-tug with tap for rhythm bonus. Puff = 3-5 "power surge" bursts per match. Surge windows appear 3-5 times; puff during window for big pull. Adaptive AI strength.

---

### [9] Hot Potato (hotpotato) -- Arcade
- **Current puffs:** 3-8 per session (1 puff each time bomb reaches you -- variable based on survival)
- **Recommended puffs:** 3-5 (natural fit if game lasts 3-5 rounds for the player)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff to pass the bomb (duration determines if you skip a player)
- **Current reward:** Win 60, Loss 10; XP 20/5
- **Recommended tier:** C -- 40 coins base (mostly luck, low skill ceiling)
- **Duration:** 1-3m
- **Issues:** (1) XP 20/5. (2) Uses `getCoinMultiplier()`. (3) Bomb timer is random, no adaptive difficulty. (4) AI hold time is random.
- **Improvements:** Flatten XP. Remove multiplier. Add adaptive bomb timer based on player skill. The puff count naturally fits 2-5.

---

### [10] Russian Roulette (russian) -- Arcade
- **Current puffs:** 2-6 per session (1 puff per turn when it is your turn, variable based on survival)
- **Recommended puffs:** 2-4 (natural fit)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff before trigger pull (duration determines dodge chance 0-30%)
- **Current reward:** Win 50, Loss 5; XP 15/3
- **Recommended tier:** C -- 40 coins base (high luck factor, tension is the draw)
- **Duration:** 1-2m
- **Issues:** (1) XP 15/3, not 20/8. (2) Reward is low (50 for a luck-heavy game). (3) Uses `getCoinMultiplier()`. (4) No adaptive difficulty. (5) Dodge chance caps at 30% for blinker puff.
- **Improvements:** Flatten XP to 20/8. Remove multiplier. Puff count naturally fits. Add adaptive bullet placement based on player survival rate.

---

### [11] Hooked (hooked) -- Arcade
- **Current puffs:** Variable (continuous hold to reel -- similar to Puff Pong problem). Multiple fish catches per session.
- **Recommended puffs:** 3-5 (redesign: 1 puff per fish catch attempt, 3-5 fish per session)
- **Tap actions:** Cast line (tap)
- **Puff moments:** Currently: hold = increase suction; release = suction drops. Continuous hold mechanic.
- **Current reward:** `catches * 20` coins (variable); XP 10 flat
- **Recommended tier:** B -- 60 coins base (skill-based suction control, good depth)
- **Duration:** 3-5m
- **Issues:** (1) Continuous hold mechanic -- not discrete puffs. (2) Reward is variable based on catch count. (3) XP is flat 10 for both win/loss. (4) No adaptive difficulty -- fish stats are fixed. (5) Uses `getCoinMultiplier()`.
- **Improvements:** Redesign: make suction auto-ramp with tap timing. Puff = "power reel" burst 1 per fish (3-5 fish per session). Flat reward. Adaptive fish difficulty.

---

### [12] Puff RPS (rps) -- Arcade
- **Current puffs:** 5 per session (1 puff per round, best of 5)
- **Recommended puffs:** 5 (keep -- perfect fit)
- **Tap actions:** Choose rock/paper/scissors (tap one of 3 choices)
- **Puff moments:** Hold-to-puff for power tier after choosing throw (determines point value and tie-breaker)
- **Current reward:** Win 80, Loss 20, Draw 40; XP 15 flat
- **Recommended tier:** B -- 60 coins base (RPS has luck element, puff power adds skill)
- **Duration:** 2-3m
- **Issues:** (1) XP is flat 15 for all outcomes. (2) Uses `getCoinMultiplier()`. (3) Blinker backfire (-3 points on loss) is interesting but may frustrate. (4) No adaptive difficulty -- AI choice is style-weighted but not player-adaptive.
- **Improvements:** Flatten XP to 20/8. Flat reward 60. Add adaptive AI that learns player throw patterns. Keep blinker risk/reward.

---

### [13] Beat Drop (beatdrop) -- Arcade
- **Current puffs:** 3 per session (1 per song, 3 songs)
- **Recommended puffs:** 3 (keep -- perfect fit)
- **Tap actions:** None
- **Puff moments:** Hold during buildup, release ON the beat drop. Duration of hold + timing of release determines score.
- **Current reward:** Variable (100/50/20 based on score threshold); XP 15 flat
- **Recommended tier:** B -- 60 coins base (timing skill, 3 rounds, moderate difficulty)
- **Duration:** 3-5m
- **Issues:** (1) XP flat 15 for win/loss. (2) Reward is score-threshold-based, not flat. (3) Fake drops add difficulty but no adaptive hook. (4) Uses `getCoinMultiplier()`.
- **Improvements:** Flatten to 60 coins flat. XP 20/8. Add adaptive buildup duration based on player accuracy.

---

### [14] Puff Clock (puffclock) -- Arcade
- **Current puffs:** 5 per session (1 puff per round, 5 rounds)
- **Recommended puffs:** 5 (keep -- perfect fit)
- **Tap actions:** None
- **Puff moments:** Hold for exactly the target duration (e.g., 2.00s, 3.50s, 4.20s). Precision is everything.
- **Current reward:** Variable per round (100/50/25/10/5 based on error); 200 bonus for top 3; XP 10 flat
- **Recommended tier:** A -- 80 coins base (high precision skill, 5 puffs, good duration)
- **Duration:** 3-5m
- **Issues:** (1) Reward is highly variable (per-round coins based on accuracy + top 3 bonus). (2) XP is flat 10. (3) 420 bonus of +420 coins is an outlier. (4) Uses `getCoinMultiplier()`. (5) Leaderboard is simulated, no adaptive difficulty.
- **Improvements:** Flat 80 coins. XP 20/8. Remove the 420 instant coin bonus (or make it cosmetic). Add adaptive target times based on player average error.

---

### [15] Puff Limbo (pufflimbo) -- Arcade
- **Current puffs:** 3-7 per session (1 puff per round, 7 rounds max)
- **Recommended puffs:** 3-5 (cap at 5 rounds or make later rounds optional)
- **Tap actions:** None
- **Puff moments:** Hold for exactly the target duration (progressively longer: 2.5s -> 4.5s). Survival endurance.
- **Current reward:** Eliminated: 10/30/60 based on round reached; Champion: 150; XP 15 flat
- **Recommended tier:** A -- 80 coins base (endurance challenge, escalating difficulty, high tension)
- **Duration:** 3-5m
- **Issues:** (1) Reward varies by round reached. (2) XP flat 15. (3) 7 rounds may exceed 5 puff target. (4) Uses `getCoinMultiplier()`. (5) No adaptive difficulty -- targets are fixed sequence.
- **Improvements:** Cap at 5 rounds (targets: 2.5, 3.0, 3.5, 4.0, 4.5). Flat 80 coins. XP 20/8. Add adaptive target adjustment based on player's previous Limbo performance.

---

### [16] Puff Derby (puffderby) -- Arcade
- **Current puffs:** 20-50+ per session (spam puff to make horse run -- unlimited puffs in 30s race)
- **Recommended puffs:** 3-5 (redesign: horse auto-runs, puff = "boost" burst 3-5 times per race)
- **Tap actions:** Horse selection (tap)
- **Puff moments:** Currently: every tap/puff is a speed boost. Spam mechanic.
- **Current reward:** Place-based ([0, 100, 60, 30, 15, 5, 2]); XP 10 flat
- **Recommended tier:** C -- 40 coins base (more spectacle than skill, luck-heavy with AI randomness)
- **Duration:** 2-3m
- **Issues:** (1) Spam puff completely violates 2-5 rule. (2) Variable reward by placement. (3) XP flat 10. (4) Stamina system exists but doesn't limit puffs enough. (5) No adaptive difficulty.
- **Improvements:** Horse auto-runs at base speed. Give 3-5 "boost" puffs -- strategic timing matters (use at straights, save for final stretch). Flat 40 coins. XP 20/8. Adaptive AI base speed.

---

## STAGE ZONE (6 games)

---

### [17] Vibe Check (vibecheck) -- Stage
- **Current puffs:** 0 per session (trivia game -- uses tap to answer, no puff mechanics)
- **Recommended puffs:** 2-3 (add puff moments: "puff to lock in answer" or "puff for lifeline")
- **Tap actions:** Select answer from 4 options
- **Puff moments:** None currently
- **Current reward:** Variable -- `vcScore` (accumulated per question); XP variable (30 if score>50, else 15)
- **Recommended tier:** A -- 80 coins base (long format, trivia skill, elimination pressure)
- **Duration:** 5-15m
- **Issues:** (1) No puff mechanic at all -- contradicts the app's core identity. (2) Reward is score-accumulation, not flat. (3) XP is variable. (4) Uses `getCoinMultiplier()`. (5) recordGameResult called only at close, not per question.
- **Improvements:** Add puff-to-lock-in mechanic (puff duration = confidence multiplier). Add "puff lifeline" (blinker puff = 50/50). Flat 80 coins. XP 20/8.

---

### [18] Higher or Lower (higherlower) -- Stage
- **Current puffs:** 0-10 (uses `hlHandlePuff(isLong)` -- puff duration determines higher/lower guess, but can also tap buttons)
- **Recommended puffs:** 3-5 (use puff only for "confidence boost" moments, tap for guesses)
- **Tap actions:** Higher/Lower buttons
- **Puff moments:** Currently: puff mapped to guess direction (short=lower, long=higher)
- **Current reward:** `Math.max(10, Math.floor(hlScore/2))` coins; XP 15 flat
- **Recommended tier:** B -- 60 coins base (knowledge + luck, 10 rounds, moderate duration)
- **Duration:** 5-10m
- **Issues:** (1) 10 rounds = 10 puffs if using puff input -- exceeds 2-5. (2) Reward is score-dependent. (3) XP flat 15. (4) Uses `getCoinMultiplier()`. (5) No adaptive difficulty.
- **Improvements:** Make guess via tap only. Puff reserved for "double down" moments (bet 2x on confidence, 3-5 times per game). Flat 60. XP 20/8. Adaptive stat difficulty.

---

### [19] The Price is Puff (pricepuff) -- Stage
- **Current puffs:** 5 per session (1 puff per round, 5 rounds -- hold to increase price guess)
- **Recommended puffs:** 5 (keep -- natural fit)
- **Tap actions:** None -- puff duration maps directly to price guess amount
- **Puff moments:** Hold-to-puff to set price guess (longer = higher guess). Release to lock in.
- **Current reward:** Variable per round (25 for closest, 50 for exact); XP 15 flat
- **Recommended tier:** B -- 60 coins base (knowledge + puff precision)
- **Duration:** 5-10m
- **Issues:** (1) Reward is variable per round. (2) XP flat 15. (3) Uses `getCoinMultiplier()`. (4) AI guesses have fixed variance formula -- no adaptive difficulty.
- **Improvements:** Flat 60 coins. XP 20/8. Adaptive AI guess accuracy. Keep 5-puff structure.

---

### [20] Survival Trivia (survivaltrivia) -- Stage
- **Current puffs:** 0-24 (puff-to-answer mechanic: hold duration maps to answer A/B/C/D, up to 24 questions)
- **Recommended puffs:** 3-5 (use tap for answers, puff for "lifeline" or "shield" moments)
- **Tap actions:** Tap one of 4 answer buttons
- **Puff moments:** Currently: `stPuffStart/stPuffStop` maps hold duration to answer index
- **Current reward:** Win 80, Loss 15; XP 20 flat
- **Recommended tier:** A -- 80 coins base (elimination format, high stakes, long duration)
- **Duration:** 5-15m
- **Issues:** (1) Puff-per-answer means 10-24 puffs -- way too many. (2) XP is flat 20 for both outcomes. (3) Uses `getCoinMultiplier()`. (4) Elimination rate is formula-based, not adaptive. (5) Questions are cannabis-themed only.
- **Improvements:** Answers via tap only. Puff reserved for 3 "lifeline" uses (50/50, skip question, extra time). Flat 80. XP 20/8. Add adaptive elimination rate.

---

### [21] Simon Puffs (simonpuffs) -- Stage
- **Current puffs:** 1-55 per session (pattern replay: round N requires N puffs to replay, up to round 10 = 55 total puffs)
- **Recommended puffs:** 3-5 (redesign: tap for pattern replay, puff for "memory boost" power-up)
- **Tap actions:** None currently -- all pattern replay is via puff duration (short/medium/long)
- **Puff moments:** Every pattern element requires a correctly-timed puff
- **Current reward:** Variable -- `Math.min(500, spScore)` coins based on rounds survived; XP 15 flat
- **Recommended tier:** A -- 80 coins base (memory skill, escalating difficulty, high tension)
- **Duration:** 3-8m
- **Issues:** (1) Massive puff count (sum of 1..N for N rounds). (2) Puff duration IS the core mechanic (short/medium/long). Redesigning this changes the game fundamentally. (3) Reward is variable. (4) XP flat 15. (5) Uses `getCoinMultiplier()`. (6) No adaptive difficulty.
- **Improvements:** This is the hardest game to convert to 2-5 puffs because puff duration IS the mechanic. Option A: keep as-is but count only "power puffs" separately. Option B: Convert pattern replay to tap (3 buttons for short/medium/long), reserve puff for 3 "memory assist" power-ups. Flat 80 coins. XP 20/8.

---

### [22] Puff Auction (puffauction) -- Stage
- **Current puffs:** 5-8 per session (1 puff per auction round, 5-8 items)
- **Recommended puffs:** 5 (cap auction at 5 items)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff = bid duration. Longest non-blinker puff wins. Blinker = disqualified.
- **Current reward:** Variable -- total value of won items; XP 15 flat
- **Recommended tier:** B -- 60 coins base (strategy + risk management, blinker trap is fun)
- **Duration:** 3-8m
- **Issues:** (1) PA_PRIZES array length determines round count -- could exceed 5 puffs. (2) Reward is totally variable based on items won. (3) XP flat 15. (4) Uses `getCoinMultiplier()`. (5) AI bid times are random, no adaptation.
- **Improvements:** Cap at 5 auction items (5 puffs). Flat 60 coins. XP 20/8. Add adaptive AI bid times. The blinker-disqualification mechanic is excellent -- keep it.

---

## ORACLE ZONE (13 games)

---

### [23] Crystal Ball (crystalball) -- Oracle
- **Current puffs:** 5 per session (1 puff per prediction, 5 rounds)
- **Recommended puffs:** 5 (keep)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff: short = "no", long = "yes", blinker = "certain" (3x risk)
- **Current reward:** Variable (50 per correct, 150 for blinker correct, -100 for blinker wrong); XP 10 flat
- **Recommended tier:** D -- 25 coins base (mostly luck/random, low skill)
- **Duration:** 2-3m
- **Issues:** (1) Result is `Math.random() > 0.45` -- pure luck. (2) Blinker penalty of -100 coins is harsh. (3) XP flat 10. (4) recordGameResult called per round, not once at end. (5) No adaptive difficulty (random outcomes).
- **Improvements:** Flat 25 coins at game end (not per question). XP 20/8. Remove per-round recordGameResult calls, call once at end. The blinker risk/reward is fun for fortune games -- keep but reduce penalty.

---

### [24] Strain Battle (strainbattle) -- Oracle
- **Current puffs:** 5 per session (1 puff per matchup, 5 rounds)
- **Recommended puffs:** 5 (keep)
- **Tap actions:** None (could be -- short puff = left, long puff = right)
- **Puff moments:** Puff duration determines vote: short = left strain, long = right strain
- **Current reward:** 30 if majority vote, 10 otherwise; XP 10 flat; recordGameResult per round
- **Recommended tier:** E -- 15 coins base (no real skill, opinion voting)
- **Duration:** 2-3m
- **Issues:** (1) recordGameResult called per round (5 times). (2) XP flat 10. (3) "Correct" is whether you voted with the majority -- not really a skill test. (4) No adaptive anything.
- **Improvements:** Call recordGameResult once at end. Flat 15 coins. XP 20/8. This is more of a social/engagement feature than a competitive game.

---

### [25] Match Predictor (matchpredictor) -- Oracle
- **Current puffs:** 5 per session (1 puff per match prediction, 5 rounds)
- **Recommended puffs:** 5 (keep)
- **Tap actions:** None (puff duration = home/draw/away)
- **Puff moments:** Short = home win, medium = draw, long = away win
- **Current reward:** 100 per correct prediction; XP 10; recordGameResult per correct only
- **Recommended tier:** D -- 25 coins base (sports knowledge + luck)
- **Duration:** 2-3m
- **Issues:** (1) recordGameResult only called on correct predictions -- inconsistent. (2) XP flat 10. (3) Results are simulated random based on pool odds. (4) No adaptive difficulty.
- **Improvements:** Call recordGameResult once at end. Flat 25 coins. XP 20/8.

---

### [26] Daily Picks (dailypicks) -- Oracle
- **Current puffs:** 3 per session (1 puff per pick, 3 picks)
- **Recommended puffs:** 3 (keep -- perfect)
- **Tap actions:** None
- **Puff moments:** Puff duration = answer choice (short/long for yes/no or option A/B)
- **Current reward:** Variable -- 50 * streak multiplier (up to 10x at 30-day streak); XP 10 flat; per-pick
- **Recommended tier:** D -- 25 coins base (daily engagement, low skill)
- **Duration:** 1-2m
- **Issues:** (1) Streak multiplier up to 10x creates massive reward variance. (2) recordGameResult per pick. (3) XP flat 10. (4) Correctness is random.
- **Improvements:** Remove streak coin multiplier (keep streak as cosmetic only). Call recordGameResult once. Flat 25. XP 20/8.

---

### [27] Spin & Win (spinwin) -- Oracle
- **Current puffs:** 3-4 per session (1 puff per spin, 3 spins + optional bonus spin)
- **Recommended puffs:** 3 (keep)
- **Tap actions:** None
- **Puff moments:** Puff to spin the wheel (puff function not deeply tied to outcome -- `puffLockIn(swDoSpin)`)
- **Current reward:** Highly variable -- wheel segments range from BUST (-200) to JACKPOT (1000); XP 10/5; per-spin
- **Recommended tier:** D -- 25 coins base (pure luck, slot machine format)
- **Duration:** 2-3m
- **Issues:** (1) recordGameResult per spin (3-4 times). (2) BUST removes coins from player balance. (3) Extremely variable rewards. (4) XP variable (10 or 5). (5) Uses `getCoinMultiplier()`. (6) No adaptive anything.
- **Improvements:** Call recordGameResult once at end. Flat 25 coins. XP 20/8. Remove direct coin deduction on BUST (just zero reward). This is a casino game -- lower tier is appropriate.

---

### [28] Puff Slots (puffslots) -- Oracle
- **Current puffs:** 8 per session (1 puff per spin, 8 spins)
- **Recommended puffs:** 5 (reduce to 5 spins)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff to spin reels. Blinker = 2 reels guaranteed matching.
- **Current reward:** Variable (per-spin payouts from 10 to 1000+); XP at end (20/5); coins added directly per spin
- **Recommended tier:** D -- 25 coins base (slot machine, pure luck with blinker bonus)
- **Duration:** 2-3m
- **Issues:** (1) 8 puffs exceeds 5 target. (2) Coins added directly to balance per spin (not via recordGameResult). (3) recordGameResult only at game end for XP. (4) Uses `fortuneLuckyHour` 2x multiplier. (5) No adaptive anything.
- **Improvements:** Reduce to 5 spins. All coin awards at end via recordGameResult. Flat 25 coins. XP 20/8. Remove lucky hour multiplier from individual spins.

---

### [29] Puff Blackjack (puffblackjack) -- Oracle
- **Current puffs:** 7-21+ per session (multiple puffs per hand: hit/stand/double down, 7 hands per game)
- **Recommended puffs:** 5 (reduce to 5 hands, or make hit/stand a tap with puff only for double down)
- **Tap actions:** None (all via puff duration: short=hit, long=stand, blinker=double down)
- **Puff moments:** Every decision is a puff
- **Current reward:** Variable (bet-based, 50 base * 2 on win, 2.5x on blackjack); XP 15/5; per-hand
- **Recommended tier:** C -- 40 coins base (card game skill, moderate strategy)
- **Duration:** 3-5m
- **Issues:** (1) 7 hands with multiple puffs each = 14-21+ puffs total. Way too many. (2) recordGameResult per hand. (3) Coins deducted from balance on loss. (4) Uses `updateFortuneXP`. (5) No adaptive dealer behavior.
- **Improvements:** Reduce to 5 hands. Make hit/stand tap buttons. Reserve puff for double down decision only (1 puff per hand max). Flat 40 coins. XP 20/8. No coin deduction on loss.

---

### [30] Coin Flip (coinflip) -- Oracle
- **Current puffs:** 8+ per session (1 pick puff + 1 confidence puff per round, 8 rounds)
- **Recommended puffs:** 4 (reduce to 4 rounds, make side-pick a tap)
- **Tap actions:** Pick heads/tails (already tap-based via `cfPickSide`)
- **Puff moments:** Confidence puff (duration = multiplier 1x to 5x). Blinker = 5x with penalty on loss.
- **Current reward:** Variable (bet * multiplier on win, -bet*2 on blinker loss); XP 10; per-flip
- **Recommended tier:** E -- 15 coins base (50/50 luck, confidence mechanic adds flavor)
- **Duration:** 2-3m
- **Issues:** (1) 8 rounds of confidence puffs = 8 puffs (picks are taps). (2) recordGameResult per flip. (3) Coins deducted on blinker loss. (4) Uses `updateFortuneXP`. (5) Pure luck.
- **Improvements:** Reduce to 4-5 rounds. recordGameResult once at end. Flat 15 coins. XP 20/8. No coin deduction.

---

### [31] Craps & Clouds (crapsnclouds) -- Oracle
- **Current puffs:** 8-16+ per session (1 puff per roll, 8 rounds, point phase requires multiple rolls)
- **Recommended puffs:** 5 (reduce to 5 rounds, cap point phase re-rolls)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff maps duration to dice total (short=2-3, long=11-12)
- **Current reward:** Variable (bet-based, 50 per win); XP 10; per-win recordGameResult
- **Recommended tier:** C -- 40 coins base (dice strategy, puff-to-roll is fun)
- **Duration:** 2-3m
- **Issues:** (1) Point phase can add many extra puffs. (2) recordGameResult per win only. (3) XP flat 10. (4) No coin deduction but variable reward. (5) No adaptive anything.
- **Improvements:** Cap at 5 initial rounds (point phase counts toward the 5). recordGameResult once at end. Flat 40 coins. XP 20/8.

---

### [32] Mystery Box (mysterybox) -- Oracle
- **Current puffs:** 5 per session (1 pick + 1 reveal puff per round... but pick is tap, reveal is puff = 5 puffs)
- **Recommended puffs:** 5 (keep)
- **Tap actions:** Pick box (tap one of 3)
- **Puff moments:** Hold-to-puff to reveal prize. Blinker = rarity upgrade if common.
- **Current reward:** Variable per box (0 to 1000); XP 10; per-reveal recordGameResult
- **Recommended tier:** D -- 25 coins base (pure luck with blinker rarity boost)
- **Duration:** 2-3m
- **Issues:** (1) recordGameResult per reveal. (2) Reward is the prize value itself -- highly variable. (3) XP flat 10.
- **Improvements:** recordGameResult once at end. Flat 25 coins. XP 20/8. Keep blinker upgrade mechanic.

---

### [33] Scratch & Puff (scratchpuff) -- Oracle
- **Current puffs:** 6 per card x 3 cards = 18 puffs per session (1 puff per scratch area)
- **Recommended puffs:** 3-5 (redesign: 1 puff per card to auto-scratch all 6 areas)
- **Tap actions:** Select scratch area (tap)
- **Puff moments:** Puff to scratch revealed area. Blinker = wild symbol.
- **Current reward:** Variable (match-3 payouts 50-1000); XP 10; per-card recordGameResult
- **Recommended tier:** D -- 25 coins base (pure luck, scratch card format)
- **Duration:** 2-3m
- **Issues:** (1) 18 puffs way too many. (2) recordGameResult per card. (3) Variable reward. (4) XP flat 10.
- **Improvements:** 1 puff per card (auto-reveal all areas). 3 cards = 3 puffs. Blinker on any puff = wild symbol on that card. recordGameResult once at end. Flat 25 coins. XP 20/8.

---

### [34] Fortune Cookie (fortunecookie) -- Oracle
- **Current puffs:** 5 per session (1 puff per cookie, 5 cookies)
- **Recommended puffs:** 5 (keep)
- **Tap actions:** None
- **Puff moments:** Hold-to-puff to crack cookie. Blinker = golden cookie (rare fortune + more coins).
- **Current reward:** Variable (10-190 base, 50-450 blinker); XP 10; per-cookie recordGameResult
- **Recommended tier:** E -- 15 coins base (no skill, fortune reading novelty)
- **Duration:** 1-2m
- **Issues:** (1) recordGameResult per cookie (always win). (2) Reward is random. (3) XP flat 10. (4) No skill component at all.
- **Improvements:** recordGameResult once at end. Flat 15 coins. XP 20/8. Keep blinker golden cookie as cosmetic flair.

---

### [35] Treasure Map (treasuremap) -- Oracle
- **Current puffs:** 3-16 per session (1 puff per tile flip, up to 16 tiles)
- **Recommended puffs:** 3-5 (redesign: tap to select tile, auto-reveal, puff only for "X-ray scan" power-up 3 times)
- **Tap actions:** Select tile (tap)
- **Puff moments:** Currently: puff to flip tile. Blinker = X-ray vision (peek at hidden tiles).
- **Current reward:** Variable (coin/star/clover values + treasure/bomb); XP 10; per-result recordGameResult
- **Recommended tier:** C -- 40 coins base (memory/deduction + luck, minesweeper-style)
- **Duration:** 3-5m
- **Issues:** (1) Up to 16 puffs if player flips every tile. (2) recordGameResult per event (treasure, bomb, cash-out). (3) Bomb halves accumulated coins. (4) Variable reward. (5) XP flat 10.
- **Improvements:** Tap to flip (auto-reveal). Puff reserved for 3 "X-ray scan" power-ups. recordGameResult once at end. Flat 40 coins. XP 20/8. Add adaptive bomb placement based on player experience.

---

## CROSS-CUTTING ISSUES

### 1. `getCoinMultiplier()` used everywhere
Every game applies the loyalty tier multiplier and device bonus to coin rewards. The new rule says "flat coins" -- this multiplier must be removed from all 35 games' `recordGameResult` calls, or `recordGameResult` itself must ignore the multiplier.

### 2. `recordGameResult` function signature
Currently: `recordGameResult(won, baseCoins, baseXP)`. The function internally applies `getCoinMultiplier()`. To implement flat coins and flat XP:
- Change to always use the passed `baseCoins` without multiplier
- Hardcode XP to 20 (win) / 8 (loss) regardless of `baseXP` parameter

### 3. Per-round vs per-game recordGameResult calls
Many Oracle games call `recordGameResult` per round/question/spin instead of once at game end. This inflates stats, XP, and coins. Every game should call it exactly once at game end.

**Games calling recordGameResult multiple times:**
- Crystal Ball (5x), Strain Battle (5x), Match Predictor (up to 5x), Daily Picks (3x), Spin & Win (3-4x), Puff Blackjack (7x), Coin Flip (8x), Craps & Clouds (8x), Mystery Box (5x), Scratch & Puff (3x), Fortune Cookie (5x), Treasure Map (variable), Puff Clock (5x), Higher/Lower (per round)

### 4. Coins added/deducted directly from balance
Several fortune games directly modify `setCoins()` outside of `recordGameResult`:
- Blackjack: deducts bet on loss
- Coin Flip: deducts on blinker loss
- Crystal Ball: deducts 100 on blinker wrong
- Puff Slots: adds per-spin wins directly
- Spin & Win: adds/deducts per-spin

This bypasses the reward system entirely. All coin changes should go through `recordGameResult`.

### 5. No adaptive difficulty anywhere
Zero games have player-skill-adaptive difficulty. All AI behavior is either random or follows fixed formulas. The new rules require hooks for "invisible difficulty adjustment." Every game needs at minimum:
- A player skill tracker (rolling average of recent performance)
- AI difficulty parameter that adjusts based on this tracker

### 6. Input mode assumptions
Many games assume button/hold input is available. With MIC-only mode:
- Hold-to-puff mechanics need to work with actual BLE puff data
- The `btPuffDown/btPuffUp` ref pattern already supports this for some games
- Games not yet wired for BLE: see `Doc/BLE-Implementation.md`

---

## REWARD TIER SUMMARY

| Tier | Games | Base Coins | Criteria |
|------|-------|-----------|----------|
| S | FK2, FK3 | 100 | Highest skill ceiling, double precision, 3D |
| A | FK1, Wild West, Puff Pong, Puff Clock, Puff Limbo, Vibe Check, Survival Trivia, Simon Puffs | 80 | High skill, good duration, competitive |
| B | Rhythm Puff, Tug of War, Hooked, Puff RPS, Beat Drop, Higher/Lower, Price is Puff, Puff Auction | 60 | Moderate skill, some luck element |
| C | Hot Potato, Russian Roulette, Puff Blackjack, Craps & Clouds, Puff Derby, Treasure Map | 40 | Luck-heavy or spam-based, moderate engagement |
| D | Crystal Ball, Match Predictor, Daily Picks, Spin & Win, Puff Slots, Mystery Box, Scratch & Puff | 25 | Pure luck / casino format |
| E | Strain Battle, Coin Flip, Fortune Cookie | 15 | No skill, novelty/social |

---

## PUFF COUNT MIGRATION PRIORITY

**Already compliant (2-5 puffs):** Wild West, Beat Drop, Puff Clock, Hot Potato, Russian Roulette, Crystal Ball, Strain Battle, Match Predictor, Daily Picks, Spin & Win, Mystery Box, Fortune Cookie, Price is Puff, Puff RPS

**Needs reduction (6-10 puffs):** FK2, FK3, Puff Limbo, Puff Auction, Puff Slots, Coin Flip, Craps & Clouds, Higher/Lower, Balloon Pop

**Needs major redesign (10+ puffs):** Puff Pong, Rhythm Puff, Tug of War, Hooked, Puff Derby, Simon Puffs, Survival Trivia, Vibe Check, Blackjack, Scratch & Puff, Treasure Map
