import React, { useState } from 'react'
import { C } from '../../constants'
import { useGameContext } from '../../context/GameContext'
import { useAudioContext } from '../../context/AudioContext'
import { usePlayerContext } from '../../context/PlayerContext'
import { useGameRouteSync } from '../../hooks/useGameRouteSync'
import { ZoneHeader } from './ZoneHeader'

const FORTUNE_GAMES = [
  // Sportsbook
  { id: "crystalball", name: "Fortune Teller", emoji: "🔮", type: "Predict", color: C.purple, desc: "Yes or No? Puff your prediction!", cat: "sportsbook" },
  { id: "strainbattle", name: "Strain Battle", emoji: "🌿", type: "Predict", color: C.green, desc: "Which strain wins? Vote by puff!", cat: "sportsbook" },
  { id: "matchpredictor", name: "Match Predictor", emoji: "📊", type: "Predict", color: C.blue, desc: "Predict WC match results!", cat: "sportsbook" },
  { id: "dailypicks", name: "Daily Bets", emoji: "📅", type: "Streak", color: C.orange, desc: "3 bets per day. Build your streak!", cat: "sportsbook" },
  // Luck
  { id: "spinwin", name: "Spin & Win", emoji: "🎡", type: "Luck", color: C.pink, desc: "Spin the wheel! Puff = spin force!", cat: "luck" },
  { id: "puffslots", name: "Puff Slots", emoji: "🎰", type: "Luck", color: C.gold, desc: "3 reels. Puff to spin. Blinker = bonus!", cat: "luck" },
  { id: "coinflip", name: "Coin Flip", emoji: "🪙", type: "50/50", color: C.gold, desc: "Puff confidence = bet multiplier!", cat: "luck" },
  // Table
  { id: "puffblackjack", name: "Puff Blackjack", emoji: "🃏", type: "Cards", color: C.green, desc: "Short = Hit. Long = Stand. Beat 21!", cat: "table" },
  { id: "highcard", name: "High Card Puff", emoji: "🎴", type: "Cards", color: C.red, desc: "Is yours higher? Puff to bet!", cat: "table" },
  { id: "crapsnclouds", name: "Craps & Clouds", emoji: "🎲", type: "Dice", color: C.cyan, desc: "Puff duration = dice roll!", cat: "table" },
  // Mystery
  { id: "mysterybox", name: "Mystery Box", emoji: "🎁", type: "Discovery", color: C.gold, desc: "3 boxes. Pick one. Puff to reveal!", cat: "mystery" },
  { id: "scratchpuff", name: "Scratch & Puff", emoji: "🎫", type: "Discovery", color: C.pink, desc: "6 areas. Puff to scratch. Match 3 wins!", cat: "mystery" },
  { id: "fortunecookie", name: "Fortune Cookie", emoji: "🥠", type: "Fortune", color: C.orange, desc: "Crack it open! Wisdom + coins inside!", cat: "mystery" },
  { id: "treasuremap", name: "Treasure Map", emoji: "🗺️", type: "Adventure", color: C.gold, desc: "16 tiles. Find 3 treasures. Avoid bombs!", cat: "mystery" },
]

const fortuneFeedItems = [
  "🔮 CloudChaser predicted Brazil correctly!",
  "🎰 PuffQueen hit JACKPOT on Slots! +1,000",
  "🌿 Gorilla Glue won Strain Battle 52%-48%",
  "🪙 Coin Flip streak: THC_Tony at 7 in a row!",
  "🃏 BlinkerBetty hit Blackjack! Natural 21!",
]

const RECENT_ACTIVITY = [
  { game: "Fortune Teller", result: "Won", emoji: "🔮", coins: "+50", time: "2m ago", color: C.green },
  { game: "Puff Slots", result: "Bust", emoji: "🎰", coins: "-20", time: "8m ago", color: C.red },
  { game: "Coin Flip", result: "Won 3x", emoji: "🪙", coins: "+150", time: "15m ago", color: C.gold },
  { game: "Strain Battle", result: "Voted", emoji: "🌿", coins: "+10", time: "22m ago", color: C.green },
  { game: "Blackjack", result: "21!", emoji: "🃏", coins: "+200", time: "30m ago", color: C.gold },
  { game: "Mystery Box", result: "Rare!", emoji: "🎁", coins: "+300", time: "45m ago", color: C.purple },
]

