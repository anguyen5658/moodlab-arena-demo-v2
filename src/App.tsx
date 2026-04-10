import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AudioProvider } from './context/AudioContext'
import { BLEProvider } from './context/BLEContext'
import { GameProvider } from './context/GameContext'
import { PlayerProvider } from './context/PlayerContext'
import { UIProvider } from './context/UIContext'
import { AppShell } from './components/layout/AppShell'
import { ArenaHub } from './routes/arena/ArenaHub'
import { ArcadeZone } from './routes/arena/ArcadeZone'
import { StageZone } from './routes/arena/StageZone'
import { OracleZone } from './routes/arena/OracleZone'
import { WallZone } from './routes/arena/WallZone'
import { WorldCupZone } from './routes/arena/WorldCupZone'
import { ZoneIntro } from './routes/arena/ZoneIntro'
import { ControlTab } from './routes/control/ControlTab'
import { LiveTab } from './routes/live/LiveTab'
import { MeTab } from './routes/me/MeTab'

export default function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <PlayerProvider>
          <BLEProvider>
            <GameProvider>
              <UIProvider>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/arena" replace />} />
                    <Route path="/arena" element={<ArenaHub />} />
                    <Route path="/arena/arcade/intro" element={<ZoneIntro zoneKey="arcade" />} />
                    <Route path="/arena/stage/intro" element={<ZoneIntro zoneKey="stage" />} />
                    <Route path="/arena/oracle/intro" element={<ZoneIntro zoneKey="oracle" />} />
                    <Route path="/arena/wall/intro" element={<ZoneIntro zoneKey="wall" />} />
                    <Route path="/arena/worldcup/intro" element={<ZoneIntro zoneKey="worldcup" />} />
                    <Route path="/arena/arcade" element={<ArcadeZone />} />
                    <Route path="/arena/stage" element={<StageZone />} />
                    <Route path="/arena/oracle" element={<OracleZone />} />
                    <Route path="/arena/wall" element={<WallZone />} />
                    <Route path="/arena/worldcup" element={<WorldCupZone />} />
                    <Route path="/control" element={<ControlTab />} />
                    <Route path="/live" element={<LiveTab />} />
                    <Route path="/me" element={<MeTab />} />
                    {/* <Route path="*" element={<Navigate to="/arena" replace />} /> */}
                  </Routes>
                </AppShell>
              </UIProvider>
            </GameProvider>
          </BLEProvider>
        </PlayerProvider>
      </AudioProvider>
    </BrowserRouter>
  )
}
