import React, { createContext, useContext, useRef, useState } from 'react'
import { BLE_SERVICE_UUID, BLE_PUFF_START, BLE_PUFF_STOP, C } from '../constants'
import { useAudioContext } from './AudioContext'

const BLE_NOTIFY_CHAR_UUID = "0000ffe6-0000-1000-8000-00805f9b34fb"

interface BLEDeviceUI {
  slot: number
  name: string
  deviceName: string
  connected: boolean
}

interface BLEDeviceRef {
  slot: number
  device: any
  characteristic: any
  puffTimeout: ReturnType<typeof setTimeout> | null
  down: (() => void) | null
  up: (() => void) | null
}

interface BLEContextValue {
  bleConnected: boolean
  bleScanning: boolean
  btPuffActive: boolean
  setBtPuffActive: React.Dispatch<React.SetStateAction<boolean>>
  bleDevices: BLEDeviceUI[]
  bleDevicesRef: React.MutableRefObject<(BLEDeviceRef | null)[]>
  partyPlayerNames: string[]
  setPartyPlayerNames: React.Dispatch<React.SetStateAction<string[]>>
  ssPlayerCount: number | null
  setSsPlayerCount: React.Dispatch<React.SetStateAction<number | null>>
  mpActive: boolean
  setMpActive: React.Dispatch<React.SetStateAction<boolean>>
  // legacy refs
  btPuffDown: React.MutableRefObject<(() => void) | null>
  btPuffUp: React.MutableRefObject<(() => void) | null>
  btPuffEventDown: React.MutableRefObject<(() => void) | null>
  btPuffEventUp: React.MutableRefObject<(() => void) | null>
  prevBleConnected: React.MutableRefObject<boolean>
  // actions
  connectBleSlot: (slotIndex: number) => Promise<void>
  disconnectBleSlot: (slotIndex: number) => void
  connectBle: () => Promise<void>
  disconnectBle: () => void
  registerPuffHandlers: (gameId: string | null, down: (() => void) | null, up: (() => void) | null) => void
}

