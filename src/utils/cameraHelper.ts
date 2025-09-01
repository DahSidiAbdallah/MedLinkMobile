// Best-effort camera helper. Different camera components expose different APIs.
// This provides small helpers that attempt to set focus/exposure if supported.
// Inspect which methods are available on a camera ref (useful for runtime debugging & tests)
export function detectCameraMethods(cameraRef: any): string[] {
  try {
    if (!cameraRef || !cameraRef.current) return []
    const cam = cameraRef.current
    const methods = ['setFocusModeAsync', 'setAutoFocus', 'setFocusDepth']
      .filter(m => typeof cam[m] === 'function')
    return methods
  } catch {
    return []
  }
}

// Best-effort camera helper. Different camera components expose different APIs.
// Attempts to call available methods. Returns true if any attempt succeeded.
export async function ensureFocus(cameraRef: any): Promise<boolean> {
  try {
    if (!cameraRef || !cameraRef.current) return false
    const cam = cameraRef.current
    const methods = detectCameraMethods(cameraRef)
    // Optional debug: set env var CAMERA_HELPER_DEBUG=1 to see capabilities at runtime
    if (process.env.CAMERA_HELPER_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug('[cameraHelper] detected methods on camera ref:', methods)
    }
    let anySucceeded = false
    // prefer explicit API methods if available
    if (methods.includes('setFocusModeAsync')) {
      try { await cam.setFocusModeAsync('auto'); anySucceeded = true } catch {}
    }
    if (methods.includes('setAutoFocus')) {
      try { await cam.setAutoFocus('on'); anySucceeded = true } catch {}
    }
    if (methods.includes('setFocusDepth')) {
      try { await cam.setFocusDepth(0.5); anySucceeded = true } catch {}
    }
    return anySucceeded
  } catch (err) {
    return false
  }
}
