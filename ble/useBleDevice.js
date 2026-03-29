// =============================================================================
// useBleDevice.js — React hook for BLE device connection + notification routing
//
// Encapsulates everything needed to:
//   1. Connect to a BLE device via the browser's native device picker
//   2. Subscribe to a notify characteristic
//   3. Route incoming packets to application-level callbacks (onPuffStart / onPuffStop)
//   4. Provide connection state and connect/disconnect controls to the UI
//
// Dependencies: React (useState, useRef, useCallback, useEffect)
// No other external dependencies — bleUtils.js is co-located.
//
// Designed to be device-agnostic: swap out the UUIDs and packet constants via
// the `config` parameter to target a different BLE device.
// =============================================================================

import { useState, useRef, useCallback, useEffect } from "react";
import {
  isWebBluetoothSupported,
  parseNotification,
  classifyPacket,
  BLE_SERVICE_UUID,
  BLE_NOTIFY_CHAR_UUID,
  BLE_WRITE_CHAR_UUID,
} from "./bleUtils.js";


// -----------------------------------------------------------------------------
// HOOK: useBleDevice
// -----------------------------------------------------------------------------

/**
 * useBleDevice — manages one BLE device connection lifecycle.
 *
 * @param {object}   options
 * @param {function} options.onPuffStart  — called when PUFF_START packet arrives
 * @param {function} options.onPuffStop   — called when PUFF_STOP packet arrives
 * @param {function} [options.onUnknown]  — optional: called with (bytes, hex) for unrecognised packets
 * @param {function} [options.onError]    — optional: called with (Error) on connection failure
 * @param {function} [options.onDisconnect] — optional: called when device disconnects
 * @param {object}   [options.config]     — override UUIDs for a different device
 * @param {string}   [options.config.serviceUuid=BLE_SERVICE_UUID]
 * @param {string}   [options.config.notifyUuid=BLE_NOTIFY_CHAR_UUID]
 * @param {string}   [options.config.writeUuid=BLE_WRITE_CHAR_UUID]
 * @param {boolean}  [options.debug=false] — if true, logs all packets to console
 *
 * @returns {{
 *   connected:    boolean,             — true after successful connection + notifications started
 *   scanning:     boolean,             — true while the connection flow is in progress
 *   writeChar:    React.RefObject,     — ref to the write characteristic (for sendCommand)
 *   connect:      () => Promise<void>, — opens the browser device picker and connects
 *   disconnect:   () => void,          — closes the GATT connection cleanly
 * }}
 *
 * ── Minimal usage example ────────────────────────────────────────────────────
 *
 *   const ble = useBleDevice({
 *     onPuffStart: () => console.log("puff started"),
 *     onPuffStop:  () => console.log("puff stopped"),
 *     debug: true,
 *   });
 *
 *   <button onClick={ble.connect}>Connect device</button>
 *   {ble.connected && <span>BLE connected</span>}
 *
 * ── With custom UUIDs for a different device ─────────────────────────────────
 *
 *   const ble = useBleDevice({
 *     onPuffStart: handleDown,
 *     onPuffStop:  handleUp,
 *     config: {
 *       serviceUuid: "0000180d-0000-1000-8000-00805f9b34fb", // Heart Rate service
 *       notifyUuid:  "00002a37-0000-1000-8000-00805f9b34fb",
 *     },
 *   });
 */
