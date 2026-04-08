# Mood Lab Arena V3 — Project Context

> **This file is auto-loaded by Claude Code.** It gives teammates full context without re-explaining anything.

## What This Is
Social gaming platform for cannabis consumers. **Cali Clear puff device** is the game controller (via BLE). 36 games across 6 zones. **FIFA World Cup 2026 partnership demo.**

- **Live:** https://moodlab-v3-build.vercel.app
- **Repo:** github.com:anguyen5658/moodlab-arena-demo-v2
- **Docs:** `/Users/ta/Desktop/MoodLab-Arena-Docs/Guide - Updated/` (11 .docx + 29 .html)

## Architecture
- **Single JSX file:** `/tmp/moodlab-v3-build/moodlab-arena-v7.jsx` (~26,000 lines)
- **No build step:** React 18 + Babel standalone in-browser transform
- **Index:** `/tmp/moodlab-v3-build/index.html` (CDN: React 18, Three.js, Babel)
- **Deploy:** Vercel (project: moodlab-v3-build)
- **Inline styles only** — no CSS files, glass-morphism dark theme

## CRITICAL RULES — READ BEFORE EDITING

### Rule 1: NEVER Remove Hooks
React counts hooks in order. Removing ANY useState/useRef/useEffect/useCallback causes `Too many re-renders` crash (React #301). If duplicates found, rename with `_dup_` prefix — NEVER delete.

### Rule 2: Add New Hooks ONLY After Line ~2273
After the `bleDevicesRef = useRef([])` line. Never add hooks inside conditionals or loops.

### Rule 3: TDZ Protection for BLE Handlers
BLE handlers at ~line 9460 reference functions defined later. Always use lazy arrow wrappers: `down = () => func()` NOT `down = func`.

### Rule 4: Canvas Animation Loops — Restart on Every Render
```javascript
// CORRECT — restarts with fresh state closures:
if(xxxAnimRef.current) cancelAnimationFrame(xxxAnimRef.current);
{const loop=()=>{xxxDrawCanvas();xxxAnimRef.current=requestAnimationFrame(loop);};
xxxAnimRef.current=requestAnimationFrame(loop);}

// WRONG — captures stale state forever:
if(!xxxAnimRef.current){ const loop=()=>{...}; ... }
```

### Rule 5: Touch Events on Hold Buttons
All PUFF/BLINKER hold-to-release buttons MUST have:
- `onTouchStart` with `e.stopPropagation(); e.preventDefault();`
- `onTouchEnd` for release
- `onTouchCancel` as safety net (same handler as onTouchEnd)
- `style={{touchAction:"none"}}` on the element

### Rule 6: Git Push BEFORE Vercel Deploy (ALWAYS)
```bash
# 1. Copy files to repo
cp /tmp/moodlab-v3-build/moodlab-arena-v7.jsx "/Users/ta/Desktop/Claude Git/Claude Git/moodlab-arena-v7.jsx"
cp /tmp/moodlab-v3-build/index.html "/Users/ta/Desktop/Claude Git/Claude Git/index.html"

# 2. Commit and push
cd "/Users/ta/Desktop/Claude Git/Claude Git"
git add moodlab-arena-v7.jsx index.html
git commit -m "description here

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main

# 3. THEN deploy
export PATH="/Users/ta/.nvm/versions/node/v20.20.2/bin:$PATH"
cd /tmp/moodlab-v3-build
npx vercel --prod --yes
```

### Rule 7: Babel Test Before EVERY Deploy
```bash
export PATH="/Users/ta/.nvm/versions/node/v20.20.2/bin:$PATH"
cd /tmp/moodlab-v3-build
node -e "const b=require('@babel/core');try{b.transformSync(require('fs').readFileSync('moodlab-arena-v7.jsx','utf8').replace(/import.*from.*react.*/,'const{useState,useRef,useEffect,useCallback}=React;').replace(/export default function/,'function'),{presets:['@babel/preset-react']});console.log('BABEL OK')}catch(e){console.log('ERR line:'+e.loc?.line+' col:'+e.loc?.column);console.log(e.message.substring(0,400))}"
```

### Rule 8: Sound Cleanup
`cleanupAllGames()` (~line 13597) must cancel ALL animation frames and intervals. Missing ones cause sound leaks after exiting games.

## Key Systems

### Three-Input System
| Input | How | Bonus |
|-------|-----|-------|
| TAP | On-screen button | +0% |
| PUFF | Dry puff or real hold | +5% |
| BLINKER | 5s+ real puff | +20% |

### Puff Streak
Real puff only builds streak. x5 cap (+10% max). Dry holds streak. Tap breaks streak.

### BLE Protocol
- Service UUID: `0000ffe0-0000-1000-8000-00805f9b34fb`
- PUFF_START: `[0xb4, 0xb4, 0x02, 0x00, 0x04, 0x4b]`
- PUFF_STOP: `[0xb4, 0xb5, 0x02, 0x00, 0x05, 0x4b]`

### Multi-Device BLE (Up to 4 Cali Clear devices on one phone)
- `bleDevices` state: `[{slot, name, deviceName, connected}]`
- `bleDevicesRef` ref: `[{slot, device, characteristic, puffTimeout, down, up}]`
- `connectBleSlot(slotIndex)` / `disconnectBleSlot(slotIndex)`
- Slot 0 = backward compatible with existing `btPuffDown`/`btPuffUp`
- Device Hub popup: 4 color-coded slots (P1=Cyan, P2=Blue, P3=Gold, P4=Pink)

### Multiplayer State
- `mpActive` state: true during Friends multiplayer game
- `ssPlayerCount` state: 2, 3, or 4
- `partyPlayerNames` state: `["You","Friend 1","Friend 2","Friend 3"]`
- Human players in games: `{isHuman:true, deviceSlot:N}` alongside existing `{isYou:true}` for P1

### Chat Overlay
`renderGameChatOverlay(controlsSlot)` — live-stream style shared across all games. Controls slot renders ALWAYS regardless of chat toggle. Toggle via chat icon button.

### Game Config
`GAME_CONFIG[gameId]` — modes[], puffGame, stats[], hotStats[], htp[], reward, solo, fortunePlay[]

## File Structure (within the JSX monolith)
| Lines | Content |
|-------|---------|
| 1-250 | Constants, colors (C object), GAMES array |
| 250-900 | GAME_CONFIG for all 36 games |
| 900-2270 | useState/useRef declarations (~870 hooks) |
| 2270-3300 | Derived values, helper functions |
| 3300-16000 | Game engines (start functions, logic, canvas draw) |
| 16000-25000 | Render blocks (game UIs, overlays, controls) |
| 25000+ | Main app return (tabs, hub, lobby, modals) |

## 6 Hub Zones
| Zone | Color | Games |
|------|-------|-------|
| Arcade | Cyan #00E5FF | 18 action games |
| Stage | Gold #FFD93D | 6 live show games |
| Fortune | Purple #C084FC | 12 luck/prediction games |
| Wall | Orange #FB923C | Leaderboards |
| World Cup | Gold | FIFA 2026 tournament |
| Live | Green #22C55E | Streams, spectating |

## Multi-Device Multiplayer — COMPLETE (All 4 Phases Done)

### All Phases:
- Phase 1: Multi-BLE Device Hub (4 slots, connect/disconnect per slot)
- Phase 2: Player count selection ("Play With Friends" → 2P/3P/4P)
- Phase 3: All 10 games adapted for multiplayer
- Phase 4: Device indicator dots in all 16 headers, disconnect notifications, cleanup

### 10 Multiplayer Games (ALL DONE):
| Game | Multi-Device Type | Routing |
|------|-------------------|---------|
| Puff Derby | Simultaneous — all puff at once | Each device boosts one horse |
| Hot Potato | Turn-based — bomb holder's device | Only holder's slot fires |
| Balloon Pop | Turn-based — active player's device | Only active slot fires |
| Russian Roulette | Turn-based — dodge charger's device | Only active slot fires |
| Tug of War | Simultaneous teams — 2v2 | Slots 0,1=left; 2,3=right |
| Wild West Duel | 1v1 reaction — first puff wins | Both devices race on DRAW |
| Puff Clock | Simultaneous — all hold for target | Independent per-slot timing |
| Puff Limbo | Simultaneous — endurance elimination | Dead slots get null handlers |
| Fish War | Real-time — each device = one fish | Each slot boosts one fish |
| Puff RPS | 1v1 — puff duration = choice | P2: short=rock, med=paper, long=scissors |

### MP State (no new hooks — uses window objects):
- `window._duelP2` — Wild West Duel P2 reaction tracking
- `window._pcMp` — Puff Clock per-slot holding/results
- `window._plMp` — Puff Limbo per-slot alive/submitted
- `window._fwMp` — Fish War per-slot boost state
- `window._rpsP2` — Puff RPS P2 choice/power tracking
- All cleaned up in `cleanupAllGames()`

### Multiplayer Puff Routing (in the IIFE at ~line 9460):
- **Simultaneous games:** All device slots active at once, each routes to different player
- **Turn-based games:** Only active player's device slot fires, others get null handlers
- **1v1 games:** Both devices active, different roles per slot

## Past Bug Fixes (for reference)
- **React #301:** Caused by removing duplicate hooks. Fix: never remove, rename with `_dup_`
- **Stale canvas closures:** Draw loops captured state at startup. Fix: restart loop every render
- **Touch release stuck:** onTouchEnd not firing on mobile. Fix: add onTouchCancel + preventDefault
- **Sound leaks:** 7 animation frames not cancelled in cleanupAllGames. Fix: added all missing cancellations
- **Puff Derby double pick UI:** Canvas AND HTML both drew pick buttons. Fix: canvas returns early with just title during pick phase
