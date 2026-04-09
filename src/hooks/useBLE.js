import { useState, useRef, useCallback } from 'react';
import {
  BLE_SERVICE_UUID,
  BLE_NOTIFY_CHAR_UUID,
  BLE_PUFF_START,
  BLE_PUFF_STOP,
} from '../constants/ble.js';

/**
 * useBLE — Web Bluetooth multi-device manager (up to 4 slots)
 *
 * Exposes:
 *   bleDevices        — array of {slot, name, deviceName, connected}
 *   bleConnected      — true if any slot is connected
 *   bleScanning       — true while requesting device
 *   connectBleSlot(n) — pair a device into slot n
 *   disconnectBleSlot(n)
 *   setBLEHandlers(slot, down, up) — game registers puff callbacks
 *   clearBLEHandlers(slot)         — game unregisters on unmount
 *
 * CRITICAL: bleDevicesRef is the single source of truth for the mutable
 * device state. All puff handler assignments go through bleDevicesRef so
 * that the characteristic notification listener always calls the latest
 * closure. Handlers are always set as lazy arrow wrappers per CLAUDE.md Rule 3.
 */
export function useBLE({ playFx, notify } = {}) {
  const [bleDevices, setBleDevices] = useState([]);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleScanning, setBleScanning] = useState(false);

  // The authoritative 4-slot mutable ref — never replaced, only mutated
  const bleDevicesRef = useRef([]);

  const connectBleSlot = useCallback(async (slotIndex) => {
    if (!navigator.bluetooth) {
      notify?.('Web Bluetooth not supported in this browser', '#FF4444');
      return;
    }
    try {
      setBleScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
      });

      device.addEventListener('gattserverdisconnected', () => {
        const slotRef = bleDevicesRef.current[slotIndex];
        if (slotRef) clearTimeout(slotRef.puffTimeout);
        bleDevicesRef.current[slotIndex] = null;
        setBleDevices(prev => prev.map(d => d.slot === slotIndex ? { ...d, connected: false } : d));
        const anyLeft = bleDevicesRef.current.some(d => d && d.device?.gatt?.connected);
        if (!anyLeft) setBleConnected(false);
        notify?.(`Slot ${slotIndex + 1} disconnected`, '#FB923C');
      });

      const server    = await device.gatt.connect();
      const service   = await server.getPrimaryService(BLE_SERVICE_UUID);
      const charNotify = await service.getCharacteristic(BLE_NOTIFY_CHAR_UUID);

      bleDevicesRef.current[slotIndex] = {
        slot: slotIndex, device, characteristic: charNotify,
        puffTimeout: null, down: null, up: null,
      };

      charNotify.addEventListener('characteristicvaluechanged', (e) => {
        const dv = e.target.value;
        const b  = Array.from({ length: dv.byteLength }, (_, i) => dv.getUint8(i));
        const match = (template) =>
          b.length === template.length && template.every((v, i) => b[i] === v);
        const slotRef = bleDevicesRef.current[slotIndex];
        if (!slotRef) return;
        if (match(BLE_PUFF_START)) {
          clearTimeout(slotRef.puffTimeout);
          slotRef.down?.();
          slotRef.puffTimeout = setTimeout(() => { slotRef.up?.(); }, 15000);
        } else if (match(BLE_PUFF_STOP)) {
          clearTimeout(slotRef.puffTimeout);
          slotRef.up?.();
        }
      });

      await charNotify.startNotifications();
      setBleScanning(false);
      setBleConnected(true);
      playFx?.('success');

      setBleDevices(prev => {
        const filtered = prev.filter(d => d.slot !== slotIndex);
        return [...filtered, {
          slot: slotIndex,
          name: `Player ${slotIndex + 1}`,
          deviceName: device.name || 'Cali Clear',
          connected: true,
        }].sort((a, b) => a.slot - b.slot);
      });
    } catch (err) {
      setBleScanning(false);
      if (err.name !== 'NotFoundError') {
        notify?.('BLE error: ' + err.message, '#FF4444');
      }
    }
  }, [playFx, notify]);

  const disconnectBleSlot = useCallback((slotIndex) => {
    const slotRef = bleDevicesRef.current[slotIndex];
    if (slotRef) {
      clearTimeout(slotRef.puffTimeout);
      if (slotRef.device?.gatt?.connected) slotRef.device.gatt.disconnect();
    }
    bleDevicesRef.current[slotIndex] = null;
    setBleDevices(prev => prev.map(d => d.slot === slotIndex ? { ...d, connected: false } : d));
    const anyLeft = bleDevicesRef.current.some(d => d && d.device?.gatt?.connected);
    if (!anyLeft) setBleConnected(false);
  }, []);

  /**
   * Game calls setBLEHandlers in a useEffect to register its puff callbacks.
   * IMPORTANT: always pass lazy arrow wrappers, not function references directly.
   *   setBLEHandlers(0, () => handleDown(), () => handleUp())   ← CORRECT
   *   setBLEHandlers(0, handleDown, handleUp)                   ← RISKY (TDZ / stale)
   */
  const setBLEHandlers = useCallback((slotIndex, down, up) => {
    const slotRef = bleDevicesRef.current[slotIndex];
    if (slotRef) {
      slotRef.down = down;
      slotRef.up   = up;
    }
  }, []);

  const clearBLEHandlers = useCallback((slotIndex) => {
    const slotRef = bleDevicesRef.current[slotIndex];
    if (slotRef) {
      slotRef.down = null;
      slotRef.up   = null;
    }
  }, []);

  // Backward-compat wrappers for solo games
  const connectBle    = useCallback(() => connectBleSlot(0), [connectBleSlot]);
  const disconnectBle = useCallback(() => disconnectBleSlot(0), [disconnectBleSlot]);

  return {
    bleDevices,
    bleConnected,
    bleScanning,
    bleDevicesRef,
    connectBleSlot,
    disconnectBleSlot,
    connectBle,
    disconnectBle,
    setBLEHandlers,
    clearBLEHandlers,
  };
}
