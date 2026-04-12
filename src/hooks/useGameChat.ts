import { useEffect, useRef } from 'react'
import { C, SPECTATOR_NAMES } from '../constants'
import { useGameContext } from '../context/GameContext'

// Simulated audience chat messages for in-game dock.
// Mirrors the legacy monolith's audience chat loop (seeded every 4-7s while a game is active).
const CHAT_POOL = [
  'Go go go! 🔥', 'This is intense!', 'LOL 😂', 'No way! 💀',
  'The crowd is going wild!', 'Puff harder! 💨', 'What a play!',
  'I predicted this! 🔮', 'Chat is exploding rn 🤯', 'W contestant! 👑',
  'GG 😎', 'Nice shot! 🔥', 'Lucky! 🍀', 'F 🫡', 'Ouch! 😭', 'Ez 😈',
  'Absolute sniper precision', 'The tension is REAL', 'Drop it already!',
  'My hands are shaking', 'Wait for itttt', "I can't breathe!",
  'THIS is what legends are made of...', 'Puff reactions loading 💨',
]

const BOT_COLORS = [C.cyan, C.pink, C.gold, C.purple, C.orange, C.green, C.lime, C.red]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/**
 * Bot chat generator — drips simulated audience messages into `gameChatMsgs`
 * at a random cadence while a game is active. Mounted once inside `GameChatOverlay`
 * so every game gets the same treatment without per-game wiring.
 */
export const useGameChat = () => {
  const { gameActive, setGameChatMsgs } = useGameContext()
  const activeIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!gameActive?.id) { activeIdRef.current = null; return }
    activeIdRef.current = gameActive.id

    // Reset chat on game switch
    setGameChatMsgs([])

    let timer: ReturnType<typeof setTimeout> | null = null
    const tick = () => {
      if (activeIdRef.current !== gameActive.id) return
      const u = pick(SPECTATOR_NAMES)
      const m = pick(CHAT_POOL)
      const c = pick(BOT_COLORS)
      setGameChatMsgs(prev => [...prev.slice(-19), { u, m, c, t: Date.now() }])
      timer = setTimeout(tick, 3500 + Math.random() * 3500)
    }
    // Seed first message quickly so the user sees chat activity within a couple of seconds
    timer = setTimeout(tick, 900 + Math.random() * 1200)

    return () => {
      if (timer) clearTimeout(timer)
      activeIdRef.current = null
    }
  }, [gameActive?.id, setGameChatMsgs])
}
