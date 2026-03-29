# BLE Module — Web Bluetooth for Cali Clear

Reusable hook and utilities for connecting a **Cali Clear** vaporizer to a web app via the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API). The module is structured in three layers so you can take any piece into another project independently.

```
ble/
├── bleUtils.js       — pure functions, zero dependencies (UUIDs, packet parsing, matching)
├── useBleDevice.js   — generic React hook (connection lifecycle, notification routing)
└── useBleArena.js    — Arena-specific bridge (game handler routing, puffActive state)
```

---

## Browser Support

Web Bluetooth is supported in **Chrome / Edge / Opera** on desktop and Android. It is **not** supported in Firefox or Safari. Call `isWebBluetoothSupported()` before connecting to surface a meaningful error early.

> The API requires a **secure context** (HTTPS or localhost) and a **user gesture** (e.g. a button click) to open the device picker.

---

## Device Protocol

### UUIDs

| Role | UUID |
|---|---|
| GATT Service | `0000FFE0-0000-1000-8000-00805F9B34FB` |
| Write Characteristic | `0000FFE5-0000-1000-8000-00805F9B34FB` |
| Notify Characteristic | `0000FFE6-0000-1000-8000-00805F9B34FB` |

### Notification Packets

The device pushes **6-byte packets** on the notify characteristic whenever its heating element state changes.

| Event | Hex | Meaning |
|---|---|---|
| Puff Start | `b4 b4 02 00 04 4b` | Heating element activated — user is inhaling |
| Puff Stop | `b4 b5 02 00 05 4b` | Heating cancelled — user released or device auto-cut |

Any unrecognised packet is surfaced via the `onUnknown` callback and logged as `[BLE] unknown packet →` in the console when `debug: true`. Use this to discover additional device events from future firmware versions.

---

## Architecture

### The stale closure problem — and how it's solved

A BLE `characteristicvaluechanged` event listener is registered **once** at connection time. In a React component, any function captured inside that listener at registration time will be frozen — it won't see state or prop updates that happen later (a classic stale closure).

This module solves it with **stable refs**:

1. `useBleDevice` stores all callbacks (`onPuffStart`, `onPuffStop`, etc.) in refs and updates them with `useEffect` on every render. The event listener always reads from the ref, so it always calls the freshest function.

2. `useBleArena` adds a `syncHandlers(gameId, map)` function designed to be called **on every render** of the parent component. It writes the active game's handler pair into refs. No re-subscribe, no re-render — just a cheap ref mutation.

```
Component re-renders
  → syncHandlers() writes fresh handlers into puffDownRef / puffUpRef
  → BLE notification fires (any time)
  → reads puffDownRef.current → always up to date
```

---

## Files

### `bleUtils.js` — Pure utilities

No React, no side-effects. Safe to import in any environment including Node (for testing).

#### Exports

| Export | Type | Description |
|---|---|---|
| `BLE_SERVICE_UUID` | `string` | Primary GATT service UUID |
| `BLE_WRITE_CHAR_UUID` | `string` | Write characteristic UUID |
| `BLE_NOTIFY_CHAR_UUID` | `string` | Notify characteristic UUID |
| `BLE_PUFF_START` | `number[]` | 6-byte start packet template |
| `BLE_PUFF_STOP` | `number[]` | 6-byte stop packet template |
| `parseNotification(dataView)` | `fn` | `DataView → { bytes, hex }` |
| `matchPacket(bytes, template)` | `fn` | Exact byte array comparison |
| `classifyPacket(bytes)` | `fn` | Returns `"puff_start"` / `"puff_stop"` / `null` |
| `sendCommand(writeChar, bytes)` | `async fn` | Writes a command to the device |
| `isWebBluetoothSupported()` | `fn` | Browser capability check |

#### Packet flow

