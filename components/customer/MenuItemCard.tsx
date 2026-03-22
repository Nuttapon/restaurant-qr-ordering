'use client'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  item: MenuItem
}

export function MenuItemCard({ item }: Props) {
  const { addItem, items } = useCartStore()
  const inCart = items.find(i => i.menuItem.id === item.id)

  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
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
        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{item.name_th}</p>
        <p className="text-xs text-gray-400 truncate">{item.name_en}</p>
        {item.description_th && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description_th}</p>
        )}
        <p className="text-orange-500 font-bold mt-1">{formatPrice(item.price)}</p>
      </div>
      <button
        onClick={() => addItem(item)}
        className="self-center flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white text-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center"
        aria-label={`เพิ่ม ${item.name_th}`}
      >
        {inCart ? `+${inCart.quantity}` : '+'}
      </button>
    </div>
  )
}
