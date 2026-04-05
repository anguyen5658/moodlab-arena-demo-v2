import { Outlet } from 'react-router'
import { Suspense } from 'react'
import { ArenaProvider } from '@/context/ArenaContext'
import { NavBar } from '@/components/NavBar'
import { CoinHeader } from '@/components/CoinHeader'
import { useArena } from '@/context/ArenaContext'
import { C } from '@/constants'

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>💨</div>
      <div style={{ fontSize: 12, color: C.text3 }}>Loading...</div>
    </div>
  )
}

function AppShell() {
  const { btPuffActive, bleConnected, deviceActivated, connectBle, playFx } = useArena()
  return (
    <div style={{
      width: '100%', height: '100%',
      background: C.bg, position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <CoinHeader />

      {/* Connect warning bar — fixed just below CoinHeader */}
      {!bleConnected && (
        <div
          onClick={() => { playFx('tap'); connectBle() }}
          style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430, zIndex: 99,
            padding: '6px 14px', cursor: 'pointer',
            background: deviceActivated
              ? `linear-gradient(90deg, ${C.orange}15, ${C.gold}10)`
              : `linear-gradient(90deg, ${C.red}12, ${C.orange}08)`,
            borderBottom: `1px solid ${deviceActivated ? C.orange : C.red}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: deviceActivated ? C.orange : C.red, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: deviceActivated ? C.orange : C.red }}>
            {deviceActivated ? 'Connect for Full Experience & Rewards' : 'Connect Device to Activate Arena'}
          </span>
          <span style={{ fontSize: 9, color: C.text3 }}>Tap to pair 💨</span>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', marginTop: bleConnected ? 70 : 100 }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </div>
      <NavBar />

      {/* BLE puff top-glow — lights up when device is heating */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 220,
        pointerEvents: 'none', zIndex: 250,
        background: 'linear-gradient(180deg, rgba(0,229,255,0.55) 0%, rgba(192,132,252,0.30) 35%, rgba(255,77,141,0.15) 65%, transparent 100%)',
        opacity: btPuffActive ? 1 : 0,
        transition: btPuffActive ? 'opacity 0.18s ease-out' : 'opacity 0.6s ease-in',
        animation: btPuffActive ? 'btPuffGlow 1.4s ease-in-out infinite alternate' : 'none',
        filter: 'blur(1px)',
      }} />
    </div>
  )
}

export default function App() {
  return (
    <ArenaProvider>
      <AppShell />
    </ArenaProvider>
  )
}
