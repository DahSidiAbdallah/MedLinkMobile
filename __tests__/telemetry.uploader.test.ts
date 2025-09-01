import AsyncStorage from '@react-native-async-storage/async-storage'
import { createTelemetryService } from '../src/core/telemetryService'

describe('Telemetry uploader', () => {
  beforeEach(() => {
    // mock fetch
    (global as any).fetch = jest.fn(async (url: string, opts: any) => {
      return { ok: true, status: 200 }
    })
  })

  afterEach(async () => {
    delete (global as any).fetch
    await AsyncStorage.removeItem('telemetry_queue_v1')
  })

  test('uploads payload with auth header and batch shape', async () => {
    const svc = createTelemetryService({ endpoint: 'https://api.example/telemetry', batchSize: 2, authToken: 'secrettoken' })
    // wait for init
    await (svc as any).init()
    svc.record({ a: 1 })
    svc.record({ b: 2 })
    // drain
    await svc.drainForTest()
    expect((global as any).fetch).toHaveBeenCalled()
    const callArgs = (global as any).fetch.mock.calls[0]
    const headers = callArgs[1].headers
    expect(headers.Authorization).toBe('Bearer secrettoken')
  const body = JSON.parse(callArgs[1].body)
  // new shape: { batchId, events }
  expect(body.batchId).toBeDefined()
  expect(Array.isArray(body.events)).toBe(true)
  expect(body.events.length).toBe(2)
  })
})
