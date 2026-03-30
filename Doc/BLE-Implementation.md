# Bluetooth Device Integration — Implementation Report

## Overview

This document records the work done to connect a real Bluetooth Low Energy (BLE) device (Cali Clear) to Mood Lab Arena, replacing the previous simulated/fake connect flow. The device sends puff notifications that directly trigger game actions, replacing the on-screen "HOLD TO PUFF" button.

---

## Device Protocol

| Property | Value |
|---|---|
| Service UUID | `0000FFE0-0000-1000-8000-00805F9B34FB` |
| Write Characteristic UUID | `0000FFE5-0000-1000-8000-00805F9B34FB` |
| Notify Characteristic UUID | `0000FFE6-0000-1000-8000-00805F9B34FB` |

### Notification Payload Format

Each notification is a 6-byte packet:

| Event | Hex bytes | Meaning |
|---|---|---|
| Puff Start | `b4 b4 02 00 04 4b` | Device heating — puff begins |
| Puff Stop | `b4 b5 02 00 05 4b` | Heating cancelled — puff ends |

Any other payload is logged as `[BLE] unknown packet →` in devtools for inspection.

---

## What Was Implemented

### 1. Constants (`moodlab-arena-v6.jsx`, before `MAIN COMPONENT`)

```js
const BLE_SERVICE_UUID     = "0000ffe0-0000-1000-8000-00805f9b34fb";
const BLE_WRITE_CHAR_UUID  = "0000ffe5-0000-1000-8000-00805f9b34fb";
const BLE_NOTIFY_CHAR_UUID = "0000ffe6-0000-1000-8000-00805f9b34fb";
const BLE_PUFF_START = [0xb4, 0xb4, 0x02, 0x00, 0x04, 0x4b];
const BLE_PUFF_STOP  = [0xb4, 0xb5, 0x02, 0x00, 0x05, 0x4b];
```

### 2. State & Refs

```js
// State
const [bleConnected, setBleConnected] = useState(false);   // existing
const [bleScanning,  setBleScanning]  = useState(false);   // existing
const [btPuffActive, setBtPuffActive] = useState(false);   // NEW — drives the top glow effect

// Refs (NEW)
const btDeviceRef     = useRef(null); // BluetoothDevice — for disconnect
const btCharNotify    = useRef(null); // Notify characteristic handle
const btPuffDown      = useRef(null); // Active game's puff-start handler
const btPuffUp        = useRef(null); // Active game's puff-stop handler
const btPuffEventDown = useRef(null); // Puff Events system puff-start handler
const btPuffEventUp   = useRef(null); // Puff Events system puff-stop handler
```

### 3. `connectBle()` — Real Web Bluetooth API Connection

Replaces the previous fake `setTimeout` connect. Flow:

1. Calls `navigator.bluetooth.requestDevice()` filtered by service UUID — opens the browser's native device picker (which is the scan UI)
2. Connects GATT → gets primary service → gets the notify characteristic
3. Registers `gattserverdisconnected` listener for auto-status update
4. Registers `characteristicvaluechanged` listener that:
   - Converts `DataView` to a byte array
   - Formats it as a hex string for console logging
   - Matches against `BLE_PUFF_START` / `BLE_PUFF_STOP`
   - On match: logs to console, sets `btPuffActive`, calls the active game's handler via refs
5. Calls `startNotifications()` on the characteristic
6. Sets `bleConnected = true`, closes the popup, launches the existing Device Optimization screen
7. On user cancelling the picker (`NotFoundError`): silently fails (no error toast)

### 4. `disconnectBle()` — Clean Teardown

Calls `device.gatt.disconnect()`, resets `bleConnected`, clears the characteristic ref.

### 5. Per-Render Ref-Sync (IIFE)

An immediately-invoked function runs **every render** to keep `btPuffDown.current` and `btPuffUp.current` pointing at the freshest closure of the active game's handlers. This avoids the stale closure problem that would otherwise occur inside the BLE event listener (which is registered only once at connect time).

```
gameActive.id → btPuffDown / btPuffUp
```

### 6. Game Handler Mapping (17 games wired)

| Game ID | Puff Start | Puff Stop | Interaction type |
|---|---|---|---|
| `finalkick` / `finalkick2` / `finalkick3` | `kickStartCharge` | `kickStopCharge` | hold |
| `balloon` | `bpStartCharge` | `bpStopCharge` | hold |
| `russian` | `rrStartPuff` | `rrStopPuff` | hold |
| `wildwest` | `duelShoot` | `duelReleasePuff` | hold |
| `hotpotato` | `hpStartPuff` | `hpStopPuff` | hold |
| `hooked` | `hookStartPuff` | `hookStopPuff` | hold |
| `rps` | `rpsStartPuff` | `rpsStopPuff` | hold |
| `puffclock` | `pcStartPuff` | `pcStopPuff` | hold |
| `beatdrop` | `bdStartHold` | `bdReleaseHold` | hold |
| `pufflimbo` | `plStartPuff` | `plReleasePuff` | hold |
| `simonpuffs` | `spStartPuff` | `spEndPuff` | hold |
| `puffauction` | `paStartBid` | `paEndBid` | hold |
| `pricepuff` | `pipStartPuff` | `pipStopPuff` | hold |
| `tugofwar` | `towPuff` | — | tap (each start = one pull) |
| `puffderby` | `pdPuff` | — | tap (each start = one horse boost) |
| `rhythm` | `rpPuffHit` | — | tap (fires lane puff hit) |
| `puffpong` | `ppPuffUp` | `ppPuffRelease` | hold (start moves paddle up, stop drifts down) |

