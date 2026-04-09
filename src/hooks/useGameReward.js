import { useCallback } from 'react';
import { GAME_CONFIG, LOYALTY_BADGES } from '../constants/index.js';

/**
 * useGameReward — centralised reward calculation and distribution
 *
 * Call from AppContext. Returns awardGame() which game components call when
 * a match ends.
 *
 * Multiplier stack (applied in order):
 *   1. Base reward from GAME_CONFIG[gameId].reward
 *   2. BLE bonus: 1.2× if bleConnected
 *   3. Tap penalty: 0.7× if sessionInput === "tap"
 *   4. Lucky hour: 2× if active
 *   5. Loyalty tier multiplier (from LOYALTY_TIERS[tier].mult)
 *   6. Win/lose factor: win → full, lose → 0.3×
 */
export function useGameReward({
  bleConnected,
  sessionInput,
  luckyHourActive,
  tierMult,
  coins,       setCoins,
  xp,          setXp,
  currentWinStreak, setCurrentWinStreak,
  bestWinStreak,    setBestWinStreak,
  earnedBadges,     setEarnedBadges,
  completedChallenges, setCompletedChallenges,
  setFloatingReward,
  setCoinPulse,
  setAchievementPopup,
  playFx,
}) {
  const awardGame = useCallback((gameId, result = 'win') => {
    const config = GAME_CONFIG[gameId];
    if (!config) return;

    const baseCoins = config.reward ?? 50;
    const baseXp    = Math.floor(baseCoins * 0.5);

    let mult = 1;
    if (bleConnected)                  mult *= 1.2;
    if (sessionInput === 'tap')        mult *= 0.7;
    if (luckyHourActive)               mult *= 2;
    if (tierMult && tierMult > 1)      mult *= tierMult;
    if (result !== 'win')              mult *= 0.3;

    const earnedCoins = Math.round(baseCoins * mult);
    const earnedXp    = Math.round(baseXp * mult);

    setCoins(c => c + earnedCoins);
    setXp(x => x + earnedXp);
    setCoinPulse(true);
    setTimeout(() => setCoinPulse(false), 800);

    setFloatingReward({ coins: earnedCoins, xp: earnedXp });
    setTimeout(() => setFloatingReward(null), 2500);

    if (result === 'win') {
      playFx?.('coin_collect');
      setCurrentWinStreak(s => {
        const next = s + 1;
        setBestWinStreak(b => Math.max(b, next));
        // Badge checks
        if (next >= 5) maybeUnlockBadge('streak5', earnedBadges, setEarnedBadges, setAchievementPopup, playFx);
        if (next >= 10) maybeUnlockBadge('streak10', earnedBadges, setEarnedBadges, setAchievementPopup, playFx);
        return next;
      });
    } else {
      setCurrentWinStreak(0);
    }

    // First-puff badge
    maybeUnlockBadge('fp', earnedBadges, setEarnedBadges, setAchievementPopup, playFx);

  }, [
    bleConnected, sessionInput, luckyHourActive, tierMult,
    coins, setCoins, xp, setXp,
    currentWinStreak, setCurrentWinStreak, bestWinStreak, setBestWinStreak,
    earnedBadges, setEarnedBadges, completedChallenges, setCompletedChallenges,
    setFloatingReward, setCoinPulse, setAchievementPopup, playFx,
  ]);

  return { awardGame };
}

function maybeUnlockBadge(id, earned, setEarned, setPopup, playFx) {
  if (earned.includes(id)) return;
  const badge = LOYALTY_BADGES.find(b => b.id === id);
  if (!badge) return;
  setEarned(prev => [...prev, id]);
  setPopup(badge);
  playFx?.('achievement');
  setTimeout(() => setPopup(null), 3000);
}
