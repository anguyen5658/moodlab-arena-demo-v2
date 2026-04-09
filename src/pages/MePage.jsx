import React, { useState } from 'react';
import { C, GLASS_CARD } from '../constants/colors.js';
import { LOYALTY_TIERS, LOYALTY_BADGES, DAILY_CHALLENGES, SHOP_ITEMS } from '../constants/loyalty.js';
import { useApp } from '../context/AppContext.jsx';

export default function MePage() {
  const {
    coins, setCoins, xp, tier, tierMult,
    earnedBadges, ownedItems, setOwnedItems,
    dailyStreak, dailyCheckedIn, setDailyCheckedIn, setDailyStreak,
    currentWinStreak, bestWinStreak,
    notify, playFx, audioOn, setAudioOn,
    setShowBlePopup, bleConnected,
  } = useApp();

  const [tab, setTab] = useState('overview');

  const nextTier = LOYALTY_TIERS.find(t => t.xpReq > xp);
  const xpProgress = nextTier ? Math.min(((xp - tier.xpReq) / (nextTier.xpReq - tier.xpReq)) * 100, 100) : 100;
  const userLevel = Math.floor(xp / 500) + 1;

  const handleCheckIn = () => {
    if (dailyCheckedIn) { notify('Already checked in today!', C.text3); return; }
    const bonus = 50 + dailyStreak * 10;
    setCoins(c => c + bonus);
    setDailyStreak(s => s + 1);
    setDailyCheckedIn(true);
    playFx('coin_collect');
    notify(`+${bonus} coins! Day ${dailyStreak + 1} streak!`, C.gold);
  };

  const TABS = ['overview', 'badges', 'shop', 'settings'];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, paddingBottom: 100 }}>
      <div style={{ padding: '12px 14px', position: 'relative' }}>
        {/* Profile header */}
        <div style={{ padding: 20, borderRadius: 22, marginBottom: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(145deg, rgba(10,14,28,1), ${tier.color}10, rgba(10,14,28,1))`, border: `1px solid ${tier.color}30`, boxShadow: `0 0 40px ${tier.color}12` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${tier.color}40, rgba(8,8,24,1))`, border: `2px solid ${tier.color}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, boxShadow: `0 0 30px ${tier.color}25` }}>
                {ownedItems.includes('avatar_cat') ? '🐱' : ownedItems.includes('avatar_alien') ? '👽' : '🌟'}
              </div>
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg, ${tier.color}, ${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, border: `2px solid rgba(5,5,16,1)` }}>{tier.icon}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>Cameron Williamson</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>@camwill</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{tier.icon} {tier.name}</span>
                <span style={{ fontSize: 10, color: C.text3 }}>Lv {userLevel}</span>
              </div>
              {/* XP bar */}
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.text3, marginBottom: 2 }}>
                  <span>XP {xp.toLocaleString()}</span>
                  <span>{nextTier ? nextTier.name : 'MAX'}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${xpProgress}%`, borderRadius: 4, background: `linear-gradient(90deg, ${tier.color}, ${C.cyan})`, transition: 'width 0.5s ease', boxShadow: `0 0 10px ${tier.color}40` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Coins / Streak / Streak */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { l: 'Coins', v: coins.toLocaleString(), icon: '🪙', c: C.gold },
              { l: 'Best Streak', v: bestWinStreak, icon: '🏆', c: C.cyan },
              { l: 'Daily', v: `🔥${dailyStreak}`, icon: '', c: C.orange },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: `${s.c}06`, border: `1px solid ${s.c}10` }}>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 7, color: C.text3, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TABS.map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center', background: tab === t ? `linear-gradient(135deg, ${C.pink}, ${C.purple})` : 'rgba(255,255,255,0.04)', color: tab === t ? '#fff' : C.text3, border: `1px solid ${tab === t ? C.pink + '50' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.3s' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div>
            {/* Tier progress */}
            <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3, marginBottom: 12 }}>TIER PROGRESS</div>
              <div style={{ display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'center' }}>
                {LOYALTY_TIERS.map((t, i) => (
                  <div key={i} style={{ textAlign: 'center', opacity: t.xpReq <= xp ? 1 : 0.3, flex: 1 }}>
                    <div style={{ fontSize: 24, filter: t.xpReq <= xp && (!LOYALTY_TIERS[i + 1] || LOYALTY_TIERS[i + 1].xpReq > xp) ? `drop-shadow(0 0 10px ${t.color})` : 'none' }}>{t.icon}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: t.color, marginTop: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 7, color: C.text3 }}>{t.mult}x</div>
                  </div>
                ))}
              </div>
              {nextTier && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: `${nextTier.color}06`, border: `1px solid ${nextTier.color}15`, fontSize: 11, color: C.text2 }}>
                  Next: <strong style={{ color: nextTier.color }}>{nextTier.name}</strong> — {Math.max(0, nextTier.xpReq - xp).toLocaleString()} XP to go
                </div>
              )}
            </div>

            {/* Daily check-in */}
            <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3 }}>DAILY CHECK-IN</div>
                <div style={{ fontSize: 11, color: C.orange, fontWeight: 800 }}>🔥 {dailyStreak} streak</div>
              </div>
              <div onClick={handleCheckIn} style={{ padding: '12px 0', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: dailyCheckedIn ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${C.green}20, ${C.cyan}10)`, border: `1px solid ${dailyCheckedIn ? 'rgba(255,255,255,0.06)' : C.green + '40'}`, fontSize: 14, fontWeight: 800, color: dailyCheckedIn ? C.text3 : C.green }}>
                {dailyCheckedIn ? '✓ Checked In Today' : `Check In — +${50 + dailyStreak * 10} coins`}
              </div>
            </div>

            {/* Daily challenges */}
            <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3, marginBottom: 10 }}>DAILY CHALLENGES</div>
              {(DAILY_CHALLENGES || []).slice(0, 3).map((ch, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontSize: 20 }}>{ch.icon || '🎯'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{ch.name || ch.title}</div>
                    <div style={{ fontSize: 9, color: C.text3 }}>{ch.desc}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>+{ch.reward || ch.coins || 100}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges tab */}
        {tab === 'badges' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {(LOYALTY_BADGES || []).map((badge, i) => {
                const owned = earnedBadges.includes(badge.id);
                return (
                  <div key={i} style={{ padding: '14px 10px', borderRadius: 16, textAlign: 'center', background: owned ? `${C.gold}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${owned ? C.gold + '30' : 'rgba(255,255,255,0.06)'}`, opacity: owned ? 1 : 0.5 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{badge.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: owned ? C.gold : C.text3 }}>{badge.name}</div>
                    <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{badge.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shop tab */}
        {tab === 'shop' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(SHOP_ITEMS || []).map((item, i) => {
                const owned = ownedItems.includes(item.id);
                return (
                  <div key={i} style={{ padding: '14px 12px', borderRadius: 16, background: `${item.color || C.purple}06`, border: `1px solid ${item.color || C.purple}15` }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{item.name}</div>
                    <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{item.desc}</div>
                    {owned ? (
                      <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: C.green }}>✓ Owned</div>
                    ) : (
                      <div onClick={() => { if (coins < (item.price || 500)) { notify('Not enough coins!', C.red); return; } setCoins(c => c - (item.price || 500)); setOwnedItems(p => [...p, item.id]); playFx('coin_collect'); notify(`${item.name} unlocked!`, C.gold); }} style={{ marginTop: 8, padding: '6px 0', borderRadius: 8, textAlign: 'center', cursor: 'pointer', background: `${item.color || C.purple}12`, border: `1px solid ${item.color || C.purple}25`, fontSize: 10, fontWeight: 700, color: item.color || C.purple }}>
                        Buy — {(item.price || 500).toLocaleString()} 🪙
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div>
            <div style={{ ...GLASS_CARD, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.text3, marginBottom: 12 }}>SETTINGS</div>
              {[
                { label: 'Sound Effects', value: audioOn, toggle: () => setAudioOn(v => !v) },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1, fontSize: 13, color: C.text }}>{s.label}</div>
                  <div onClick={s.toggle} style={{ width: 44, height: 24, borderRadius: 12, background: s.value ? C.cyan : 'rgba(255,255,255,0.08)', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: s.value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ flex: 1, fontSize: 13, color: C.text }}>Cali Clear Device</div>
                <div onClick={() => setShowBlePopup(true)} style={{ fontSize: 11, fontWeight: 700, color: bleConnected ? C.green : C.orange, cursor: 'pointer', padding: '4px 12px', borderRadius: 8, background: bleConnected ? `${C.green}10` : `${C.orange}10`, border: `1px solid ${bleConnected ? C.green : C.orange}25` }}>
                  {bleConnected ? '✓ Connected' : 'Connect'}
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 0', textAlign: 'center', cursor: 'pointer', color: C.text3, fontSize: 12 }} onClick={() => notify('Version 3.0.0 — Mood Lab Arena', C.text3)}>
                Version 3.0.0
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
