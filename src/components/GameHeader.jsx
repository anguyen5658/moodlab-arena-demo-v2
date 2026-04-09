import { useNavigate } from 'react-router-dom';
import { C } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * GameHeader — the persistent 2-3 row header used on every game screen.
 *
 * Row 1 (always):  "Powered by MOOD LAB"   |   BLE pill · Coins
 * Row 2 (always):  ← backLabel  |  mid (game title/score/etc)  |  badge (optional)
 * Row 3 (optional): any content passed via `row3` prop
 *
 * Props:
 *   backTo     — string path OR callback function for the ← button
 *   backLabel  — label next to ← (default "Back")
 *   accent     — border-bottom color (default C.cyan)
 *   mid        — JSX for center of Row 2
 *   badge      — JSX for right end of Row 2 (e.g. streak pill)
 *   row3       — JSX for optional Row 3
 */
export default function GameHeader({
  backTo,
  backLabel = 'Back',
  accent = C.cyan,
  mid,
  badge,
  row3,
}) {
  const navigate = useNavigate();
  const { playFx, coins, bleConnected, setShowBlePopup } = useApp();

  const handleBack = () => {
    playFx('tap');
    if (typeof backTo === 'function') backTo();
    else navigate(backTo ?? -1);
  };

  return (
    <div style={{
      position: 'relative', zIndex: 50, flexShrink: 0,
      background: 'rgba(6,16,30,0.98)',
      borderBottom: `1px solid ${accent}15`,
    }}>
      {/* ── Row 1: Brand + BLE + Coins ── */}
      <div style={{ padding: '6px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
            Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* BLE status pill */}
          <div
            data-btn="true"
            onClick={(e) => { e.stopPropagation(); playFx('tap'); setShowBlePopup(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 100, cursor: 'pointer',
              background: bleConnected ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)',
              border: `1px solid ${bleConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}`,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: bleConnected ? C.green : C.orange }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: bleConnected ? C.green : C.orange }}>
              {bleConnected ? 'Puff' : 'Connect'}
            </span>
          </div>
          {/* Coins */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '2px 7px', borderRadius: 100,
            background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.12)',
          }}>
            <span style={{ fontSize: 9 }}>🪙</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, fontFamily: "'Courier New',monospace" }}>
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Back + mid + badge ── */}
      <div style={{ padding: '2px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          data-back="true"
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            cursor: 'pointer', padding: '3px 8px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, color: C.text2 }}>←</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: C.text2 }}>{backLabel}</span>
        </div>
        {mid && <div style={{ flex: 1, minWidth: 0 }}>{mid}</div>}
        {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
      </div>

      {/* ── Row 3 (optional) ── */}
      {row3 && <div style={{ padding: '0 12px 4px' }}>{row3}</div>}
    </div>
  );
}
