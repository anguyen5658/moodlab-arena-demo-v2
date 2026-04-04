I’ll map the current monolith into a concrete migration blueprint first, focusing on zones, per-game boundaries, and shared systems so the plan preserves logic exactly. Next I’ll identify route/component splits and risk points (global state, BLE, audio, Three.js) before drafting a full step-by-step plan.

Map zones and games

Map shared core systems

Searched for regex `useState|useRef|useEffect|useCallback` (`demo-arena` · `moodlab-arena-v6.jsx`), 100 results

Searched for regex `const coins|const xp|global currency|progression` (`demo-arena` · `moodlab-arena-v6.jsx`), 9 results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/Doc/BLE-Implementation.md#1-1), lines 1 to 200

Searched for regex `btPuffDown|btPuffUp|btPuff|BLE_|connectBle|disconnectBle` (`demo-arena` · `moodlab-arena-v6.jsx`), 48 results

Searched for regex `synthOscillator|playSound|audioContext|Web Audio|beep` (`demo-arena` · `moodlab-arena-v6.jsx`), 8 results

Searched for regex `THREE\.|WebGLRenderer|useEffect.*Three|three\.js|scene|camera|renderer` (`demo-arena` · `moodlab-arena-v6.jsx`), 80 results

Search complete: Find top-level tab navigation and render branching

Searched for files matching `**/*.{js,jsx,ts,tsx}`, 1 match

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#1-1), lines 1 to 200

Searched for regex `arena|live|me`, 200 results

Searched for regex `playFx|sharedAudioCtx|synthOscillator|audioCtx` (`demo-arena` · `moodlab-arena-v6.jsx`), 60 results

Searched for regex `liveSpectators|crowdEnergy|floatingReactions|liveFloating` (`demo-arena` · `moodlab-arena-v6.jsx`), 36 results

Searched for regex `puffEventHoldDown|puffEventHoldUp|puffEvent|puffMeter` (`demo-arena` · `moodlab-arena-v6.jsx`), 40 results

Search complete: Find zone-based render branching logic

Searched for regex `arcade|stage|oracle|wall|worldcup`, 200 results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#6200-6200), lines 6200 to 6600

Searched for regex `setCoins|setXp|awardCoins|awardXp|calcReward` (`demo-arena` · `moodlab-arena-v6.jsx`), 47 results

Searched for regex `spawnConfetti|spawnSmoke|triggerFlash|triggerShake|triggerGlow` (`demo-arena` · `moodlab-arena-v6.jsx`), 50 results

Searched for regex `notify|setNotification|notification|toast|alert` (`demo-arena` · `moodlab-arena-v6.jsx`), 50 results

Searched for text `renderArenaView`, no results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#6400-6400), lines 6400 to 7500

Searched for regex `const pick|const getCoinMultiplier|showFloatingReward|recordGameResult|utilit|helper` (`demo-arena` · `moodlab-arena-v6.jsx`), 50 results

Searched for regex `const C =|confettiParticles|smokeParticles|particleAnimations` (`demo-arena` · `moodlab-arena-v6.jsx`), 40 results

Searched for regex `screenFlash|screenShake|dimLights|puffWave` (`demo-arena` · `moodlab-arena-v6.jsx`), 40 results

Search complete: Find complete list of games organized by zone

Searched for files matching `**/games.ts`, no matches

Searched for files matching `**/games.js`, no matches

Searched for files matching `**/games.json`, no matches

Searched for files matching `**/zones.ts`, no matches

Searched for files matching `**/config.ts`, no matches

Searched codebase for "game cards list definitions games per zone", no results

Searched for regex `getCoinMultiplier|showFloatingReward|recordGameResult|const [a-z]+\s*=\s*useCallback` (`demo-arena` · `moodlab-arena-v6.jsx`), 40 results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#22171-22171), lines 22171 to 22280

Searched for regex `gameId|gameName|zoneId|zoneName`, 83 results

Search complete: Find state hooks and game phase patterns

Searched for files matching `**/*.tsx`, no matches

Searched for regex `const getCoinMultiplier|getCurrentTier|LOYALTY_TIERS` (`demo-arena` · `moodlab-arena-v6.jsx`), 20 results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#1-1), lines 1 to 200

Searched for files matching `**/*.js`, no matches

Searched for files matching `**/*`, 48 matches

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#1-1), lines 1 to 200

Searched codebase for "useState isIntro isPlaying isResult phase logic playing state setup", no results

Searched for regex `const \[.*phase.*\]|const \[.*Intro.*\]|const \[.*Active.*\]` (`**/moodlab-arena-v6.jsx`), 20 results

Searched for text `PLAY_GAMES|arcadeGames|stageGames|oracleGames` (`**/moodlab-arena-v6.jsx`), 20 results

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#256-256), lines 256 to 320

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#1080-1080), lines 1080 to 1200