The **Puff Events** system (`puffEventHoldDown` / `puffEventHoldUp`) is always wired regardless of which game is active — it runs in parallel.

### 7. BLE Connect UI (updated)

In `renderBlePopup`:
- **Device row "Connect"**: now calls `connectBle()` instead of a fake `setTimeout`
- **Device row when connected**: calls `disconnectBle()`
- **"Scan for Devices" button**: calls `connectBle()` (browser picker IS the scan UI)

### 8. Visual Feedback — Top Puff Glow

A gradient overlay is rendered at the very top of the root layout:

- **On puff start**: fades in fast (0.18 s), animates between cyan→purple→pink and purple→cyan→gold (`@keyframes btPuffGlow`, 1.4 s loop)
- **On puff stop**: fades out slowly (0.6 s ease-in)
- `zIndex: 250` — above backgrounds and atmosphere effects, below game UI and notifications

### 9. Devtools Console Logging

All BLE notifications are logged for debugging:

```
[BLE] PUFF START → b4 b4 02 00 04 4b
[BLE] PUFF STOP  → b4 b5 02 00 05 4b
[BLE] unknown packet → xx xx xx xx xx xx
```

---

## Data Flow Diagram

```
Physical device heats up
  → BLE GATT notification fires (6 bytes)
  → characteristicvaluechanged handler
  → parse bytes → format hex → log to console
  → match BLE_PUFF_START?
      YES → setBtPuffActive(true)          — triggers top glow
            btPuffDown.current?.()         — active game puff start
            btPuffEventDown.current?.()    — puff events system
  → match BLE_PUFF_STOP?
      YES → setBtPuffActive(false)         — hides top glow
            btPuffUp.current?.()           — active game puff stop
            btPuffEventUp.current?.()      — puff events system

Per-render IIFE keeps btPuffDown/Up fresh:
  gameActive.id → correct handler closures → written to refs
```

---

## Compatibility

- The physical **"HOLD TO PUFF"** button still works in all games — both button and BLE call the same handlers. No games were broken.
- The BLE path works **alongside** the button, not instead of it. Players can mix both.
- `navigator.bluetooth` check: if the browser does not support Web Bluetooth (e.g. Firefox), an error notification is shown and no crash occurs.

---

---

# TO DO — Remaining from Original Plan

## High Priority (functionally missing)

- [ ] **Oracle / Fortune games not wired (11 games)**
  The following games declare their own `onMouseDown` puff handlers but are **not in the ref-sync block**, so BLE does nothing in them:

  | Game | Puff Start | Puff Stop |
  |---|---|---|
  | `crystalball` | `cbHandlePuff` | `cbHandlePuffEnd` |
  | `strainbattle` | `sbHandlePuff` | `sbHandlePuffEnd` |
  | `matchpredictor` | `mpHandlePuff` | `mpHandlePuffEnd` |
  | `dailypicks` | `dpHandlePuff` | `dpHandlePuffEnd` |
  | `puffslots` | `slotsHandlePuff` | `slotsHandlePuffEnd` |
  | `puffblackjack` | `bjHandlePuff` | `bjHandlePuffEnd` |
  | `coinflip` | `cfHandlePuff` | `cfHandlePuffEnd` |
  | `crapsnclouds` | `crapsHandlePuff` | `crapsHandlePuffEnd` |
  | `mysterybox` | `mbHandlePuff` | `mbHandlePuffEnd` |
  | `scratchpuff` | `slotsHandlePuff` (reused) | `slotsHandlePuffEnd` |
  | `fortunecookie` | `fcHandlePuff` | `fcHandlePuffEnd` |
  | `treasuremap` | `tmHandlePuff` | `tmHandlePuffEnd` |

- [ ] **Stage games not wired (2 games)**
  - `higherlower` — uses `hlHandlePuff(isLong)` with a boolean; needs a start/stop wrapper
  - `survivaltrivia` — uses tap-based answer selection; needs handler identified

- [ ] **`vibecheck` not wired** — uses its own answer tap system; puff handler needs identifying

## Medium Priority (UX improvements from original plan)

- [ ] **"PUFF TO PLAY" label when BLE is connected**
  The plan called for replacing or dimming "HOLD TO PUFF" button text with "PUFF TO PLAY" to signal the physical button is no longer needed. Currently the UI shows nothing to indicate BLE is active during gameplay.

- [ ] **Persistent BLE status indicator during games**
  A small floating `BLE 🔵` pill should appear inside the game view (not just on the hub status bar) so the player knows the device is connected while playing.

- [ ] **Auto-reconnect on disconnect**
  The `gattserverdisconnected` handler currently just sets status to disconnected. The original plan called for **one automatic reconnect attempt** before falling back to the physical button.

## Low Priority (nice to have)

- [ ] **BLE_WRITE_CHAR_UUID is declared but unused**
  The write characteristic (`0000FFE5`) is wired up in constants but never used. Possible uses: sending haptic/LED feedback commands to the device when a player wins or hits a perfect puff.

- [ ] **Battery level display**
  The BLE popup hard-codes `"Battery: 87%"` for the Cali Clear S2 device. A real battery level characteristic read on connect could populate this dynamically.

- [ ] **`spinwin` (Spin & Win) not wired**
  This Oracle zone game has a puff input (`swDoSpin`) but was not included in the ref-sync block.
