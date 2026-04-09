import { useNavigate } from 'react-router-dom';
import { C, Z, GLASS_CARD } from '../constants/colors.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * ZoneHeader — top bar shown on zone index pages.
 *
 * Row 1: "Powered by MOOD LAB"  |  BLE pill · Coins
 * Row 2: ← back  |  zone icon + title  |  optional right slot
 *
 * Props:
 *   zoneKey  — 'arcade' | 'stage' | 'oracle' | 'wall' | 'worldcup'
 *   title    — override zone name (optional)
 *   backTo   — navigate target on back (defaults to '/')
 *   right    — optional JSX for right side of row 2
 */
export default function ZoneHeader({ zoneKey, title, backTo = '/', right }) {
  const navigate = useNavigate();
  const { playFx, coins, bleConnected, setShowBlePopup } = useApp();
  const zone = zoneKey ? Z[zoneKey] : null;
  const primary = zone?.primary ?? C.cyan;
  const displayTitle = title ?? zone?.name ?? '';

  const handleBack = () => {
    playFx('back');
    navigate(backTo);
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      ...GLASS_CARD,
      borderBottom: `1px solid ${primary}20`,
    }}>
      {/* ── Row 1: Brand + BLE + Coins ── */}
      <div style={{ padding: '6px 14px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
            Powered by <span style={{ fontWeight: 900, letterSpacing: 2 }}>MOOD LAB</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div
            onClick={() => { playFx('tap'); setShowBlePopup(true); }}
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

      {/* ── Row 2: Back + zone title + right ── */}
      <div style={{ padding: '4px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleBack}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.text, fontSize: 14, flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {zone?.icon && (
            <div style={{ fontSize: 10, color: primary, fontWeight: 700, letterSpacing: 1, marginBottom: 1 }}>
              {zone.icon} {zone.sub}
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {displayTitle}
          </div>
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </div>
  );
}
