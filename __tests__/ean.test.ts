import { isValidEAN13 } from '../src/utils/ean'

test('valid EANs', () => {
  expect(isValidEAN13('3400933071998')).toBe(true)
  expect(isValidEAN13('3400936864986')).toBe(true)
  expect(isValidEAN13('5024071210002')).toBe(true)
})

test('invalid EANs', () => {
  expect(isValidEAN13('3400933071990')).toBe(false)
  expect(isValidEAN13('1234567890123')).toBe(false)
})
