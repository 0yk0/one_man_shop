import { IsMobile, PrintReceipt, BuildEscposBytes } from '../bindings'
import type { Transaction } from '../bindings'

declare global {
  interface Window {
    _printerBridge?: {
      print(escposBase64: string): Promise<string>
      isConnected(): Promise<boolean>
      getConnectionType(): Promise<string | null>
      getPrinterName(): Promise<string>
      getBluetoothPrinters(): Promise<string>
      getUsbPrinters(): Promise<string>
      connectBluetooth(address: string): Promise<string>
      connectUsb(deviceId: number): Promise<string>
      disconnect(): Promise<void>
      testPrint(): Promise<string>
      openBluetoothSettings(): void
      onDisconnect?: () => void
      onError?: (message: string) => void
    }
  }
}

export interface AndroidPrinter {
  name: string
  id: string
  type: 'bluetooth' | 'usb'
}

/**
 * Print a receipt. On desktop, calls Go's PrintReceipt directly.
 * On Android, builds ESC/POS bytes via Go and sends them to the Java printer bridge.
 */
export async function printReceipt(transaction: Transaction): Promise<void> {
  const isMobile = await IsMobile()
  if (isMobile) {
    const escposB64 = await BuildEscposBytes(transaction)
    const result = await window._printerBridge?.print(escposB64)
    if (result !== 'ok') {
      throw new Error(String(result || 'Print failed'))
    }
  } else {
    await PrintReceipt(transaction)
  }
}

/**
 * Check if a printer is connected.
 * On desktop, returns true if a printer is configured (always available).
 * On Android, checks via the Java printer bridge.
 */
export async function isPrinterConnected(): Promise<boolean> {
  const isMobile = await IsMobile()
  if (!isMobile) return true
  return (await window._printerBridge?.isConnected()) ?? false
}

/**
 * Get available Android printers (Bluetooth paired + USB connected).
 * Returns an empty array on desktop.
 */
export async function getAndroidPrinters(): Promise<AndroidPrinter[]> {
  const isMobile = await IsMobile()
  if (!isMobile) return []

  const printers: AndroidPrinter[] = []

  try {
    // Get Bluetooth printers
    const btJson = await window._printerBridge?.getBluetoothPrinters()
    if (btJson) {
      const btDevices = JSON.parse(btJson) as Array<{ name: string; address: string }>
      for (const device of btDevices) {
        printers.push({
          name: device.name || device.address,
          id: `bt:${device.address}`,
          type: 'bluetooth',
        })
      }
    }
  } catch (err) {
    console.error('Failed to get Bluetooth printers:', err)
  }

  try {
    // Get USB printers
    const usbJson = await window._printerBridge?.getUsbPrinters()
    if (usbJson) {
      const usbDevices = JSON.parse(usbJson) as Array<{ id: number; productName: string; name: string }>
      for (const device of usbDevices) {
        printers.push({
          name: device.productName || device.name || `USB Device ${device.id}`,
          id: `usb:${device.id}`,
          type: 'usb',
        })
      }
    }
  } catch (err) {
    console.error('Failed to get USB printers:', err)
  }

  return printers
}

/**
 * Connect to an Android printer by its ID (format: "bt:AA:BB:CC:DD:EE:FF" or "usb:123").
 */
export async function connectAndroidPrinter(printerId: string): Promise<void> {
  if (printerId.startsWith('bt:')) {
    const address = printerId.slice(3)
    await window._printerBridge?.connectBluetooth(address)
  } else if (printerId.startsWith('usb:')) {
    const deviceId = parseInt(printerId.slice(4), 10)
    await window._printerBridge?.connectUsb(deviceId)
  }
}

/**
 * Send a test print to the connected Android printer.
 */
export async function testPrint(): Promise<void> {
  const result = await window._printerBridge?.testPrint()
  if (result !== 'ok') {
    throw new Error(String(result || 'Test print failed'))
  }
}

/**
 * Open Android Bluetooth settings for pairing a new printer.
 */
export function openBluetoothSettings(): void {
  window._printerBridge?.openBluetoothSettings()
}

/**
 * Disconnect the current Android printer.
 */
export async function disconnectPrinter(): Promise<void> {
  await window._printerBridge?.disconnect()
}
