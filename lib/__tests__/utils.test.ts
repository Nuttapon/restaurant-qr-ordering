import { describe, it, expect } from 'vitest'
import { formatPrice, timeAgo, cn } from '../utils'

describe('formatPrice', () => {
  it('formats whole number prices', () => {
    expect(formatPrice(80)).toBe('฿80')
  })
  it('formats decimal prices', () => {
    expect(formatPrice(49.50)).toBe('฿49.50')
  })
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('฿0')
  })
})

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', 'b', false, null, 'c')).toBe('a b c')
  })
  it('returns empty string for all falsy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})
