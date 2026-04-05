import { useNavigate } from 'react-router'
import { C, GLASS_CARD, LG } from '@/constants'
import { useArena } from '@/context/ArenaContext'
import type { GameDefinition } from '@/types'

interface GameDetailSheetProps {
  game: GameDefinition & { route?: string }
  onClose: () => void
  /** base route prefix, e.g. "/arcade", "/stage", "/fortune" — ignored if game.route is set */
  zoneRoute: string
}

const MATCH_MODES = [
  { icon: '🎲', label: 'Random',  m: 'random', sub: '~5s wait',   reward: '+80' },
  { icon: '🤖', label: 'VS AI',   m: 'ai',     sub: 'Instant',    reward: '+50' },
  { icon: '👥', label: 'Friend',  m: 'invite',  sub: 'Via link',   reward: '+80' },
]

const STAGE_ROLES = [
  { icon: '🎯', label: 'Contestant', role: 'contestant', sub: 'Step into the spotlight and play!', color: C.gold },
  { icon: '👥', label: 'Audience',   role: 'audience',   sub: 'Watch, react, and cheer!',          color: C.text2 },
]

const TOURNAMENT_DATA = {
  finalkick:  { name: 'FK1 World Cup 2026',       emoji: '⚽',  prizes: ['50,000', '25,000', '10,000', '5,000'] },
  finalkick2: { name: 'FK2 Precision Cup 2026',   emoji: '⚽🔥', prizes: ['30,000', '15,000', '7,500', '2,500'] },
  finalkick3: { name: 'FK3 3D Championship 2026', emoji: '⚽🌐', prizes: ['40,000', '20,000', '8,000', '3,000'] },
  wildwest:   { name: 'Outlaw Circuit',            emoji: '🤠',  prizes: ['25,000', '10,000', '5,000', '2,000'] },
  tugofwar:   { name: 'Dojo Championship',         emoji: '💪',  prizes: ['15,000', '7,500', '3,000', '1,000'] },
  puffpong:   { name: 'Pong Masters',              emoji: '🏓',  prizes: ['10,000', '5,000', '2,500', '1,000'] },
}

