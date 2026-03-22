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
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeId === null
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        ทั้งหมด / All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            activeId === cat.id
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {cat.name_th}
        </button>
      ))}
    </div>
  )
}
