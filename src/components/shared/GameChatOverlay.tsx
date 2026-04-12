import React, { useRef, useEffect, useState } from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { useAudioContext } from '../../context/AudioContext'
import { useUIContext } from '../../context/UIContext'
import { useGameChat } from '../../hooks/useGameChat'

interface GameChatOverlayProps {
  /** Game-specific controls (TAP/PUFF/BLINKER buttons, puff bar, etc.) rendered above the chat */
  controlsSlot?: React.ReactNode
}

const REACTIONS = ['😂', '👏', '😱', '🔥', '💀', '😘', '👋', '💨']

/**
 * Shared bottom-docked chat overlay used by every game overlay.
 * Renders the game-specific controlsSlot above a collapsible emoji/chat frame.
 *
 * Reuses state from GameContext: gameChatMsgs, gameChatOpen, gameChatInput.
 * Drives bot chat via useGameChat hook.
 */
export const GameChatOverlay: React.FC<GameChatOverlayProps> = ({ controlsSlot }) => {
  const { gameActive, gameChatMsgs, setGameChatMsgs, gameChatOpen, setGameChatOpen, gameChatInput, setGameChatInput } = useGameContext()
  const audio = useAudioContext()
  const ui = useUIContext()
  useGameChat()

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [showAllChat, setShowAllChat] = useState(false)

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [gameChatMsgs.length])

  if (!gameActive) return null

  const sendReaction = (emoji: string) => {
    audio.playFx('tap')
    setGameChatMsgs(prev => [...prev.slice(-19), { u: 'You', m: emoji, c: C.cyan, t: Date.now(), isYou: true }])
    ui.setFloatingReactions(prev => [
      ...prev.slice(-9),
      { id: Date.now() + Math.random(), emoji, x: 20 + Math.random() * 60, dur: 1.5 + Math.random() },
    ])
    if (emoji === '😂') audio.playFx('laugh')
  }

  const sendText = () => {
    const t = gameChatInput.trim()
    if (!t) return
    setGameChatMsgs(prev => [...prev.slice(-19), { u: 'You', m: t, c: C.cyan, t: Date.now(), isYou: true }])
    setGameChatInput('')
  }

  const recentMsgs = showAllChat ? gameChatMsgs.slice(-10) : gameChatMsgs.slice(-3)

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 150,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Controls slot — game-specific UI docked above the chat frame */}
      {controlsSlot && (
        <div style={{ pointerEvents: 'auto', padding: '0 0 6px 0' }}>
          {controlsSlot}
        </div>
      )}

      {/* Chat frame (collapsible) */}
      <div style={{
        pointerEvents: 'auto',
        background: gameChatOpen
          ? 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.15) 85%, transparent 100%)'
          : 'none',
        padding: '0 10px 6px',
      }}>
        {/* Emoji reaction bar + audio toggle + expand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            padding: '4px 0',
          }}
        >
          {REACTIONS.map((e, i) => (
            <div
              key={i}
              onClick={() => sendReaction(e)}
              onTouchStart={(ev) => { ev.stopPropagation(); ev.preventDefault(); sendReaction(e) }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              {e}
            </div>
          ))}
          <div
            onClick={() => { audio.playFx('tap'); setGameChatOpen(!gameChatOpen) }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              background: gameChatOpen ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${gameChatOpen ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              marginLeft: 4,
              color: gameChatOpen ? C.cyan : C.text3,
              fontWeight: 900,
              touchAction: 'none',
            }}
            title={gameChatOpen ? 'Hide chat' : 'Show chat'}
          >
            {gameChatOpen ? '▾' : '💬'}
          </div>
        </div>

        {/* Chat content */}
        {gameChatOpen && (
          <div
            style={{
              padding: '4px 0 4px',
              maxHeight: showAllChat ? 180 : 96,
              transition: 'max-height 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
              onClick={() => setShowAllChat(s => !s)}
            >
              {recentMsgs.length === 0 && (
                <div style={{ fontSize: 9, color: C.text3, fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                  Tap an emoji to react 💨
                </div>
              )}
              {recentMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'baseline', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: m.c || C.cyan, flexShrink: 0 }}>{m.u}</span>
                  <span style={{ fontSize: 10, color: m.isYou ? C.cyan : C.text2, wordBreak: 'break-word' }}>{m.m}</span>
                </div>
              ))}
            </div>

            {/* Text input row */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendText() }}
              style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}
            >
              <input
                value={gameChatInput}
                onChange={(e) => setGameChatInput(e.target.value)}
                placeholder="Say something…"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 11,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: '1px solid rgba(0,229,255,0.3)',
                  background: 'rgba(0,229,255,0.12)',
                  color: C.cyan,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
              >
                ›
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
