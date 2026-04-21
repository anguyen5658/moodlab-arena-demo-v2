// Convenience hook: returns all 5 contexts in one call.
// Used by game hooks and components that need cross-context access.
import { useAudioContext } from '../context/AudioContext'
import { useBLEContext } from '../context/BLEContext'
import { useGameContext } from '../context/GameContext'
import { usePlayerContext } from '../context/PlayerContext'
import { useUIContext } from '../context/UIContext'

export const useGame = () => ({
  audio: useAudioContext(),
  ble: useBLEContext(),
  game: useGameContext(),
  player: usePlayerContext(),
  ui: useUIContext(),
})