const BLECtx = createContext<BLEContextValue>(null!)
export const useBLEContext = () => useContext(BLECtx)

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audio = useAudioContext()

  const [bleConnected, setBleConnected] = useState(false)
  const [bleScanning, setBleScanning] = useState(false)
  const [btPuffActive, setBtPuffActive] = useState(false)
  const [bleDevices, setBleDevices] = useState<BLEDeviceUI[]>([])
  const [partyPlayerNames, setPartyPlayerNames] = useState(["You", "Friend 1", "Friend 2", "Friend 3"])
  const [ssPlayerCount, setSsPlayerCount] = useState<number | null>(null)
  const [mpActive, setMpActive] = useState(false)

  const bleDevicesRef = useRef<(BLEDeviceRef | null)[]>([])
  const btDeviceRef = useRef<any>(null)
  const btCharNotify = useRef<any>(null)
  const btPuffDown = useRef<(() => void) | null>(null)
  const btPuffUp = useRef<(() => void) | null>(null)
  const btPuffEventDown = useRef<(() => void) | null>(null)
  const btPuffEventUp = useRef<(() => void) | null>(null)
  const btPuffTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevBleConnected = useRef(false)

  // notify needs to be injected — use a ref-based approach to avoid circular deps
  // BLEContext calls this via the audio context for sounds; for notify we use a late-binding ref
  const notifyRef = useRef<((msg: string, color?: string) => void) | null>(null)
  const setNotifyFn = (fn: (msg: string, color?: string) => void) => {
    notifyRef.current = fn
  }
  const notify = (msg: string, color = C.cyan) => notifyRef.current?.(msg, color)

  const connectBleSlot = async (slotIndex: number) => {
    if (!(navigator as any).bluetooth) {
      notify("Web Bluetooth not supported in this browser", C.red)
      return
    }
    try {
      setBleScanning(true)
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
      })

      if (slotIndex === 0) btDeviceRef.current = device

      device.addEventListener("gattserverdisconnected", () => {
        const slotRef = bleDevicesRef.current[slotIndex]
        if (slotRef) clearTimeout(slotRef.puffTimeout!)
        if (slotIndex === 0) {
          clearTimeout(btPuffTimeout.current!)
          setBtPuffActive(false)
          btCharNotify.current = null
        }
        bleDevicesRef.current[slotIndex] = null
        setBleDevices(prev => prev.map(d => d.slot === slotIndex ? { ...d, connected: false } : d))
        const anyLeft = bleDevicesRef.current.some(d => d && d.device?.gatt?.connected)
        if (!anyLeft) setBleConnected(false)
        if (mpActive) {
          notify((partyPlayerNames[slotIndex] || "Player") + " disconnected!", C.orange)
        } else {
          notify("Slot " + (slotIndex + 1) + " disconnected", C.orange)
        }
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(BLE_SERVICE_UUID)
      const charNotify = await service.getCharacteristic(BLE_NOTIFY_CHAR_UUID)

      if (slotIndex === 0) btCharNotify.current = charNotify

      bleDevicesRef.current[slotIndex] = {
        slot: slotIndex, device, characteristic: charNotify,
        puffTimeout: null, down: null, up: null,
      }

      charNotify.addEventListener("characteristicvaluechanged", (e: any) => {
        const dv = e.target.value
        const b = Array.from({ length: dv.byteLength }, (_: any, i: number) => dv.getUint8(i)) as number[]
        const match = (template: number[]) => b.length === template.length && template.every((v, i) => b[i] === v)
        const slotRef = bleDevicesRef.current[slotIndex]
        if (!slotRef) return
        if (match(BLE_PUFF_START as number[])) {
          clearTimeout(slotRef.puffTimeout!)
          if (slotIndex === 0) {
            setBtPuffActive(true)
            btPuffDown.current?.()
            btPuffEventDown.current?.()
            btPuffTimeout.current = setTimeout(() => {
              setBtPuffActive(false)
              btPuffUp.current?.()
              btPuffEventUp.current?.()
            }, 15000)
          }
          slotRef.down?.()
          slotRef.puffTimeout = setTimeout(() => { slotRef.up?.() }, 15000)
        } else if (match(BLE_PUFF_STOP as number[])) {
          clearTimeout(slotRef.puffTimeout!)
          if (slotIndex === 0) {
            clearTimeout(btPuffTimeout.current!)
            setBtPuffActive(false)
            btPuffUp.current?.()
            btPuffEventUp.current?.()
          }
          slotRef.up?.()
        }
      })

      await charNotify.startNotifications()
      setBleScanning(false)
      setBleConnected(true)
      audio.playFx("success")

      setBleDevices(prev => {
        const filtered = prev.filter(d => d.slot !== slotIndex)
        return [...filtered, {
          slot: slotIndex, name: partyPlayerNames[slotIndex],
          deviceName: device.name || "Cali Clear", connected: true
        }].sort((a, b) => a.slot - b.slot)
      })
    } catch (err: any) {
      setBleScanning(false)
      if (err.name !== "NotFoundError") {
        notify("BLE error: " + err.message, C.red)
      }
    }
  }

  const disconnectBleSlot = (slotIndex: number) => {
    const slotRef = bleDevicesRef.current[slotIndex]
    if (slotRef) {
      clearTimeout(slotRef.puffTimeout!)
      if (slotRef.device?.gatt?.connected) slotRef.device.gatt.disconnect()
    }
    bleDevicesRef.current[slotIndex] = null
    if (slotIndex === 0) {
      clearTimeout(btPuffTimeout.current!)
      setBtPuffActive(false)
      btCharNotify.current = null
    }
    setBleDevices(prev => prev.map(d => d.slot === slotIndex ? { ...d, connected: false } : d))
    const anyLeft = bleDevicesRef.current.some(d => d && d.device?.gatt?.connected)
    if (!anyLeft) setBleConnected(false)
  }

  const connectBle = async () => { await connectBleSlot(0) }
  const disconnectBle = () => { disconnectBleSlot(0) }

  // Register puff handlers for the currently active game.
  // Called by each game hook via useEffect when its game becomes active.
  // The full multiplayer routing will be implemented in Phase 2+ when game hooks are added.
  const registerPuffHandlers = (
    _gameId: string | null,
    down: (() => void) | null,
    up: (() => void) | null
  ) => {
    btPuffDown.current = down
    btPuffUp.current = up
    // Route to all connected devices (solo play / default)
    bleDevicesRef.current.forEach(dev => {
      if (dev) { dev.down = down; dev.up = up }
    })
  }

  return (
    <BLECtx.Provider value={{
      bleConnected, bleScanning, btPuffActive, setBtPuffActive,
      bleDevices, bleDevicesRef, partyPlayerNames, setPartyPlayerNames,
      ssPlayerCount, setSsPlayerCount, mpActive, setMpActive,
      btPuffDown, btPuffUp, btPuffEventDown, btPuffEventUp, prevBleConnected,
      connectBleSlot, disconnectBleSlot, connectBle, disconnectBle,
      registerPuffHandlers,
    }}>
      {children}
    </BLECtx.Provider>
  )
}