Read [](file:///Users/hieu/Workspace/twa/lab/demo-arena/moodlab-arena-v6.jsx#1200-1200), lines 1200 to 1450

Searched for text `const render render` (`**/moodlab-arena-v6.jsx`), no results

Searched for regex `const (render|show|display|draw|paint).*=.*\(\)` (`**/moodlab-arena-v6.jsx`), 30 results

Created memory file [](file:///Users/hieu/Library/Application%20Support/Code/User/workspaceStorage/acdff5f8dbdf96181d51adde527499e9/GitHub.copilot-chat/memory-tool/memories/repo/arena-codebase-map.md)

I have the exploration reports and I’m reading them now to turn findings into a migration plan with exact route/component boundaries.

Read [](file:///Users/hieu/Library/Application%20Support/Code/User/workspaceStorage/acdff5f8dbdf96181d51adde527499e9/GitHub.copilot-chat/chat-session-resources/384ca49f-584a-4965-afad-28ded4604c3e/call_WMGnpAWkdQ5ZrOuZBoUqp4CM__vscode-1775289138750/content.txt#1-1), lines 1 to 260

Read [](file:///Users/hieu/Library/Application%20Support/Code/User/workspaceStorage/acdff5f8dbdf96181d51adde527499e9/GitHub.copilot-chat/chat-session-resources/384ca49f-584a-4965-afad-28ded4604c3e/call_4D4xbCs1H2pl5lZMCuxQWkDd__vscode-1775289138751/content.txt#1-1), lines 1 to 320

Discovery is complete: I now have a full map of zones, game IDs, and all shared systems (coins/xp, puff/BLE wiring, spectator/audios, Three.js) that must be preserved during migration. I need a few scope decisions from you before I finalize the implementation plan, so the routing and module boundaries match exactly what you want.

Analyzing your answers...

I’ve got your decisions and will now produce a concrete execution plan for Tabs + Zones routing, all games, Context+reducer state, inline-style carryover, and BLE parity. I’ll save it in session memory and then show the full scannable plan here for your approval.

Read memory

Read memory

Before finalizing the plan, I’m checking existing repository memory notes so the migration plan aligns with previously captured codebase facts.

Read memory [](file:///Users/hieu/Library/Application%20Support/Code/User/workspaceStorage/acdff5f8dbdf96181d51adde527499e9/GitHub.copilot-chat/memory-tool/memories/repo/arena-codebase-map.md)

Created memory file [](file:///Users/hieu/Library/Application%20Support/Code/User/workspaceStorage/acdff5f8dbdf96181d51adde527499e9/GitHub.copilot-chat/memory-tool/memories/Mzg0Y2E0OWYtNTg0YS00OTY1LWFmYWQtMjhkZWQ0NjA0YzNl/plan.md)

## Plan: Migrate Arena Monolith to Vite TS

Migrate the current monolith into a Vite + React + TypeScript + React Router 7 app with behavior parity first, then modular cleanup. The safest approach is staged extraction: app shell and routing, then shared systems, then per-zone and per-game migration while preserving phase/state logic exactly.

**Steps**

1. Phase 1: Foundation
1. Bootstrap a Vite React TypeScript project shape and add React Router 7.
1. Define route tree for tabs + zones:
1. Tabs: /arena, /live, /me.
1. Arena child routes: /arena/hub, /arena/arcade, /arena/stage, /arena/oracle, /arena/wall, /arena/worldcup.
1. Build a persistent app shell (global overlays, nav, HUD) so route swaps do not break shared systems.

1. Phase 2: State Model (Context + reducer)
1. Design a typed global state model mirroring current behavior groups:
1. Navigation and selected game lifecycle.
1. Coins/XP/tiers/rewards.
1. BLE connection and active puff handlers.
1. Spectator ticker/reactions/crowd energy.
1. Notifications, overlays, and shared UI toggles.
1. Implement typed actions/selectors that preserve current transition semantics before moving game code.

1. Phase 3: Shared Systems Extraction
1. Extract reusable shared components:
1. Zone/game cards and headers.
1. HUD panels, toasts, reward popups.
1. Shared puff control UI and spectator overlays.
1. Extract reusable hooks/services:
1. Puff timing/classification logic.
1. Audio FX synthesis logic.
1. BLE manager with stale-closure-safe handler refs.
1. Reward progression and tier multiplier logic.
1. Crowd/spectator lifecycle and cleanup intervals.
1. Isolate Final Kick 3D into a dedicated Three.js lifecycle wrapper (mount/update/unmount parity).

1. Phase 4: Route + Zone Migration
1. Port top-level tab pages first (Arena, Live, Me) to stabilize shell behavior.
1. Port each Arena zone route (hub, arcade, stage, oracle, wall, worldcup) with existing entry flow and metadata intact.
1. Move game catalog arrays into typed configuration modules, keeping original game IDs unchanged for BLE/state compatibility.

1. Phase 5: Per-game Component Migration (All games)
1. Create one component per game and migrate its hooks/refs/effects/phase machine as-is.
1. Keep minimal logic refactor during first pass; prioritize parity over cleanup.
1. Use zone-level game routers that map selected game ID to component.
1. Rewire BLE start/stop handlers from active game components into shared BLE refs for identical physical puff behavior.

1. Phase 6: Parity Hardening
1. Validate reward parity: coin/xp updates, tier multipliers, device-connected multiplier, badge/challenge triggers.
1. Validate spectator/crowd parity: reaction spawns, energy eruptions, ticker cleanup.
1. Keep inline styles during migration and only consolidate safe duplicates after parity checks.

1. Phase 7: Verification
1. Automated:
1. Typecheck + lint.
1. Route smoke tests for tabs and zone routes.
1. Reducer tests for navigation/game activation/reward/BLE transitions.
1. Hook tests for puff timing and reward multipliers.
1. Manual:
1. Launch every game and verify intro/playing/result transitions match current behavior.
1. BLE connect/disconnect + puff start/stop on representative hold and tap games.
1. Final Kick 3D mount/unmount and renderer cleanup (no leaked canvas/RAF/timers).

**Relevant files**

- moodlab-arena-v6.jsx
- CLAUDE.md
- BLE-Implementation.md
- index.html
- package.json

**Decisions captured**

1. Routing includes tabs and zones.
2. All games are in scope now.
3. Keep inline styles initially.
4. Keep Web Bluetooth behavior intact with browser guards.
5. Use Context + reducer.

Plan persisted to /memories/session/plan.md and ready for handoff approval.
