// =============================================================================
// useBleArena.js — Arena-specific BLE bridge
//
// Sits between useBleDevice (generic) and the game handlers inside MoodLabArena.
// Responsibilities:
//   1. Maintain refs for the "active game" puff handlers (down + up)
//   2. Route BLE puff_start / puff_stop to whichever game is currently running
//   3. Drive the btPuffActive visual effect state
//   4. Expose connect / disconnect / connected / scanning to the UI
//
// HOW TO PORT THIS TO ANOTHER PROJECT:
//   - Keep useBleDevice.js and bleUtils.js as-is (zero changes needed).
//   - Replace this file's GAME HANDLER MAP with your own action map.
//   - The pattern is always: { gameId → { down: fn, up: fn | null } }
//   - Call syncHandlers(gameId, { down, up }) from your render/effect
//     whenever the active game changes.
// =============================================================================

import { useRef, useState, useCallback } from "react";
import { useBleDevice } from "./useBleDevice.js";


// =============================================================================
// HOOK: useBleArena
// =============================================================================

/**
 * @param {object} options
 * @param {function} options.onError      — called with an Error when connection fails
 * @param {function} options.onDisconnect — called when the device disconnects
 * @param {boolean}  [options.debug]      — enable console packet logs
 *
 * @returns {{
 *   connected:     boolean,
 *   scanning:      boolean,
 *   puffActive:    boolean,        — true while device is heating (drives visual effects)
 *   connect:       () => Promise,
 *   disconnect:    () => void,
 *   syncHandlers:  (gameId, { down, up }) => void,  — call this on every render
 *   writeChar:     React.RefObject,                  — for sendCommand()
 * }}
 *
 * ── Usage inside MoodLabArena ─────────────────────────────────────────────────
 *
 *   const ble = useBleArena({
 *     onError:      (err) => notify("BLE error: " + err.message, C.red),
 *     onDisconnect: ()    => notify("Device disconnected", C.orange),
 *     debug: true,
 *   });
 *
 *   // Call on every render to keep handlers fresh (avoids stale closures):
 *   ble.syncHandlers(gameActive?.id, GAME_HANDLER_MAP);
 *
 *   // UI:
 *   <button onClick={ble.connect}>Connect</button>
 *   {ble.puffActive && <div className="top-glow" />}
 */
export function useBleArena({ onError, onDisconnect, debug = false } = {}) {

  // ── Visual effect state ─────────────────────────────────────────────────────

  /**
   * True while the device is heating (between puff_start and puff_stop).
   * Bind this to a CSS transition or animation to give real-time feedback
   * (e.g. the top gradient glow in Arena).
   */
  const [puffActive, setPuffActive] = useState(false);


  // ── Active handler refs ─────────────────────────────────────────────────────
  // These are written by syncHandlers() on every render and read by the BLE
  // notification callback. Using refs (not state) means the callback is never
  // stale without needing to re-subscribe.

  /** Called when puff_start arrives — should trigger the active game's puff-down action. */
  const puffDownRef = useRef(null);

  /** Called when puff_stop arrives — should trigger the active game's puff-up action. */
  const puffUpRef   = useRef(null);


  // ── BLE callbacks ───────────────────────────────────────────────────────────

  const handlePuffStart = useCallback(() => {
    setPuffActive(true);
    puffDownRef.current?.();   // forward to active game
  }, []);

  const handlePuffStop = useCallback(() => {
    setPuffActive(false);
    puffUpRef.current?.();     // forward to active game
  }, []);

  const handleUnknown = useCallback((bytes, hex) => {
    // Unknown packets are surfaced here so you can discover new device events.
    // Log them during development; silence in production.
    if (debug) console.log("[BLE] Unrecognised packet →", hex, bytes);
  }, [debug]);


  // ── Core hook ───────────────────────────────────────────────────────────────

  const ble = useBleDevice({
    onPuffStart:  handlePuffStart,
    onPuffStop:   handlePuffStop,
    onUnknown:    handleUnknown,
    onError,
    onDisconnect,
    debug,
  });


  // ── syncHandlers ────────────────────────────────────────────────────────────

  /**
   * Keeps puffDownRef / puffUpRef pointing at the current game's handlers.
   *
   * Call this unconditionally on every render of your top-level component.
   * Because refs are mutated (not state), this is always cheap — no re-renders.
   *
   * @param {string | null | undefined} gameId — the active game's ID string
   * @param {object} handlerMap — { [gameId]: { down: fn, up: fn | null } }
   *
   * ── Example handlerMap (Arena) ────────────────────────────────────────────
   *
   *   const HANDLER_MAP = {
   *     finalkick:  { down: kickStartCharge, up: kickStopCharge },
   *     balloon:    { down: bpStartCharge,   up: bpStopCharge   },
   *     tugofwar:   { down: towPuff,         up: null           }, // tap-based
   *     puffpong:   { down: ppPuffUp,        up: ppPuffRelease  }, // hold-based
   *     // ... etc
   *   };
   *
   *   // Inside the component body (runs every render):
   *   ble.syncHandlers(gameActive?.id, HANDLER_MAP);
   *
   * ── Tap vs Hold games ─────────────────────────────────────────────────────
   *
   *   Tap-based games (tugofwar, puffderby, rhythm):
   *     Each puff_start fires the action once. Set `up: null`.
   *
   *   Hold-based games (finalkick, balloon, rps, etc.):
   *     puff_start = begin charging, puff_stop = release and evaluate.
   *     Both `down` and `up` must be set.
   */
  const syncHandlers = useCallback((gameId, handlerMap) => {
    const entry = gameId ? handlerMap[gameId] : null;
    puffDownRef.current = entry?.down ?? null;
    puffUpRef.current   = entry?.up   ?? null;
  }, []);


  // ── Return API ──────────────────────────────────────────────────────────────

  return {
    connected:    ble.connected,
    scanning:     ble.scanning,
    puffActive,
    connect:      ble.connect,
    disconnect:   ble.disconnect,
    writeChar:    ble.writeChar,
    syncHandlers,
  };
}