```
e.target.value (DataView)
  → parseNotification()  →  { bytes: [0xb4, 0xb4, ...], hex: "b4 b4 02 00 04 4b" }
  → classifyPacket()     →  "puff_start" | "puff_stop" | null
```

---

### `useBleDevice.js` — Generic React hook

Manages the full BLE connection lifecycle for **one device**. Device-agnostic — the UUIDs and packet constants are the only Cali Clear-specific parts, and they can be overridden via `config`.

#### Signature

```js
const ble = useBleDevice({
  onPuffStart,   // () => void   — called on puff_start packet
  onPuffStop,    // () => void   — called on puff_stop packet
  onUnknown,     // (bytes, hex) => void   — called for unrecognised packets
  onError,       // (Error) => void        — called on connection failure
  onDisconnect,  // () => void             — called on GATT disconnect
  config: {      // optional UUID overrides
    serviceUuid,
    notifyUuid,
    writeUuid,
  },
  debug,         // boolean — enables console packet logs
});
```

#### Return value

| Property | Type | Description |
|---|---|---|
| `connected` | `boolean` | `true` after `startNotifications()` succeeds |
| `scanning` | `boolean` | `true` while the connection flow is in progress |
| `writeChar` | `React.RefObject` | Ref to the write characteristic, for use with `sendCommand()` |
| `connect` | `async () => void` | Opens the browser device picker and runs the full connect flow |
| `disconnect` | `() => void` | Cleanly closes the GATT connection |

#### Connection flow (inside `connect()`)

```
1. isWebBluetoothSupported() check
2. navigator.bluetooth.requestDevice({ filters: [{ services: [serviceUuid] }] })
      → browser shows native device picker
      → user selects device (or cancels — NotFoundError, silently ignored)
3. device.addEventListener("gattserverdisconnected", ...)
4. device.gatt.connect()
5. server.getPrimaryService(serviceUuid)
6. service.getCharacteristic(notifyUuid)
      → charNotify.addEventListener("characteristicvaluechanged", handleNotification)
7. service.getCharacteristic(writeUuid)   ← optional, skipped if not available
8. charNotify.startNotifications()
9. setConnected(true)
```

#### Cleanup

On component unmount, `stopNotifications()` is called and the GATT connection is closed to prevent memory leaks.

#### Minimal usage

```jsx
import { useBleDevice } from "./ble/useBleDevice.js";

function MyApp() {
  const ble = useBleDevice({
    onPuffStart: () => console.log("puff started"),
    onPuffStop:  () => console.log("puff stopped"),
    debug: true,
  });

  return (
    <button onClick={ble.connect}>
      {ble.scanning ? "Connecting..." : ble.connected ? "Connected" : "Connect Device"}
    </button>
  );
}
```

#### Using a different device

```js
const ble = useBleDevice({
  onPuffStart: handleDown,
  onPuffStop:  handleUp,
  config: {
    serviceUuid: "0000180d-0000-1000-8000-00805f9b34fb",
    notifyUuid:  "00002a37-0000-1000-8000-00805f9b34fb",
  },
});
```

---

### `useBleArena.js` — Arena-specific bridge

Wraps `useBleDevice` and adds game-level routing for Mood Lab Arena.

#### `useBleArena` hook

```js
const ble = useBleArena({
  onError:      (err) => showToast("BLE error: " + err.message),
  onDisconnect: ()    => showToast("Device disconnected"),
  debug: true,
});
```

##### Return value

| Property | Type | Description |
|---|---|---|
| `connected` | `boolean` | Device is connected and notifying |
| `scanning` | `boolean` | Connection flow in progress |
| `puffActive` | `boolean` | `true` while device is heating — bind to visual effects |
| `connect` | `async () => void` | Opens device picker |
| `disconnect` | `() => void` | Closes connection |
| `writeChar` | `React.RefObject` | Write characteristic ref |
| `syncHandlers` | `(gameId, map) => void` | Updates active game's handler refs |

##### `syncHandlers(gameId, handlerMap)`

