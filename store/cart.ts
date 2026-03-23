import { create } from 'zustand'
import { MenuItem } from '@/types/database'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (menuItem: MenuItem) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateNote: (menuItemId: string, note: string) => void
  clearCart: () => void
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (menuItem) => set((state) => {
    const existing = state.items.find(i => i.menuItem.id === menuItem.id)
    if (existing) {
      return {
        items: state.items.map(i =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
    }
    return { items: [...state.items, { menuItem, quantity: 1 }] }
  }),

  removeItem: (menuItemId) => set((state) => ({
    items: state.items.filter(i => i.menuItem.id !== menuItemId)
  })),

  updateQuantity: (menuItemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(i => i.menuItem.id !== menuItemId) }
    }
    return {
      items: state.items.map(i =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      )
    }
  }),

  updateNote: (menuItemId, note) => set((state) => ({
    items: state.items.map(i =>
      i.menuItem.id === menuItemId ? { ...i, note: note || undefined } : i
    )
  })),

  clearCart: () => set({ items: [] }),

  totalPrice: () => get().items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity, 0
  ),
}))
