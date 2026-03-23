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
          'rounded-full px-4 py-2 text-sm font-semibold flex-shrink-0 transition-colors',
          activeId === null
            ? 'bg-[var(--brand-primary)] text-white shadow-sm'
            : 'bg-[var(--brand-primary-light)] text-[var(--brand-text-secondary)] hover:opacity-80'
        )}
      >
        ทั้งหมด / All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold flex-shrink-0 transition-colors whitespace-nowrap',
            activeId === cat.id
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'bg-[var(--brand-primary-light)] text-[var(--brand-text-secondary)] hover:opacity-80'
          )}
        >
          {cat.name_th}
        </button>
      ))}
    </div>
  )
}