// =============================================================================
// ARENA GAME HANDLER MAP
// =============================================================================
//
// This is the Arena-specific routing table. Each entry maps a game ID to the
// pair of React handler functions that should be called on puff_start / puff_stop.
//
// HOW TO READ THIS TABLE:
//   - `down` → called on BLE puff_start (device heats up / user inhales)
//   - `up`   → called on BLE puff_stop  (device cools / user releases)
//   - `null` for `up` = tap-based game (each start event = one discrete action)
//
// HOW TO EXTEND:
//   Add a new row for each new game. The handlers must already exist in the
//   component — this table just maps IDs to them.
//
// This map is passed to ble.syncHandlers() on every render:
//   ble.syncHandlers(gameActive?.id, buildArenaHandlerMap({ ... handlers ... }));
//
// =============================================================================

/**
 * Builds the Arena handler map from the current render's handler closures.
 *
 * All handler arguments must be the live function references from the current
 * render — never cached across renders — because the BLE callback reads them
 * through refs (so stale closures are not a problem, but the map itself must
 * always reflect the latest function pointers).
 *
 * @param {object} handlers — destructured handler functions from the component
 * @returns {{ [gameId]: { down: function, up: function | null } }}
 *
 * Usage inside MoodLabArena on every render:
 *
 *   ble.syncHandlers(gameActive?.id, buildArenaHandlerMap({
 *     kickStartCharge, kickStopCharge,
 *     bpStartCharge,   bpStopCharge,
 *     rrStartPuff,     rrStopPuff,
 *     duelShoot,       duelReleasePuff,
 *     hpStartPuff,     hpStopPuff,
 *     hookStartPuff,   hookStopPuff,
 *     rpsStartPuff,    rpsStopPuff,
 *     pcStartPuff,     pcStopPuff,
 *     bdStartHold,     bdReleaseHold,
 *     plStartPuff,     plReleasePuff,
 *     spStartPuff,     spEndPuff,
 *     paStartBid,      paEndBid,
 *     pipStartPuff,    pipStopPuff,
 *     towPuff,
 *     pdPuff,
 *     rpPuffHit,
 *     ppPuffUp,        ppPuffRelease,
 *   }));
 */
