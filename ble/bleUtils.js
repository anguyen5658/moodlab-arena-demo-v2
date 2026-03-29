// =============================================================================
// bleUtils.js — Low-level BLE utility functions for the Cali Clear device
//
// These are pure functions with no React dependency. Safe to import anywhere:
// React, plain JS, Node (for testing), etc.
//
// Device: Cali Clear vaporizer
// Protocol: BLE GATT, custom FFE0 service with notify characteristic FFE6
// =============================================================================


// -----------------------------------------------------------------------------
// DEVICE UUIDs
// Change these if targeting a different device or firmware revision.
// -----------------------------------------------------------------------------

/** Primary GATT service exposed by the device. */
export const BLE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";

/**
 * Write characteristic — reserved for future outgoing commands
 * (e.g. LED colour, haptic feedback, power settings).
 * Currently not used for reads/notifications.
 */
export const BLE_WRITE_CHAR_UUID = "0000ffe5-0000-1000-8000-00805f9b34fb";

/**
 * Notify characteristic — the device pushes 6-byte packets here
 * whenever its heating element state changes.
 */
export const BLE_NOTIFY_CHAR_UUID = "0000ffe6-0000-1000-8000-00805f9b34fb";


// -----------------------------------------------------------------------------
// KNOWN NOTIFICATION PAYLOADS
// Each packet is exactly 6 bytes. Extend this table as new firmware events
// are discovered via the `[BLE] unknown packet →` console log.
// -----------------------------------------------------------------------------

/** Heating started → the user has begun puffing. */
export const BLE_PUFF_START = [0xb4, 0xb4, 0x02, 0x00, 0x04, 0x4b];

/** Heating cancelled → the user stopped puffing (or the device auto-cut off). */
export const BLE_PUFF_STOP  = [0xb4, 0xb5, 0x02, 0x00, 0x05, 0x4b];


// -----------------------------------------------------------------------------
// UTILITY — Parse a DataView notification into a usable byte array + hex string
// -----------------------------------------------------------------------------

/**
 * Converts a Web Bluetooth DataView into a plain byte array and a hex string.
 *
 * @param {DataView} dataView — e.target.value from a characteristicvaluechanged event
 * @returns {{ bytes: number[], hex: string }}
 *
 * Usage:
 *   charNotify.addEventListener("characteristicvaluechanged", (e) => {
 *     const { bytes, hex } = parseNotification(e.target.value);
 *     console.log(hex); // "b4 b4 02 00 04 4b"
 *   });
 */
export function parseNotification(dataView) {
  const bytes = Array.from({ length: dataView.byteLength }, (_, i) => dataView.getUint8(i));
  const hex   = bytes.map(v => v.toString(16).padStart(2, "0")).join(" ");
  return { bytes, hex };
}


// -----------------------------------------------------------------------------
// UTILITY — Match a byte array against a known template
// -----------------------------------------------------------------------------

/**
 * Returns true if `bytes` exactly matches `template` (same length, same values).
 *
 * @param {number[]} bytes    — parsed notification bytes
 * @param {number[]} template — one of the BLE_PUFF_* constants
 * @returns {boolean}
 *
 * Usage:
 *   if (matchPacket(bytes, BLE_PUFF_START)) { ... }
 */
export function matchPacket(bytes, template) {
  return (
    bytes.length === template.length &&
    template.every((v, i) => bytes[i] === v)
  );
}


// -----------------------------------------------------------------------------
// UTILITY — Classify a parsed notification
// Returns a semantic event name or null for unknown packets.
// -----------------------------------------------------------------------------

/**
 * Maps a byte array to a named event string.
 *
 * @param {number[]} bytes
 * @returns {"puff_start" | "puff_stop" | null}
 *
 * Usage:
 *   const event = classifyPacket(bytes);
 *   if (event === "puff_start") { ... }
 */
export function classifyPacket(bytes) {
  if (matchPacket(bytes, BLE_PUFF_START)) return "puff_start";
  if (matchPacket(bytes, BLE_PUFF_STOP))  return "puff_stop";
  return null;
}


// -----------------------------------------------------------------------------
// UTILITY — Write a command to the device (future use)
// Wraps the GATT write-with-response pattern.
// -----------------------------------------------------------------------------

/**
 * Sends a byte array to the write characteristic.
 * Requires an active BluetoothRemoteGATTCharacteristic handle.
 *
 * @param {BluetoothRemoteGATTCharacteristic} writeChar — the FFE5 characteristic
 * @param {number[]} bytes — command payload
 * @returns {Promise<void>}
 *
 * Usage:
 *   await sendCommand(writeChar, [0x01, 0x00]); // hypothetical "LED on" command
 */
export async function sendCommand(writeChar, bytes) {
  if (!writeChar) throw new Error("Write characteristic not available");
  const buffer = new Uint8Array(bytes).buffer;
  await writeChar.writeValueWithResponse(buffer);
}


// -----------------------------------------------------------------------------
// UTILITY — Check Web Bluetooth API availability
// -----------------------------------------------------------------------------

/**
 * Returns true if the current browser supports Web Bluetooth.
 * Use this before calling connect to give a meaningful error early.
 *
 * @returns {boolean}
 */
export function isWebBluetoothSupported() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}
