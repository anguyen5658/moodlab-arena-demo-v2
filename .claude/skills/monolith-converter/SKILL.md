---
name: monolith-converter
description: Converts a React monolith (single JSX/JS file with all components, state, and logic) into a proper Vite + React + TypeScript project with React Router, hooks, context, and per-component files. Use when the user asks to split, migrate, or refactor a monolith React app.
user-invocable: true
allowed-tools: Read Glob Grep Bash Write Edit
argument-hint: [path-to-monolith.jsx]
---

You are converting a React monolith at `$ARGUMENTS` into a proper Vite + React + TypeScript project. Follow the phases below in order. Work incrementally — verify the app boots after each phase before continuing.

---

## Phase 0 — Audit the monolith

Read the monolith file and extract this inventory before writing any code:

1. **Navigation model** — how does the app navigate? State machine (`tab`/`zone`/`active` vars)? Hash router? Custom history?
2. **Global state** — list every `useState`/`useRef` at the top-level component. Group by domain (currency, auth, BLE/device, UI, etc.)
3. **Constants** — color tokens, config objects, game/item lists, lookup tables
4. **Hooks** — any reusable logic (audio, BLE/device, animations, timers)
5. **Shared components** — repeated render blocks (headers, cards, action bars, overlays)
6. **Screens/zones** — top-level conditional branches that act as "pages"
7. **Sub-components / games** — nested render blocks inside each zone
8. **Assets** — image/audio/video references and their path patterns
9. **3rd party libs** — CDN scripts that need npm equivalents
10. **CSS** — `@keyframes`, global resets (usually inline `<style>` or scattered)

Present this as a structured summary before proceeding.

---

## Phase 1 — Scaffold

```bash
npm create vite@latest <project-name> -- --template react-ts
cd <project-name>
npm install react-router
# add any other npm equivalents for CDN libs found in Phase 0
```

Set up `vite.config.ts` with path aliases:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

Add matching `paths` in `tsconfig.json`:
```json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
```

Move `assets/` to `public/assets/` (Vite serves `public/` at root — no import needed, URL paths stay the same).

Create `src/main.tsx` rendering a placeholder. Verify `npm run dev` boots cleanly.

---

## Phase 2 — Constants & Types

Extract from the monolith in this order (no logic, pure data):

**`src/constants/theme.ts`** — color palette (`C`), glass-morphism presets, design tokens  
**`src/constants/arena.ts`** (or domain-specific name) — zone/screen metadata, image/video maps  
**`src/constants/config.ts`** — tiers, rewards, difficulty levels, shop items, badges, challenges  
**`src/constants/games.ts`** (or equivalent) — item/game/content lists per zone  
**`src/constants/ble.ts`** (if applicable) — device UUIDs, packet bytes  
**`src/constants/index.ts`** — barrel re-export  
**`src/types/index.ts`** — all TypeScript interfaces and union types  

---

## Phase 3 — Global CSS

Extract into `src/styles/globals.css`:
- All `@keyframes` animations
- Global resets: `* { box-sizing: border-box; user-select: none; -webkit-tap-highlight-color: transparent }`
- Scrollbar hiding, input resets, `#root` sizing

Import in `src/main.tsx`.

---

## Phase 4 — Hooks

Extract pure logic hooks. Common ones to look for:

**`src/hooks/useAudio.ts`** — `playFx(type)`, `playAudio(src, vol)`. Note which types use real audio files vs synthesized tones (Web Audio API). Guard end-game file sounds with a `useRef` flag to prevent double-fire.

**`src/hooks/useDevice.ts`** (BLE/hardware) — connect, disconnect, register puff/input handlers. The BLE listener is registered once at connect; game handlers are stored in `useRef`s to avoid stale closures. Pattern:
```ts
const registerHandlers = useCallback((down, up) => {
  handlerDown.current = down
  handlerUp.current = up
}, [])
```

**`src/hooks/usePuffMeter.ts`** or equivalent — any universal input state + sweet spot logic

---

## Phase 5 — Shared Components

Extract in dependency order (no component should import one defined later):

1. Primitive overlays (`FloatingReward`, `AchievementPopup`, toasts)
2. Header/footer shells (`CoinHeader`/score bar, `NavBar`)
3. Zone/screen header (`ZoneHeader` — back button + branding)
4. Content cards (`GameCard`, `ItemCard`, etc.)
5. Shared action UI (`PuffActionBar`, `HoldButton`, etc.)

Keep all inline styles — converting them to CSS classes is risky during extraction. Only move `@keyframes` to globals.css.

---

## Phase 6 — Global Context

Create `src/context/AppContext.tsx` (or domain-specific name):
- Wire hooks from Phase 4 into a single Provider
- Expose `useApp()` / `useArena()` hook
- Render overlay components (from Phase 5) once inside the Provider, above all routes
- `awardGame()`, `getCoinMultiplier()`, `claimDaily()`, etc. belong here

