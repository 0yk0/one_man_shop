import { IsMobile } from '../bindings'

/**
 * Save a base64-encoded file on Android using the native save file dialog (ACTION_CREATE_DOCUMENT).
 * On desktop, falls back to the Go SaveFile method (native save dialog).
 *
 * Returns the saved file path, or null if the user cancelled.
 */
export async function saveFileWithDialog(
  title: string,
  filename: string,
  mimeType: string,
  contentBase64: string
): Promise<string | null> {
  const isMobile = await IsMobile()

  if (!isMobile) {
    // Desktop: use Go's native save dialog
    const { SaveFile } = await import('../bindings')
    return SaveFile(title, filename, contentBase64)
  }

  // Android: use the native SAF save dialog via WailsJSBridge
  return new Promise<string | null>((resolve) => {
    const wails = (window as any).wails
    if (!wails || !wails.saveFile) {
      // Fallback: save to app data dir
      import('../bindings').then(({ SaveFile }) => {
        SaveFile(title, filename, contentBase64).then(resolve)
      })
      return
    }

    // Set up callback for when the native dialog completes
    ;(window as any)._onSaveFileResult = (path: string | null) => {
      ;(window as any)._onSaveFileResult = null
      resolve(path)
    }

    // Trigger the native save dialog
    wails.saveFile(filename, mimeType, contentBase64)
  })
}
