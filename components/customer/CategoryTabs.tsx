'use client'
import { MenuCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  categories: MenuCategory[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryTabs({ categories, activeId, onSelect }: Props) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-full px-5 py-2.5 min-h-[44px] text-sm font-bold shrink-0 transition-all snap-start shadow-sm',
          activeId === null
            ? 'bg-primary text-white shadow-md scale-100'
            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 scale-95'
        )}
      >
        ทั้งหมด / All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'rounded-full px-5 py-2.5 min-h-[44px] text-sm font-bold flex-shrink-0 transition-all whitespace-nowrap snap-start shadow-sm',
            activeId === cat.id
              ? 'bg-primary text-white shadow-md scale-100'
              : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 scale-95'
          )}
        >
          {cat.name_th}
        </button>
      ))}
    </div>
  )
}
