import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart'

const mockItem = {
  id: 'item-1',
  name_th: 'ผัดกะเพรา',
  name_en: 'Basil Stir-fry',
  price: 80,
  category_id: 'cat-1',
  sort_order: 0,
  description_th: null,
  description_en: null,
  image_url: null,
  is_available: true,
  updated_at: '',
}

describe('useCartStore', () => {
  beforeEach(() => useCartStore.getState().clearCart())

  it('adds item to cart', () => {
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('increments quantity on duplicate add', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().updateQuantity('item-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates total price correctly', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().totalPrice()).toBe(160)
  })

  it('removes item directly', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().removeItem('item-1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears all items', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
