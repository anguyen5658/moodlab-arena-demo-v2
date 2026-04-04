import { Outlet } from 'react-router'
import { Suspense } from 'react'
import { ArenaProvider } from '@/context/ArenaContext'
import { NavBar } from '@/components/NavBar'
import { CoinHeader } from '@/components/CoinHeader'
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

export default function App() {
  return (
    <ArenaProvider>
      <div style={{
        width: '100%', height: '100%',
        background: C.bg, position: 'relative',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <CoinHeader />
        <div style={{ flex: 1, overflow: 'hidden', marginTop: 48 }}>
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </div>
        <NavBar />
      </div>
    </ArenaProvider>
  )
}
