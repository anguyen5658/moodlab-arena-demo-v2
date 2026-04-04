import { useState, useRef, useCallback } from 'react'
import { BLE_SERVICE_UUID, BLE_NOTIFY_CHAR_UUID, BLE_PUFF_START, BLE_PUFF_STOP } from '@/constants/ble'

interface UseBleOptions {
  playFx: (type: string, vol?: number) => void
  notify: (msg: string, color: string) => void
}

export function useBle({ playFx, notify }: UseBleOptions) {
  const [bleConnected, setBleConnected] = useState(false)
  const [btPuffActive, setBtPuffActive] = useState(false)
  const [bleScanning, setBleScanning] = useState(false)

  const btDeviceRef = useRef<BluetoothDevice | null>(null)
  const btCharNotify = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const btPuffDown = useRef<(() => void) | null>(null)
  const btPuffUp = useRef<(() => void) | null>(null)
  const btPuffEventDown = useRef<(() => void) | null>(null)
  const btPuffEventUp = useRef<(() => void) | null>(null)
  const btPuffTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registerPuffHandlers = useCallback(
    (down: (() => void) | null, up: (() => void) | null) => {
      btPuffDown.current = down
      btPuffUp.current = up
    },
    []
  )

  const registerPuffEventHandlers = useCallback(
    (down: (() => void) | null, up: (() => void) | null) => {
      btPuffEventDown.current = down
      btPuffEventUp.current = up
    },
    []
  )

  const connectBle = useCallback(async () => {
    if (!navigator.bluetooth) {
      notify('Web Bluetooth not supported in this browser', '#FF4444')
      return
    }
    try {
      setBleScanning(true)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
      })
      btDeviceRef.current = device

      device.addEventListener('gattserverdisconnected', () => {
        if (btPuffTimeout.current) clearTimeout(btPuffTimeout.current)
        setBleConnected(false)
        setBtPuffActive(false)
        btCharNotify.current = null
        notify('Device disconnected', '#FB923C')
      })

      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService(BLE_SERVICE_UUID)
      const charNotify = await service.getCharacteristic(BLE_NOTIFY_CHAR_UUID)
      btCharNotify.current = charNotify

      charNotify.addEventListener('characteristicvaluechanged', (e: Event) => {
        const dv = (e.target as BluetoothRemoteGATTCharacteristic).value!
        const b = Array.from({ length: dv.byteLength }, (_, i) => dv.getUint8(i))
        const match = (template: number[]) =>
          b.length === template.length && template.every((v, i) => b[i] === v)

        if (match(BLE_PUFF_START)) {
          if (btPuffTimeout.current) clearTimeout(btPuffTimeout.current)
          setBtPuffActive(true)
          btPuffDown.current?.()
          btPuffEventDown.current?.()
          btPuffTimeout.current = setTimeout(() => {
            setBtPuffActive(false)
            btPuffUp.current?.()
            btPuffEventUp.current?.()
          }, 15000)
        } else if (match(BLE_PUFF_STOP)) {
          if (btPuffTimeout.current) clearTimeout(btPuffTimeout.current)
          setBtPuffActive(false)
          btPuffUp.current?.()
          btPuffEventUp.current?.()
        }
      })

      await charNotify.startNotifications()
      setBleScanning(false)
      setBleConnected(true)
      playFx('success')
    } catch (err: any) {
      setBleScanning(false)
      if (err.name !== 'NotFoundError') {
        notify('BLE error: ' + err.message, '#FF4444')
      }
    }
  }, [playFx, notify])

  const disconnectBle = useCallback(() => {
    if (btPuffTimeout.current) clearTimeout(btPuffTimeout.current)
    if (btDeviceRef.current?.gatt?.connected) btDeviceRef.current.gatt.disconnect()
    setBleConnected(false)
    setBtPuffActive(false)
    btCharNotify.current = null
  }, [])

  return {
    bleConnected,
    btPuffActive,
    bleScanning,
    connectBle,
    disconnectBle,
    registerPuffHandlers,
    registerPuffEventHandlers,
    btPuffDown,
    btPuffUp,
    btPuffEventDown,
    btPuffEventUp,
  }
}