const HOW_TO_PLAY: Record<string, { steps: { icon: string; label: string; sub: string; color: string }[]; tip: string }> = {
  finalkick: {
    steps: [
      { icon: '👆', label: 'Pick Zone',    sub: 'Choose where to kick',           color: C.cyan   },
      { icon: '💨', label: 'PUFF!',         sub: 'Hold & release in sweet spot',   color: C.lime   },
      { icon: '⚽', label: 'Goal or Miss?', sub: 'Only perfect puffs score!',      color: C.gold   },
      { icon: '🧤', label: 'Save Phase',    sub: 'Block the AI\'s shot',           color: C.orange },
      { icon: '🔄', label: 'Repeat × 5',   sub: '5 rounds total',                 color: C.purple },
    ],
    tip: 'Perfect puff zone = most power. Blinker = auto-miss!',
  },
  wildwest: {
    steps: [
      { icon: '🤠', label: 'Face Off',    sub: 'You vs opponent, pistols drawn', color: C.gold   },
      { icon: '👁', label: 'Wait for DRAW', sub: 'Don\'t jump the gun!',          color: C.orange },
      { icon: '💨', label: 'Puff FAST',   sub: 'First puff wins the round',      color: C.red    },
      { icon: '🔄', label: 'Best of 5',   sub: 'First to 3 wins the duel',       color: C.cyan   },
    ],
    tip: 'Average reaction time is 250ms. Can you beat it?',
  },
  hotpotato: {
    steps: [
      { icon: '💣', label: 'Receive Bomb', sub: 'Bomb lands on a random player', color: C.orange },
      { icon: '💨', label: 'Puff to Pass', sub: 'Short puff = pass it along',    color: C.cyan   },
      { icon: '💥', label: 'Avoid the Pop', sub: 'Don\'t hold it when it blows!', color: C.red   },
      { icon: '🔄', label: 'Last Standing', sub: 'Survive all other players',     color: C.green  },
    ],
    tip: 'The bomb timer gets shorter every round!',
  },
  puffpong: {
    steps: [
      { icon: '🏓', label: 'Serve',      sub: 'Ball launches automatically',   color: C.cyan   },
      { icon: '💨', label: 'Puff to Hit', sub: 'Puff when ball reaches you',    color: C.green  },
      { icon: '🎯', label: 'Aim',        sub: 'Puff direction = ball direction', color: C.gold  },
      { icon: '🔢', label: '5 Points',   sub: 'First to 5 wins the match',      color: C.purple },
    ],
    tip: 'Short puff = drop shot. Long puff = smash!',
  },
  tugofwar: {
    steps: [
      { icon: '🪢', label: 'Grab Rope',  sub: 'You vs AI on opposite ends',    color: C.blue   },
      { icon: '💨', label: 'Keep Puffing', sub: 'Continuous puffs = power',    color: C.cyan   },
      { icon: '💪', label: 'Pull Hard',  sub: 'Cross the center line to win',   color: C.orange },
    ],
    tip: 'Rhythm puffing beats random tapping every time.',
  },
  balloon: {
    steps: [
      { icon: '🎈', label: 'Shared Balloon', sub: 'Everyone puffs the same one', color: C.pink  },
      { icon: '💨', label: 'Add Air',    sub: 'Hold to puff, longer = more air',  color: C.cyan  },
      { icon: '💥', label: 'Don\'t Pop', sub: 'Pop it and you\'re eliminated',    color: C.red   },
      { icon: '🏆', label: 'Last Standing', sub: 'Survive all pops',              color: C.gold  },
    ],
    tip: 'Small puffs in later rounds are the safest strategy.',
  },
  rhythm: {
    steps: [
      { icon: '🎵', label: 'Notes Fall',  sub: '4 lanes of notes drop down',   color: C.purple },
      { icon: '💨', label: 'Hit the Lane', sub: 'Tap/puff the matching lane',   color: C.pink   },
      { icon: '🎯', label: 'Hit Zone',    sub: 'Tap when note reaches the bar', color: C.gold   },
      { icon: '🔥', label: 'Build Combo', sub: 'Combo multiplies your score',   color: C.orange },
    ],
    tip: 'Blinker puffs = score multiplier bonus!',
  },
  beatdrop: {
    steps: [
      { icon: '🎧', label: 'Feel the Beat', sub: 'Listen for the rhythm cue',  color: C.pink   },
      { icon: '💨', label: 'Hold Puff',     sub: 'Start holding before drop',   color: C.cyan   },
      { icon: '🎯', label: 'Release on Drop', sub: 'Let go exactly on the beat', color: C.gold  },
      { icon: '⭐', label: 'Precision Score', sub: 'Closer to beat = more pts',  color: C.purple },
    ],
    tip: 'Early release scores less than a late one.',
  },
  puffclock: {
    steps: [
      { icon: '⏱️', label: 'See Target',  sub: 'Target time shown (e.g. 2.5s)', color: C.orange },
      { icon: '💨', label: 'Hold Puff',   sub: 'Hold for exactly that long',     color: C.cyan   },
      { icon: '🎯', label: 'Release',     sub: 'Stop as close to target as you can', color: C.gold },
      { icon: '🏆', label: 'Closest Wins', sub: 'Tightest margin wins the round', color: C.green },
    ],
    tip: 'Close eyes and count beats. Works surprisingly well!',
  },
  pufflimbo: {
    steps: [
      { icon: '🎪', label: 'Limbo Bar',   sub: 'Bar starts high, gets lower',    color: C.orange },
      { icon: '💨', label: 'Puff Under',  sub: 'Puff duration must fit the bar', color: C.cyan   },
      { icon: '📈', label: 'Each Round',  sub: 'Target gets smaller',             color: C.red    },
      { icon: '👑', label: 'Survive All', sub: 'Last player standing wins',       color: C.gold   },
    ],
    tip: 'The bar eventually reaches Blinker level. Survive it!',
  },
  hooked: {
    steps: [
      { icon: '🎣', label: 'Cast Line',   sub: 'Line drops, fish bites',         color: C.blue   },
      { icon: '💨', label: 'Reel In',     sub: 'Puff to pull the fish up',       color: C.cyan   },
      { icon: '⚠️', label: 'Watch Tension', sub: 'Line snaps if too tight',      color: C.orange },
      { icon: '🏆', label: 'Catch Stack', sub: 'Stack fish to build your score', color: C.gold   },
    ],
    tip: 'Legendary fish are worth 6x a common catch!',
  },
  rps: {
    steps: [
      { icon: '✊', label: 'Face Off',    sub: 'Rock Paper Scissors format',    color: C.purple },
      { icon: '💨', label: 'Puff Power', sub: 'Longer puff = stronger move',    color: C.cyan   },
      { icon: '🎯', label: 'Choose Move', sub: 'Short=Rock · Med=Paper · Long=Scissors', color: C.gold },
      { icon: '🔄', label: 'Best of 5',  sub: 'First to 3 wins',               color: C.green  },
    ],
    tip: 'AI adapts to your patterns after round 2!',
  },
  puffderby: {
    steps: [
      { icon: '🏇', label: 'Pick Horse', sub: 'Choose 1 of 6 horses to back',   color: C.green  },
      { icon: '💨', label: 'Spam Puff',  sub: 'Your puffs boost your horse',    color: C.cyan   },
      { icon: '🏁', label: 'Race!',      sub: 'First to finish line wins',       color: C.gold   },
      { icon: '🏆', label: 'Win Coins', sub: 'More puffs = better odds',         color: C.orange },
    ],
    tip: 'Switching horses mid-race costs 2 seconds!',
  },
  vibecheck: {
    steps: [
      { icon: '🎤', label: 'Host Asks',   sub: 'MC reads a trivia question',    color: C.gold   },
      { icon: '💨', label: 'Puff Answer', sub: 'Duration = your answer choice', color: C.cyan   },
      { icon: '👥', label: 'Audience Votes', sub: 'Cheers boost your chances',  color: C.purple },
      { icon: '🏆', label: 'Top Score',   sub: 'Most correct answers wins',     color: C.green  },
    ],
    tip: 'Wrong answer early? Use blinker to steal points!',
  },
  survivaltrivia: {
    steps: [
      { icon: '❓', label: 'Question',   sub: 'Trivia question appears',        color: C.purple },
      { icon: '💨', label: 'Puff Answer', sub: 'Puff duration = answer',        color: C.cyan   },
      { icon: '💀', label: 'Wrong = Out', sub: 'One mistake and you\'re gone',  color: C.red    },
      { icon: '👑', label: 'Last Standing', sub: 'Survive all rounds to win',   color: C.gold   },
    ],
    tip: 'Don\'t rush — take the full time if you\'re unsure.',
  },
}

