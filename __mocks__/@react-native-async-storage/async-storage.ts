const store = new Map<string, string>()

const AsyncStorage = {
  getItem: async (key: string) => {
    return store.has(key) ? store.get(key) ?? null : null
  },
  setItem: async (key: string, value: string) => {
    store.set(key, value)
    return null
  },
  removeItem: async (key: string) => {
    store.delete(key)
    return null
  },
  clear: async () => {
    store.clear()
    return null
  },
}

export default AsyncStorage