Call this **unconditionally on every render** of the top-level component. It writes the correct `down` / `up` function pair into refs so the BLE listener always dispatches to the currently active game — at zero render cost.

```js
// On every render:
ble.syncHandlers(gameActive?.id, buildArenaHandlerMap({
  kickStartCharge, kickStopCharge,
  towPuff,          // tap-based — no `up` needed
  ppPuffUp, ppPuffRelease,
  // ...all other active game handlers
}));
```

#### Handler map patterns

There are two interaction types in Arena:

**Hold-based** — the BLE start begins a charge; the BLE stop evaluates it. Both `down` and `up` must be set.

```js
finalkick: { down: kickStartCharge, up: kickStopCharge }
```

**Tap-based** — each BLE start fires one discrete action. The stop event is ignored (`up: null`).

```js
tugofwar:  { down: towPuff, up: null }
puffderby: { down: pdPuff,  up: null }
```

#### `buildArenaHandlerMap(handlers)`

Helper that builds the full routing table from the current render's live handler closures. All 17 wired games are included; Oracle/Fortune and Stage games are pre-listed as commented-out TODOs ready to uncomment.

```js
ble.syncHandlers(
  gameActive?.id,
  buildArenaHandlerMap({
    kickStartCharge, kickStopCharge,
    bpStartCharge,   bpStopCharge,
    rrStartPuff,     rrStopPuff,
    duelShoot,       duelReleasePuff,
    hpStartPuff,     hpStopPuff,
    hookStartPuff,   hookStopPuff,
    rpsStartPuff,    rpsStopPuff,
    pcStartPuff,     pcStopPuff,
    bdStartHold,     bdReleaseHold,
    plStartPuff,     plReleasePuff,
    spStartPuff,     spEndPuff,
    paStartBid,      paEndBid,
    pipStartPuff,    pipStopPuff,
    towPuff,
    pdPuff,
    rpPuffHit,
    ppPuffUp,        ppPuffRelease,
  })
);
```

---

## Visual Feedback — `puffActive`

`puffActive` is `true` between a `puff_start` and `puff_stop` notification. In Arena it drives a full-width gradient overlay at the top of the screen:

```jsx
<div style={{
  position: "fixed", top: 0, left: 0, right: 0, height: 220,
  opacity: ble.puffActive ? 1 : 0,
  transition: ble.puffActive ? "opacity 0.18s ease-out" : "opacity 0.6s ease-in",
  background: "linear-gradient(180deg, rgba(0,229,255,0.55), rgba(192,132,252,0.30), transparent)",
  animation: ble.puffActive ? "btPuffGlow 1.4s ease-in-out infinite alternate" : "none",
  pointerEvents: "none",
}} />
```

Bind `puffActive` to any effect you like — a colour tint, a border glow, a haptic pulse — the state is already there.

---

## Sending Commands to the Device

The write characteristic (`FFE5`) is available via `ble.writeChar.current` for future outgoing commands (LED colour, power settings, etc.). Use `sendCommand` from `bleUtils.js`:

```js
import { sendCommand } from "./ble/bleUtils.js";

// Hypothetical "set LED to green" command:
await sendCommand(ble.writeChar.current, [0x02, 0x01, 0x00, 0xff, 0x00]);
```

---

## Porting to Another Project

To use this module outside of Arena:

1. **Copy `bleUtils.js` and `useBleDevice.js` as-is** — no changes needed.
2. **Replace `useBleArena.js`** with your own bridge file that calls `useBleDevice` and routes the `onPuffStart` / `onPuffStop` callbacks to whatever your app needs.
3. If targeting a different BLE device, pass a `config` object to `useBleDevice` with the correct UUIDs, and update `BLE_PUFF_START` / `BLE_PUFF_STOP` in `bleUtils.js` (or define your own packet constants locally).

The only Arena-specific code is in `useBleArena.js`. Everything else is generic.