export default function GameDetailSheet({ game, onClose, zoneRoute }: GameDetailSheetProps) {
  const navigate = useNavigate()
  const { playFx } = useArena()

  const gc = game.color
  const tourney = TOURNAMENT_DATA[game.id as keyof typeof TOURNAMENT_DATA]
  const howTo = HOW_TO_PLAY[game.id]
  const isLive = !!game.live
  const gamePath = game.route ?? `${zoneRoute}/${game.id}`

  const startGame = (mode: string) => {
    playFx('select')
    if (mode === 'invite') {
      // Show a toast/notify — no real invite in demo
      playFx('notification')
    }
    navigate(gamePath)
  }

  const startLiveRole = (_role: string) => {
    playFx('select')
    navigate(gamePath)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      />

      {/* Sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '28px 28px 0 0',
        background: `linear-gradient(180deg, ${gc}08 0%, #070718 60%)`,
        border: `1px solid ${gc}20`,
        boxShadow: `0 -8px 40px rgba(0,0,0,0.6), 0 0 60px ${gc}08`,
        animation: 'panelSlideUp 0.35s ease both',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        <div style={{ padding: '4px 18px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 32, marginBottom: 8,
              background: `radial-gradient(circle, ${gc}20, ${gc}06)`,
              border: `2px solid ${gc}30`,
              boxShadow: `0 0 24px ${gc}20`,
            }}>
              {game.emoji}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, textShadow: `0 0 20px ${gc}30`, marginBottom: 3 }}>
              {game.name}
            </div>
            <div style={{ fontSize: 10, color: C.text2, marginBottom: 8, textAlign: 'center', lineHeight: 1.45, maxWidth: 280 }}>
              {game.desc}
            </div>
            {/* Pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: gc, padding: '3px 8px', borderRadius: 20, background: `${gc}10`, border: `1px solid ${gc}20` }}>{game.type}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.text2, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)` }}>👥 {game.players}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.text2, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)` }}>⏱ {game.time}</span>
              {game.hot && <span style={{ fontSize: 8, fontWeight: 800, color: C.red, padding: '3px 8px', borderRadius: 20, background: `${C.red}12`, border: `1px solid ${C.red}25`, animation: 'pulse 2s infinite' }}>🔥 HOT</span>}
              {game.live && <span style={{ fontSize: 8, fontWeight: 800, color: C.green, padding: '3px 8px', borderRadius: 20, background: `${C.green}12`, border: `1px solid ${C.green}25` }}>📡 LIVE</span>}
            </div>
          </div>

          {/* STAGE: Role selection */}
          {isLive ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 2, textAlign: 'center', marginBottom: 8 }}>CHOOSE YOUR ROLE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STAGE_ROLES.map(r => (
                  <div
                    key={r.role}
                    onClick={() => startLiveRole(r.role)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: r.role === 'contestant' ? `linear-gradient(135deg, ${C.gold}14, ${C.gold}06)` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${r.role === 'contestant' ? C.gold + '30' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: r.role === 'contestant' ? C.gold : C.text2 }}>{r.label}</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{r.sub}</div>
                    </div>
                    <span style={{ fontSize: 14, color: `${r.role === 'contestant' ? C.gold : C.text3}80` }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ARCADE / FORTUNE: Quick Play */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.text2, letterSpacing: 1.5, marginBottom: 8 }}>⚡ QUICK PLAY</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {MATCH_MODES.map(b => (
                    <div
                      key={b.m}
                      onClick={() => startGame(b.m)}
                      style={{
                        flex: 1, padding: '12px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                        ...GLASS_CARD, transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: C.text }}>{b.label}</div>
                      <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>{b.sub}</div>
                      <div style={{ fontSize: 7, color: C.green, fontWeight: 700, marginTop: 2 }}>{b.reward}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament (if applicable) */}
              {tourney && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 8 }}>🏆 TOURNAMENT</div>
                  <div style={{
                    padding: '14px', borderRadius: 16, cursor: 'pointer',
                    background: 'rgba(8,8,25,0.82)', border: `1px solid ${C.gold}25`,
                    boxShadow: `0 0 30px ${C.gold}08, inset 0 1px 0 ${C.gold}10`,
                    position: 'relative', overflow: 'hidden',
                  }} onClick={() => { playFx('select'); navigate(gamePath) }}>
                    {/* Shimmer */}
                    <div style={{ position: 'absolute', top: 0, left: '-50%', width: '200%', height: '100%', background: `linear-gradient(90deg, transparent, ${C.gold}05, transparent)`, animation: 'tickerScroll 4s infinite', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{tourney.emoji}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: C.gold, textShadow: `0 0 10px ${C.gold}30` }}>{tourney.name}</div>
                          <div style={{ fontSize: 8, color: C.text2 }}>48 Teams · Group Stage + Knockout</div>
                        </div>
                      </div>
                      {/* Prizes */}
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {['🥇', '🥈', '🥉', '4th'].map((medal, i) => (
                          <div key={i} style={{ padding: '3px 8px', borderRadius: 8, background: `${[C.gold, '#C0C0C0', '#CD7F32', C.text3][i]}10`, border: `1px solid ${[C.gold, '#C0C0C0', '#CD7F32', C.text3][i]}20`, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: 10 }}>{medal}</span>
                            <span style={{ fontSize: 7, fontWeight: 700, color: [C.gold, '#C0C0C0', '#CD7F32', C.text3][i] }}>{tourney.prizes[i]}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        padding: '10px 0', borderRadius: 10, textAlign: 'center',
                        background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`,
                        border: `1px solid ${C.gold}35`, boxShadow: `0 0 20px ${C.gold}10`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 1 }}>ENTER TOURNAMENT</div>
                        <div style={{ fontSize: 7, color: C.text3, marginTop: 2 }}>Choose your nation and compete for glory</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* How to Play */}
          {howTo && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: 1.5, marginBottom: 8 }}>📖 HOW TO PLAY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                {howTo.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: s.color }}>{s.label}</div>
                      <div style={{ fontSize: 7, color: C.text3 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 10, background: `${C.gold}08`, border: `1px solid ${C.gold}15` }}>
                <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>💡 Pro tip: </span>
                <span style={{ fontSize: 9, color: C.text2 }}>{howTo.tip}</span>
              </div>
            </div>
          )}

          {/* Close */}
          <div
            onClick={onClose}
            style={{ marginTop: 16, padding: '12px 0', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text3 }}>✕ Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