export function buildArenaHandlerMap({
  // ── Arcade — Hold-based (start charges, stop evaluates) ──
  kickStartCharge, kickStopCharge,   // Final Kick / FK2 / FK3D
  bpStartCharge,   bpStopCharge,     // Balloon Pop
  rrStartPuff,     rrStopPuff,       // Russian Roulette
  duelShoot,       duelReleasePuff,  // Wild West Duel
  hpStartPuff,     hpStopPuff,       // Hot Potato
  hookStartPuff,   hookStopPuff,     // Hooked
  rpsStartPuff,    rpsStopPuff,      // Puff RPS
  pcStartPuff,     pcStopPuff,       // Puff Clock
  bdStartHold,     bdReleaseHold,    // Beat Drop
  plStartPuff,     plReleasePuff,    // Puff Limbo
  spStartPuff,     spEndPuff,        // Simon Puffs
  paStartBid,      paEndBid,         // Puff Auction
  pipStartPuff,    pipStopPuff,      // The Price is Puff

  // ── Arcade — Tap-based (each puff_start = one discrete action, no release) ──
  towPuff,    // Tug of War — one puff = one pull
  pdPuff,     // Puff Derby — one puff = one horse speed boost
  rpPuffHit,  // Rhythm Puff — one puff = one note hit

  // ── Arcade — Hold-based with positional meaning ──
  ppPuffUp, ppPuffRelease, // Puff Pong — hold moves paddle up, release drifts down

  // ── Oracle / Fortune (TODO — wire these handlers when implemented) ──
  // cbHandlePuff,   cbHandlePuffEnd,   // Crystal Ball
  // sbHandlePuff,   sbHandlePuffEnd,   // Strain Battle
  // mpHandlePuff,   mpHandlePuffEnd,   // Match Predictor
  // dpHandlePuff,   dpHandlePuffEnd,   // Daily Picks
  // slotsHandlePuff, slotsHandlePuffEnd, // Puff Slots
  // bjHandlePuff,   bjHandlePuffEnd,   // Puff Blackjack
  // cfHandlePuff,   cfHandlePuffEnd,   // Coin Flip
  // crapsHandlePuff, crapsHandlePuffEnd, // Craps & Clouds
  // mbHandlePuff,   mbHandlePuffEnd,   // Mystery Box
  // fcHandlePuff,   fcHandlePuffEnd,   // Fortune Cookie
  // tmHandlePuff,   tmHandlePuffEnd,   // Treasure Map

  // ── Stage (TODO — wire these handlers when implemented) ──
  // hlHandlePuff,   // Higher or Lower
  // stHandlePuff,   // Survival Trivia
  // vcHandlePuff,   // Vibe Check
} = {}) {
  return {
    // Hold-based
    finalkick:  { down: kickStartCharge, up: kickStopCharge   },
    finalkick2: { down: kickStartCharge, up: kickStopCharge   },
    finalkick3: { down: kickStartCharge, up: kickStopCharge   },
    balloon:    { down: bpStartCharge,   up: bpStopCharge     },
    russian:    { down: rrStartPuff,     up: rrStopPuff       },
    wildwest:   { down: duelShoot,       up: duelReleasePuff  },
    hotpotato:  { down: hpStartPuff,     up: hpStopPuff       },
    hooked:     { down: hookStartPuff,   up: hookStopPuff     },
    rps:        { down: rpsStartPuff,    up: rpsStopPuff      },
    puffclock:  { down: pcStartPuff,     up: pcStopPuff       },
    beatdrop:   { down: bdStartHold,     up: bdReleaseHold    },
    pufflimbo:  { down: plStartPuff,     up: plReleasePuff    },
    simonpuffs: { down: spStartPuff,     up: spEndPuff        },
    puffauction:{ down: paStartBid,      up: paEndBid         },
    pricepuff:  { down: pipStartPuff,    up: pipStopPuff      },

    // Tap-based (up is null — stop event is ignored)
    tugofwar:   { down: towPuff,         up: null             },
    puffderby:  { down: pdPuff,          up: null             },
    rhythm:     { down: rpPuffHit,       up: null             },

    // Hold with positional meaning
    puffpong:   { down: ppPuffUp,        up: ppPuffRelease    },

    // TODO: Oracle / Fortune games (uncomment when handlers are wired)
    // crystalball:  { down: cbHandlePuff,     up: cbHandlePuffEnd     },
    // strainbattle: { down: sbHandlePuff,     up: sbHandlePuffEnd     },
    // matchpredictor:{ down: mpHandlePuff,    up: mpHandlePuffEnd     },
    // dailypicks:   { down: dpHandlePuff,     up: dpHandlePuffEnd     },
    // puffslots:    { down: slotsHandlePuff,  up: slotsHandlePuffEnd  },
    // puffblackjack:{ down: bjHandlePuff,     up: bjHandlePuffEnd     },
    // coinflip:     { down: cfHandlePuff,     up: cfHandlePuffEnd     },
    // crapsnclouds: { down: crapsHandlePuff,  up: crapsHandlePuffEnd  },
    // mysterybox:   { down: mbHandlePuff,     up: mbHandlePuffEnd     },
    // fortunecookie:{ down: fcHandlePuff,     up: fcHandlePuffEnd     },
    // treasuremap:  { down: tmHandlePuff,     up: tmHandlePuffEnd     },

    // TODO: Stage games
    // higherlower:    { down: hlHandlePuff, up: null },
    // survivaltrivia: { down: stHandlePuff, up: null },
    // vibecheck:      { down: vcHandlePuff, up: null },
  };
}
