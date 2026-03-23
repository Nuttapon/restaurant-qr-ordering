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
    <div className="flex gap-4 p-4 bg-surface-card rounded-3xl border border-slate-200/60 hover:shadow-lg transition-all duration-300 shadow-sm overflow-hidden relative group">
      {item.image_url ? (
        <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden shadow-sm">
          <Image
            src={item.image_url}
            alt={item.name_th}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="w-28 h-28 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl opacity-60 shadow-inner">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col pt-1">
        <p className="font-bold text-lg text-slate-800 leading-snug">{item.name_th}</p>
        <p className="text-sm text-slate-500 truncate mt-0.5">{item.name_en}</p>
        {item.description_th && (
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description_th}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {item.is_recommended && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">⭐ แนะนำ</span>}
          {item.is_spicy && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-md">🌶 เผ็ด</span>}
          {item.is_vegetarian && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">🥦 มังสวิรัติ</span>}
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <p className="text-primary font-black text-xl tracking-tight">{formatPrice(item.price)}</p>
          {inCart ? (
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1 shadow-inner border border-slate-100">
              <button
                onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                className="w-10 h-10 rounded-xl bg-white text-primary font-black text-xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-200"
                aria-label="ลด"
              >
                −
              </button>
              <span className="w-6 text-center font-bold text-lg text-slate-800">
                {inCart.quantity}
              </span>
              <button
                onClick={() => addItem(item)}
                className="w-10 h-10 rounded-xl bg-primary text-white font-black text-xl flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-primary/20"
                aria-label="เพิ่ม"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item)}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white text-md font-bold hover:bg-primary-hover transition-all animate-pop active:scale-95 shadow-md shadow-primary/20 min-h-[44px]"
              aria-label={`เพิ่ม ${item.name_th}`}
            >
              + เพิ่มลงตะกร้า
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
