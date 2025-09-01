import AsyncStorage from '@react-native-async-storage/async-storage'
import { resolveDigitalLink } from '../src/utils/gs1DigitalLink'

describe('GS1 Digital Link resolver', () => {
  beforeEach(() => {
    // mock fetch to return JSON response
    (global as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ brand: 'TestBrand' }) }))
  })
  afterEach(async () => {
    delete (global as any).fetch
    await AsyncStorage.removeItem('gs1_dl_cache_v1_09501101530002')
  })
  test('resolves and caches Digital Link', async () => {
    const res1 = await resolveDigitalLink('09501101530002')
    expect(res1).toBeDefined()
    // second call should hit cache (fetch not called again)
    const res2 = await resolveDigitalLink('09501101530002')
    expect(res2).toBeDefined()
    // fetch should have been called only once
    expect((global as any).fetch).toHaveBeenCalledTimes(1)
  })
})
