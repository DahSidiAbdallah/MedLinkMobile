// Ensure AsyncStorage manual mock is used in node environment
jest.mock('@react-native-async-storage/async-storage')

// Provide a no-op global.fetch if tests don't set it
if (!(global as any).fetch) {
  (global as any).fetch = async () => ({ ok: true, status: 200 })
}