const TABS = [
  { id: "sportsbook", label: "Sportsbook", emoji: "🔮", header: "SPORTSBOOK", sub: "Predictions & Bets" },
  { id: "luck", label: "Luck", emoji: "🎰", header: "LUCK GAMES", sub: "Spin to win" },
  { id: "table", label: "Table", emoji: "🃏", header: "TABLE GAMES", sub: "Test your skill" },
  { id: "mystery", label: "Mystery", emoji: "✨", header: "MYSTERY GAMES", sub: "Discover your fortune" },
  { id: "recent", label: "Recent", emoji: "📜", header: "RECENT ACTIVITY", sub: "" },
]

type FortuneGame = typeof FORTUNE_GAMES[0]

const GameCard: React.FC<{ g: { id: string; name: string; emoji: string; color: string; desc: string }; i: number; onClick: () => void }> = ({ g, i, onClick }) => (
  <div onClick={onClick} style={{ padding: "14px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse at 50% 0%, ${g.color}10, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${g.color}18`, transition: "all 0.3s", animation: `fadeIn 0.3s ease ${i * 0.06}s both`, touchAction: "none" }}>
    <div style={{ fontSize: 28, marginBottom: 4, filter: `drop-shadow(0 0 8px ${g.color}50)` }}>{g.emoji}</div>
    <div style={{ fontSize: 11, fontWeight: 800, color: g.color }}>{g.name}</div>
    <div style={{ fontSize: 7, color: C.text3, marginTop: 1 }}>{g.desc}</div>
    <div style={{ fontSize: 7, fontWeight: 700, color: C.lime, marginTop: 3 }}>PLAY NOW</div>
  </div>
)

export const FortuneZone: React.FC = () => {
  const game = useGameContext()
  const audio = useAudioContext()
  const player = usePlayerContext()
  const [tab, setTab] = useState("sportsbook")
  useGameRouteSync('fortune', FORTUNE_GAMES)

  const slideIdx = Math.floor(game.tick / 4) % 4
  const fortuneFeedIdx = Math.floor(game.tick / 3) % fortuneFeedItems.length
  const featGame = FORTUNE_GAMES[Math.floor(game.tick / 16) % FORTUNE_GAMES.length]

  const heroSlides = [
    { emoji: "🏆", title: `Daily Jackpot: ${game.fortuneJackpot.toLocaleString()}`, sub: "Play any game to grow the pot!", color: C.gold, badge: "LIVE" },
    { emoji: featGame.emoji, title: featGame.name, sub: featGame.desc, color: featGame.color, badge: "PLAY" },
    { emoji: "🍀", title: game.fortuneLuckyHour ? "LUCKY HOUR LIVE!" : "Lucky Hour", sub: game.fortuneLuckyHour ? "2x ALL WINS right now!" : "Coming soon...", color: C.lime, badge: game.fortuneLuckyHour ? "2x" : "" },
    { emoji: "🔮", title: "Fortune Teller", sub: "15 yes/no predictions. Blinker = 3x risk!", color: C.purple, badge: "HOT" },
  ]
  const slide = heroSlides[slideIdx]

  const launchGame = (g: { id: string; name: string; emoji: string; color: string; desc: string; type: string }) => {
    audio.playFx("select")
    game.setSelectedGame({ id: g.id, name: g.name, emoji: g.emoji, color: g.color, desc: g.desc, type: g.type })
  }

  const launchLuckyPuff = () => {
    audio.playFx("select")
    player.notify("Lucky Puff coming soon!", C.lime)
  }

  const tabGames = FORTUNE_GAMES.filter(g => g.cat === tab)
  const activeTab = TABS.find(t => t.id === tab) || TABS[0]

  return (
    <div style={{ position: "relative" }}>
      {/* Gold particles bg */}
      {[...Array(14)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${(i * 13 + 5) % 100}%`, top: `${(i * 27 + 8) % 450}px`, width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: "50%", background: i % 3 === 0 ? C.gold : i % 3 === 1 ? C.green : C.red, opacity: 0.15, animation: `pulse ${2 + (i % 3)}s infinite ${i * 0.25}s`, pointerEvents: "none", zIndex: 0 }} />
      ))}
      <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 320, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}14, transparent 70%)`, pointerEvents: "none" }} />

      <ZoneHeader zoneKey="fortune" />

      {/* Hero slider */}
      <div onClick={() => { if (slide.badge === "PLAY") launchGame(featGame); else if (slide.badge === "HOT") launchGame(FORTUNE_GAMES[0]) }} style={{ padding: "0 14px", marginBottom: 10, cursor: "pointer", touchAction: "none" }}>
        <div style={{ padding: "14px 16px", borderRadius: 16, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${slide.color}12, ${slide.color}04)`, border: `1px solid ${slide.color}20` }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: `radial-gradient(circle at 80% 50%, ${slide.color}15, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${slide.color}60)` }}>{slide.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{slide.title}</div>
                {slide.badge && <span style={{ fontSize: 6, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: slide.badge === "LIVE" || slide.badge === "HOT" ? `${C.red}18` : `${C.green}12`, color: slide.badge === "LIVE" || slide.badge === "HOT" ? C.red : C.green, border: `1px solid ${slide.badge === "LIVE" || slide.badge === "HOT" ? C.red : C.green}25` }}>{slide.badge}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{slide.sub}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
            {heroSlides.map((_, i) => (
              <div key={i} style={{ width: i === slideIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === slideIdx ? slide.color : `${C.text3}30`, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Jackpot banner */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}10, ${C.red}08)`, border: `1px solid ${C.gold}18` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.text3, letterSpacing: 2 }}>DAILY JACKPOT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, textShadow: `0 0 16px ${C.gold}40` }}>🏆 {game.fortuneJackpot.toLocaleString()} coins</div>
          <div style={{ fontSize: 7, color: C.text3 }}>Play any game for a chance to win</div>
        </div>
      </div>

      {/* Lucky hour */}
      {game.fortuneLuckyHour && (
        <div style={{ padding: "0 14px", marginBottom: 8 }}>
          <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}14, ${C.orange}10)`, border: `1px solid ${C.gold}30`, animation: "pulse 1.5s infinite" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: C.gold, letterSpacing: 1.5 }}>LUCKY HOUR LIVE! 2x ALL WINS!</div>
            <div style={{ fontSize: 7, color: C.orange, fontWeight: 700, marginTop: 2 }}>47 min left</div>
          </div>
        </div>
      )}

      {/* Feed bar */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: `${C.gold}06`, border: `1px solid ${C.gold}10` }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fortuneFeedItems[fortuneFeedIdx]}</span>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "284", l: "Bets Made", c: C.gold }, { v: "62%", l: "Win Rate", c: C.green }, { v: "🔥5", l: "Streak", c: C.orange }, { v: Math.floor(game.fortuneJackpot / 1000) + "K", l: "Jackpot Pool", c: C.red }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", background: `${s.c}06`, border: `1px solid ${s.c}12` }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 6, color: C.text3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Bets compact strip */}
      <div style={{ padding: "0 14px", marginBottom: 10 }}>
        <div onClick={() => launchGame(FORTUNE_GAMES.find(g => g.id === "dailypicks") as FortuneGame)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, cursor: "pointer", background: `${C.gold}04`, border: `1px solid ${C.gold}12`, touchAction: "none" }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>3 DAILY BETS</span>
            <span style={{ fontSize: 8, color: C.text3, marginLeft: 6 }}>🌅 🌤 🌙</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: C.green, padding: "2px 8px", borderRadius: 100, background: `${C.green}10`, border: `1px solid ${C.green}20` }}>🔥 5-day · 2x</span>
        </div>
      </div>

      <div style={{ padding: "0 14px", position: "relative", zIndex: 1 }}>
        {/* Tab bar — underline style, full width */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.gold}18`, marginBottom: 10 }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", textAlign: "center", cursor: "pointer", fontSize: 9, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? C.gold : C.text3, borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent", touchAction: "none" }}>
              <span style={{ marginRight: 3 }}>{t.emoji}</span>{t.label}
            </div>
          ))}
        </div>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>{activeTab.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: tab === "recent" ? C.gold : C.text, letterSpacing: 1.5 }}>{activeTab.header}</span>
          {activeTab.sub && <span style={{ fontSize: 7, color: C.text3, marginLeft: "auto" }}>{activeTab.sub}</span>}
        </div>

        {/* Game grid */}
        {tab !== "recent" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {tabGames.map((g, i) => (
              <GameCard key={g.id} g={g} i={i} onClick={() => launchGame(g)} />
            ))}
            {tab === "luck" && (
              <GameCard g={{ id: "luckypuff", name: "Lucky Puff", emoji: "🍀", color: C.green, desc: "Feeling lucky? Puff for prizes!" }} i={tabGames.length} onClick={launchLuckyPuff} />
            )}
          </div>
        )}

        {/* Recent activity */}
        {tab === "recent" && (
          <div style={{ marginBottom: 14 }}>
            {RECENT_ACTIVITY.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, marginBottom: 4, background: `${r.color}04`, border: `1px solid ${r.color}10` }}>
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{r.game}</div>
                  <div style={{ fontSize: 8, color: C.text3 }}>{r.result} · {r.time}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: r.color }}>{r.coins}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  )
}
