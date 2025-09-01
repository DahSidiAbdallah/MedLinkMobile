import { summarizeText, safeJoinArrayField } from '../src/utils/textHelpers'

describe('textHelpers', () => {
  test('summarizeText returns full text when under limit', () => {
    const t = 'short text'
    const res = summarizeText(t, 50)
    expect(res.truncated).toBe(false)
    expect(res.display).toBe(t)
    expect(res.remainder).toBe('')
  })

  test('summarizeText truncates and provides remainder', () => {
    const long = 'a'.repeat(500)
    const res = summarizeText(long, 100)
    expect(res.truncated).toBe(true)
    expect(res.display.length).toBeGreaterThan(0)
    expect(res.remainder.length).toBeGreaterThan(0)
    expect((res.display + res.remainder).length).toBe(long.length)
  })

  test('safeJoinArrayField handles arrays and strings', () => {
    expect(safeJoinArrayField(['a','b'])).toBe('a\n\nb')
    expect(safeJoinArrayField('x')).toBe('x')
    expect(safeJoinArrayField(null)).toBe('')
  })
})
