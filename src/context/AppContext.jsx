import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from '../hooks/useAudio.js';
import { useBLE } from '../hooks/useBLE.js';
import { useGameReward } from '../hooks/useGameReward.js';
import { LOYALTY_TIERS } from '../constants/loyalty.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Audio ──
  const [audioOn, setAudioOn] = useState(true);
  const { playFx, playAudio, gameSoundsMuted } = useAudio(audioOn);

  // ── Notification helper (toast-style) ──
  const [notification, setNotification] = useState(null);
  const notify = useCallback((msg, color = '#00E5FF') => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  // ── BLE ──
  const {
    bleDevices, bleConnected, bleScanning, bleDevicesRef,
    connectBleSlot, disconnectBleSlot, connectBle, disconnectBle,
    setBLEHandlers, clearBLEHandlers,
  } = useBLE({ playFx, notify });

  // ── Currency & Rewards ──
  const [coins, setCoins] = useState(12580);
  const [xp, setXp] = useState(7450);
  const [floatingReward, setFloatingReward] = useState(null);
  const [coinPulse, setCoinPulse] = useState(false);

  // ── Loyalty & Progression ──
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyCheckedIn, setDailyCheckedIn] = useState(false);
  const [ownedItems, setOwnedItems] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState(['fp']);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [currentWinStreak, setCurrentWinStreak] = useState(0);
  const [bestWinStreak, setBestWinStreak] = useState(0);

  // ── Achievement Popup ──
  const [achievementPopup, setAchievementPopup] = useState(null);

  // ── Input & Device Config ──
  const [deviceActivated, setDeviceActivated] = useState(true);
  const [deviceModel, setDeviceModel] = useState('cc_s2');
  const [inputMode, setInputMode] = useState('auto');
  const [primaryInput, setPrimaryInput] = useState('puff');
  const [sessionInput, setSessionInput] = useState('puff');

  // ── UI Overlays ──
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState(null);
  const [showBlePopup, setShowBlePopup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);
  const [smokeParticles, setSmokeParticles] = useState([]);

  // ── Chat (game) ──
  const [gameChatMsgs, setGameChatMsgs] = useState([]);
  const [gameChatInput, setGameChatInput] = useState('');
  const [gameChatOpen, setGameChatOpen] = useState(true);

  // ── Chat (live) ──
  const [liveChatMsgs, setLiveChatMsgs] = useState([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [chatsSent, setChatsSent] = useState(0);

  // ── Multiplayer ──
  const [mpActive, setMpActive] = useState(false);
  const [ssPlayerCount, setSsPlayerCount] = useState(2);
  const [partyPlayerNames, setPartyPlayerNames] = useState(['You', 'Friend 1', 'Friend 2', 'Friend 3']);

  // ── Derived: loyalty tier ──
  const tier = LOYALTY_TIERS.reduce((t, tier) => xp >= tier.xpReq ? tier : t, LOYALTY_TIERS[0]);
  const tierMult = tier.mult;

  // ── Lucky hour (random 2× window) ──
  const [luckyHourActive, setLuckyHourActive] = useState(false);

  // ── Visual Effects ──
  const triggerFlash = useCallback((type) => {
    setScreenFlash(type);
    setTimeout(() => setScreenFlash(null), 400);
  }, []);
  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  }, []);
  const spawnConfetti = useCallback((count = 30, colors = ['#00E5FF','#FFD93D','#34D399','#FF4D8D','#FB923C']) => {
    const particles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40, y: -5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3,
      rot: Math.random() * 360, size: 3 + Math.random() * 5,
    }));
    setConfettiParticles(p => [...p, ...particles].slice(-50));
    setTimeout(() => setConfettiParticles([]), 3000);
  }, []);

  // ── Game Reward ──
  const { awardGame } = useGameReward({
    bleConnected, sessionInput, luckyHourActive, tierMult,
    coins, setCoins, xp, setXp,
    currentWinStreak, setCurrentWinStreak,
    bestWinStreak, setBestWinStreak,
    earnedBadges, setEarnedBadges,
    completedChallenges, setCompletedChallenges,
    setFloatingReward, setCoinPulse, setAchievementPopup, playFx,
  });

  // ── Persist key state to localStorage ──
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moodlab_state') || '{}');
      if (saved.coins)               setCoins(saved.coins);
      if (saved.xp)                  setXp(saved.xp);
      if (saved.earnedBadges)        setEarnedBadges(saved.earnedBadges);
      if (saved.ownedItems)          setOwnedItems(saved.ownedItems);
      if (saved.bestWinStreak)       setBestWinStreak(saved.bestWinStreak);
      if (saved.dailyStreak)         setDailyStreak(saved.dailyStreak);
      if (saved.dailyCheckedIn)      setDailyCheckedIn(saved.dailyCheckedIn);
    } catch (e) {}
  }, []); // eslint-disable-line

  useEffect(() => {
    try {
      localStorage.setItem('moodlab_state', JSON.stringify({
        coins, xp, earnedBadges, ownedItems, bestWinStreak, dailyStreak, dailyCheckedIn,
      }));
    } catch (e) {}
  }, [coins, xp, earnedBadges, ownedItems, bestWinStreak, dailyStreak, dailyCheckedIn]);

  const value = {
    // Audio
    audioOn, setAudioOn, playFx, playAudio, gameSoundsMuted,
    // Notification
    notification, notify,
    // BLE
    bleDevices, bleConnected, bleScanning, bleDevicesRef,
    connectBleSlot, disconnectBleSlot, connectBle, disconnectBle,
    setBLEHandlers, clearBLEHandlers,
    // Currency
    coins, setCoins, xp, setXp, floatingReward, setFloatingReward, coinPulse, setCoinPulse,
    // Loyalty
    dailyStreak, setDailyStreak, dailyCheckedIn, setDailyCheckedIn,
    ownedItems, setOwnedItems, earnedBadges, setEarnedBadges,
    completedChallenges, setCompletedChallenges,
    currentWinStreak, setCurrentWinStreak, bestWinStreak, setBestWinStreak,
    tier, tierMult, luckyHourActive, setLuckyHourActive,
    // Achievement
    achievementPopup, setAchievementPopup,
    // Input/Device
    deviceActivated, setDeviceActivated, deviceModel, setDeviceModel,
    inputMode, setInputMode, primaryInput, setPrimaryInput,
    sessionInput, setSessionInput,
    // UI
    screenShake, setScreenShake, screenFlash, setScreenFlash,
    showBlePopup, setShowBlePopup,
    showProfile, setShowProfile,
    showAchievements, setShowAchievements,
    confettiParticles, setConfettiParticles,
    smokeParticles, setSmokeParticles,
    triggerFlash, triggerShake, spawnConfetti,
    // Chat
    gameChatMsgs, setGameChatMsgs, gameChatInput, setGameChatInput,
    gameChatOpen, setGameChatOpen,
    liveChatMsgs, setLiveChatMsgs, liveChatInput, setLiveChatInput,
    chatsSent, setChatsSent,
    // Multiplayer
    mpActive, setMpActive, ssPlayerCount, setSsPlayerCount,
    partyPlayerNames, setPartyPlayerNames,
    // Reward
    awardGame,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