export function useBleDevice({
  onPuffStart,
  onPuffStop,
  onUnknown,
  onError,
  onDisconnect,
  config = {},
  debug = false,
} = {}) {

  // ── Resolved UUIDs (fall back to Cali Clear defaults) ──────────────────────
  const serviceUuid = config.serviceUuid ?? BLE_SERVICE_UUID;
  const notifyUuid  = config.notifyUuid  ?? BLE_NOTIFY_CHAR_UUID;
  // writeUuid is available for callers who need to send commands via sendCommand()
  const writeUuid   = config.writeUuid   ?? BLE_WRITE_CHAR_UUID;

  // ── State exposed to the UI ─────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [scanning,  setScanning]  = useState(false);

  // ── Internal refs ───────────────────────────────────────────────────────────

  /** The BluetoothDevice handle — used for disconnect and reconnect. */
  const deviceRef    = useRef(null);

  /** The notify characteristic handle — kept for cleanup on unmount. */
  const notifyRef    = useRef(null);

  /**
   * The write characteristic handle — exposed via the return value so callers
   * can call sendCommand(ble.writeChar.current, bytes) without needing the hook
   * to know about specific commands.
   */
  const writeCharRef = useRef(null);

  // Stable refs for the callbacks so the event listener never goes stale
  // even if the parent component re-renders with new function instances.
  const onPuffStartRef  = useRef(onPuffStart);
  const onPuffStopRef   = useRef(onPuffStop);
  const onUnknownRef    = useRef(onUnknown);
  const onErrorRef      = useRef(onError);
  const onDisconnectRef = useRef(onDisconnect);

  // Keep callback refs up to date on every render without re-subscribing
  useEffect(() => { onPuffStartRef.current  = onPuffStart;  }, [onPuffStart]);
  useEffect(() => { onPuffStopRef.current   = onPuffStop;   }, [onPuffStop]);
  useEffect(() => { onUnknownRef.current    = onUnknown;    }, [onUnknown]);
  useEffect(() => { onErrorRef.current      = onError;      }, [onError]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);


  // ── Notification handler ────────────────────────────────────────────────────

  /**
   * Central packet dispatcher — registered once when notifications start.
   * Uses stable refs so it never captures stale closures.
   *
   * Packet flow:
   *   DataView → bytes[] + hex string → classifyPacket() → named event → callback
   */
  const handleNotification = useCallback((e) => {
    const { bytes, hex } = parseNotification(e.target.value);
    const event = classifyPacket(bytes);

    if (debug) {
      const label = event ?? "unknown";
      console.log(`[BLE] ${label.toUpperCase().padEnd(11)} → ${hex}`);
    }

    if (event === "puff_start") {
      onPuffStartRef.current?.();
    } else if (event === "puff_stop") {
      onPuffStopRef.current?.();
    } else {
      // Unknown packet — surface to the caller for inspection / future mapping
      onUnknownRef.current?.(bytes, hex);
    }
  }, [debug]); // debug is the only primitive dep; callbacks come from refs


  // ── connect() ──────────────────────────────────────────────────────────────

  /**
   * Opens the browser's native BLE device picker (filtered to our service UUID),
   * connects GATT, resolves the notify (and optionally write) characteristics,
   * then starts notification subscriptions.
   *
   * Safe to call multiple times — guards against double-connect via `scanning`.
   */
  const connect = useCallback(async () => {
    // Guard: browser support
    if (!isWebBluetoothSupported()) {
      const err = new Error("Web Bluetooth is not supported in this browser");
      onErrorRef.current?.(err);
      return;
    }

    // Guard: already in progress
    if (scanning) return;

    setScanning(true);

    try {
      // ── Step 1: Device picker
      // The browser shows a native modal listing nearby devices that advertise
      // our service UUID. The user selects one. Throws NotFoundError if cancelled.
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }],
      });
      deviceRef.current = device;

      // ── Step 2: Disconnect listener
      // Registered before connect() so we never miss an early disconnect.
      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        notifyRef.current    = null;
        writeCharRef.current = null;
        onDisconnectRef.current?.();
        if (debug) console.log("[BLE] Device disconnected");
      });

      // ── Step 3: GATT connection
      const server = await device.gatt.connect();

      // ── Step 4: Service discovery
      const service = await server.getPrimaryService(serviceUuid);

      // ── Step 5: Notify characteristic
      const charNotify = await service.getCharacteristic(notifyUuid);
      notifyRef.current = charNotify;
      charNotify.addEventListener("characteristicvaluechanged", handleNotification);

      // ── Step 6: Write characteristic (optional — some devices may not expose it)
      try {
        const charWrite = await service.getCharacteristic(writeUuid);
        writeCharRef.current = charWrite;
      } catch {
        // Write characteristic is optional; not all devices expose it
        if (debug) console.log("[BLE] Write characteristic not found — skipping");
      }

      // ── Step 7: Start notifications
      // Must come after addEventListener so no packets are missed.
      await charNotify.startNotifications();

      setScanning(false);
      setConnected(true);

      if (debug) console.log("[BLE] Connected to", device.name ?? device.id);

    } catch (err) {
      setScanning(false);

      // NotFoundError = user dismissed the picker — not a real error
      if (err.name === "NotFoundError") {
        if (debug) console.log("[BLE] Device picker cancelled by user");
        return;
      }

      if (debug) console.error("[BLE] Connection error:", err);
      onErrorRef.current?.(err);
    }
  }, [scanning, serviceUuid, notifyUuid, writeUuid, handleNotification, debug]);


  // ── disconnect() ───────────────────────────────────────────────────────────

  /**
   * Cleanly closes the GATT connection.
   * The gattserverdisconnected listener will fire and update state.
   */
  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
      if (debug) console.log("[BLE] Disconnected by user");
    }
    // State is reset in the gattserverdisconnected listener
  }, [debug]);


  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      // Stop notifications to avoid memory leaks when the component unmounts
      if (notifyRef.current) {
        notifyRef.current
          .stopNotifications()
          .catch(() => {}); // GATT may already be closed — ignore
      }
      // Disconnect if still open
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);


  // ── Return API ─────────────────────────────────────────────────────────────

  return {
    /** True after startNotifications() succeeds. */
    connected,

    /** True while the connect() flow is in progress (picker open / GATT handshake). */
    scanning,

    /**
     * Ref to the write characteristic.
     * Use with sendCommand() from bleUtils.js to send commands to the device.
     *
     *   import { sendCommand } from "./bleUtils.js";
     *   await sendCommand(ble.writeChar.current, [0x01, 0x00]);
     */
    writeChar: writeCharRef,

    /** Opens the device picker and starts the connection flow. */
    connect,

    /** Closes the GATT connection cleanly. */
    disconnect,
  };
}
