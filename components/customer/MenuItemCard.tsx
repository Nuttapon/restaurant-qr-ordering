'use client'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  item: MenuItem
}

export function MenuItemCard({ item }: Props) {
  const { addItem, updateQuantity, items } = useCartStore()
  const inCart = items.find(i => i.menuItem.id === item.id)

  return (
    <div className="flex gap-3 p-3 bg-[var(--brand-surface-card)] rounded-2xl border border-[var(--brand-text-muted)]/10 hover:shadow-[var(--brand-shadow-md)] transition-shadow duration-200 shadow-[var(--brand-shadow-sm)]">
      {item.image_url ? (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={item.image_url}
            alt={item.name_th}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--brand-primary-light)] to-[var(--brand-primary)]/10 flex items-center justify-center text-3xl opacity-60">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--brand-text-primary)] truncate">{item.name_th}</p>
        <p className="text-xs text-[var(--brand-text-muted)] truncate">{item.name_en}</p>
        {item.description_th && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description_th}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[var(--brand-primary)] font-bold text-lg">{formatPrice(item.price)}</p>
          {item.is_recommended && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">⭐ แนะนำ</span>}
          {item.is_spicy && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🌶 เผ็ด</span>}
          {item.is_vegetarian && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🥦 มังสวิรัติ</span>}
        </div>
      </div>
      {inCart ? (
        <div className="self-center flex items-center gap-1">
          <button
            onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
            className="w-8 h-8 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-bold text-lg flex items-center justify-center hover:bg-[var(--brand-primary)]/20 transition-colors"
            aria-label="ลด"
          >
            −
          </button>
          <span className="w-6 text-center font-bold text-sm text-[var(--brand-text-primary)]">
            {inCart.quantity}
          </span>
          <button
            onClick={() => addItem(item)}
            className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white font-bold text-lg flex items-center justify-center hover:bg-[var(--brand-primary-hover)] transition-colors"
            aria-label="เพิ่ม"
          >
            +
          </button>
        </div>
      ) : (
        <button
          onClick={() => addItem(item)}
          className="self-center flex-shrink-0 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors animate-pop"
          aria-label={`เพิ่ม ${item.name_th}`}
        >
          เพิ่ม
        </button>
      )}
    </div>
  )
}
