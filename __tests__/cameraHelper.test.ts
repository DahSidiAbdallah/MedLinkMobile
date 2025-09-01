import { ensureFocus, detectCameraMethods } from '../src/utils/cameraHelper'

describe('cameraHelper', () => {
  test('detectCameraMethods returns empty for missing ref', () => {
    expect(detectCameraMethods(null)).toEqual([])
  })

  test('detectCameraMethods detects available methods', () => {
    const mockRef = { current: { setFocusModeAsync: () => {}, setFocusDepth: () => {} } }
    const methods = detectCameraMethods(mockRef as any)
    expect(methods.sort()).toEqual(['setFocusDepth', 'setFocusModeAsync'].sort())
  })

  test('ensureFocus returns true when at least one method succeeds', async () => {
    const mockRef = { current: { setFocusModeAsync: jest.fn(async () => {}), } }
    const result = await ensureFocus(mockRef as any)
    expect(result).toBe(true)
  })

  test('ensureFocus returns false when no methods present', async () => {
    const mockRef = { current: {} }
    const result = await ensureFocus(mockRef as any)
    expect(result).toBe(false)
  })
})
