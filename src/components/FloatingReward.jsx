import React from 'react';
import { C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * FloatingReward — animated +coins / +XP popup.
 * Reads floatingReward from AppContext. Renders nothing when null.
 */
export default function FloatingReward() {
  const { floatingReward } = useApp();
  if (!floatingReward) return null;

  return (
    <div
      key={floatingReward.key ?? 'reward'}
      style={{
        position: 'fixed', top: '45%', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300, animation: 'rewardFloatUp 2s ease-out forwards',
        pointerEvents: 'none', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, textShadow: '0 2px 10px rgba(255,217,61,0.5)' }}>
        +{floatingReward.coins} 🪙
      </div>
      {floatingReward.xp > 0 && (
        <div style={{ fontSize: 14, fontWeight: 700, color: C.cyan, marginTop: 4 }}>
          +{floatingReward.xp} XP
        </div>
      )}
    </div>
  );
}