Split `App.tsx` into:
- `App` — just `<Provider><AppShell /></Provider>`
- `AppShell` — calls `useContext`, renders shared chrome (header, nav, connect bars, overlays)

This is required because `AppShell` needs context but `App` renders the Provider.

---

## Phase 7 — Router + Zone Stubs

Create `src/router/index.tsx` with `createBrowserRouter`:
- Map the monolith's navigation state machine to URL routes
- Zone index pages are eagerly imported; all individual game/screen files are `React.lazy()`
- Wrap lazy routes in `<Suspense>` with a loading spinner

Create all zone index files and game files as stubs (`export default function X() { return <div>TODO</div> }`).

Verify end-to-end routing works before filling any content.

---

## Phase 8 — Zone Index Pages

For each zone/screen:
1. Find its render block in the monolith (search for `zone === "arcade"` or equivalent)
2. Extract into `src/zones/<Zone>/index.tsx`
3. Replace monolith navigation calls (`setZone`, `setSelectedGame`) with `navigate('/path')`
4. Replace global state reads (`coins`, `xp`) with `useContext` / `useArena()`
5. Preserve all inline styles verbatim

---

## Phase 9 — Game/Screen Components

Work in batches by complexity:

**Batch A** — Simple tap/click games (no hold input, minimal state)  
**Batch B** — Hold-based games (puff meter, timing)  
**Batch C** — Sequence/rhythm games  
**Batch D** — Multi-round games with AI opponents  
**Batch E** — Show/quiz formats (multiple phases, timers)  
**Batch F** — Fortune/prediction formats  
**Batch G** — 3D / heavy dependency games (Three.js, etc.) — these must be `React.lazy()`

For each game component:

```tsx
export default function SomeGame() {
  const navigate = useNavigate()
  const { playFx, registerHandlers, awardGame } = useArena()

  // Mirror every mutable value in a ref to prevent stale closures in BLE/timer callbacks
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const phaseRef = useRef(phase)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const handleDown = useCallback(() => { /* read from refs, not state */ }, [...])
  const handleUp   = useCallback(() => { /* ... */ }, [...])

  useEffect(() => {
    registerHandlers(handleDown, handleUp)
    return () => registerHandlers(null, null)
  }, [registerHandlers, handleDown, handleUp])

  // Game takes full screen, provides its own back button
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div onClick={() => navigate('/zone')} style={{ ... }}>← Back</div>
      {/* game content */}
    </div>
  )
}
```

**Critical patterns:**
- Use `useRef` mirrors for all state consumed inside `useCallback`/`setInterval`/`setTimeout` callbacks
- End-game audio files (win/lose) must be guarded: `if (!endSoundFired.current) { endSoundFired.current = true; playFx('win') }`
- Per-round events → synthesized sounds; game-over → audio files
- Buttons inside a full-screen touch handler need `data-btn` / `data-back` attributes and early-return guards to prevent event conflicts

---

## Phase 10 — Cleanup

- Run `npm run typecheck` — fix all TS errors
- Remove the original monolith file (or move to `legacy/` if needed as reference)
- Add `<Suspense>` fallbacks on all lazy route subtrees
- Update `CLAUDE.md` to describe the new architecture

---

## Key decisions to document in CLAUDE.md

After the migration, write a `CLAUDE.md` that covers:
1. Dev/build commands
2. How the router maps to what was previously navigation state
3. The global context API (what `useApp()` / `useArena()` exposes)
4. The stale-closure ref pattern and why it's required
5. Audio file vs synthesized sound distinction
6. How to add BLE/device support to a new game
7. Design token locations (`C`, glass presets, zone themes)
8. Game component template (copy-paste starter)

---

## Common pitfalls from real migrations

| Symptom | Cause | Fix |
|---|---|---|
| Game sounds fire twice | `playFx('win')` in both `awardGame` and a game-end `useEffect` | Add `endSoundFiredRef` guard |
| BLE puff does nothing after navigate | Game forgot to call `registerHandlers` in `useEffect` | Add the registration `useEffect` |
| Stale state in BLE callback | Callback closes over initial state value | Mirror state in `useRef`, read ref in callback |
| Context unavailable (`useArena` throws) | Calling `useContext` in the same component that renders the Provider | Split into `App` (renders Provider) + `AppShell` (reads context) |
| Connect bar blocks game UI | Bar rendered on all routes, not just zone list pages | Use `useLocation()` + allowlist of paths |
| Zone list pages don't scroll | Root div uses `minHeight: '100%'` inside `overflow: hidden` parent | Use `height: '100%'` + `overflowY: 'auto'` |
| Lazy route blank on first load | Missing `<Suspense>` fallback | Wrap `<Outlet>` in `<Suspense fallback={<Spinner />}>` |
| 3D lib loads on every route | Not lazy-loaded | Wrap Three.js game in `React.lazy()` exclusively |
