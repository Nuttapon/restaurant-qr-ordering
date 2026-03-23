'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { MenuCategory, MenuItem } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { MenuForm } from '@/components/admin/MenuForm'

interface Props {
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

interface CategoryFormData {
  name_th: string
  name_en: string
  sort_order: number
}

const DEFAULT_CATEGORY_FORM: CategoryFormData = {
  name_th: '',
  name_en: '',
  sort_order: 0,
}

export function MenuManagementClient({ categories: initialCategories, menuItems: initialMenuItems }: Props) {
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories')
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(DEFAULT_CATEGORY_FORM)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Menu item form state
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const supabase = getSupabaseBrowserClient()

  // ---- Categories ----

  function openAddCategory() {
    setEditingCategory(null)
    setCategoryForm(DEFAULT_CATEGORY_FORM)
    setCategoryError(null)
    setShowCategoryForm(true)
  }

  function openEditCategory(cat: MenuCategory) {
    setEditingCategory(cat)
    setCategoryForm({ name_th: cat.name_th, name_en: cat.name_en, sort_order: cat.sort_order })
    setCategoryError(null)
    setShowCategoryForm(true)
  }

  function cancelCategoryForm() {
    setShowCategoryForm(false)
    setEditingCategory(null)
    setCategoryError(null)
  }

  async function handleSaveCategory() {
    if (!categoryForm.name_th.trim() || !categoryForm.name_en.trim()) {
      setCategoryError('Both Thai and English names are required.')
      return
    }
    setCategoryLoading(true)
    setCategoryError(null)

    if (editingCategory) {
      const { data, error } = await supabase
        .from('menu_categories')
        .update({
          name_th: categoryForm.name_th.trim(),
          name_en: categoryForm.name_en.trim(),
          sort_order: categoryForm.sort_order,
        })
        .eq('id', editingCategory.id)
        .select()
        .single()

      if (error) {
        setCategoryError(error.message)
      } else {
        setCategories(prev => prev.map(c => (c.id === editingCategory.id ? (data as MenuCategory) : c)))
        setShowCategoryForm(false)
        setEditingCategory(null)
      }
    } else {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert({
          name_th: categoryForm.name_th.trim(),
          name_en: categoryForm.name_en.trim(),
          sort_order: categoryForm.sort_order,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        setCategoryError(error.message)
      } else {
        setCategories(prev => [data as MenuCategory, ...prev])
        setShowCategoryForm(false)
      }
    }

    setCategoryLoading(false)
  }

  async function handleToggleCategoryActive(cat: MenuCategory) {
    const { data, error } = await supabase
      .from('menu_categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id)
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => prev.map(c => (c.id === cat.id ? (data as MenuCategory) : c)))
    }
  }

  async function handleDeleteCategory(cat: MenuCategory) {
    if (!confirm(`Delete category "${cat.name_th}"? This cannot be undone.`)) return

    const { error } = await supabase.from('menu_categories').delete().eq('id', cat.id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
    }
  }

  // ---- Menu Items ----

  function openAddItem() {
    setEditingItem(null)
    setShowItemForm(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setShowItemForm(true)
  }

  function cancelItemForm() {
    setShowItemForm(false)
    setEditingItem(null)
  }

  function handleItemSaved(item: MenuItem) {
    setMenuItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i => (i.id === item.id ? item : i))
      }
      return [item, ...prev]
    })
    setShowItemForm(false)
    setEditingItem(null)
  }

  async function handleToggleItemAvailable(item: MenuItem) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
      .select()
      .single()

    if (!error && data) {
      setMenuItems(prev => prev.map(i => (i.id === item.id ? (data as MenuItem) : i)))
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    if (!confirm(`Delete item "${item.name_th}"? This cannot be undone.`)) return

    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (!error) {
      setMenuItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  // ---- Group items by category ----

  const itemsByCategory = categories.map(cat => ({
    category: cat,
    items: menuItems.filter(i => i.category_id === cat.id),
  }))

  const uncategorisedItems = menuItems.filter(
    i => !categories.find(c => c.id === i.category_id)
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Menu Items ({menuItems.length})
        </button>
      </div>

      {/* ---- Categories Tab ---- */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Categories</h2>
            {!showCategoryForm && (
              <button
                onClick={openAddCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + Add Category
              </button>
            )}
          </div>

          {/* Inline category form */}
          {showCategoryForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-3">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name (Thai) *</label>
                  <input
                    type="text"
                    value={categoryForm.name_th}
                    onChange={e => setCategoryForm(f => ({ ...f, name_th: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อภาษาไทย"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    value={categoryForm.name_en}
                    onChange={e => setCategoryForm(f => ({ ...f, name_en: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="English name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={e => setCategoryForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {categoryError && (
                <p className="text-red-600 text-sm mt-2">{categoryError}</p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveCategory}
                  disabled={categoryLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {categoryLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelCategoryForm}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Category list */}
          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-gray-400 text-sm py-8 text-center">No categories yet.</p>
            )}
            {categories.map(cat => (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {cat.name_th}
                    <span className="text-gray-400 font-normal ml-2">/ {cat.name_en}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Sort: {cat.sort_order}</p>
                </div>

                {/* is_active toggle */}
                <button
                  onClick={() => handleToggleCategoryActive(cat)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    cat.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.is_active ? 'Active' : 'Inactive'}
                </button>

                <button
                  onClick={() => openEditCategory(cat)}
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Menu Items Tab ---- */}
      {activeTab === 'items' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Menu Items</h2>
            {!showItemForm && (
              <button
                onClick={openAddItem}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Item form */}
          {showItemForm && (
            <div className="mb-6">
              <MenuForm
                categories={categories}
                item={editingItem}
                onSave={handleItemSaved}
                onCancel={cancelItemForm}
              />
            </div>
          )}

          {/* Items grouped by category */}
          {itemsByCategory.map(({ category, items }) => (
            <div key={category.id} className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {category.name_th} / {category.name_en}
              </h3>
              {items.length === 0 && (
                <p className="text-gray-400 text-sm pl-1">No items in this category.</p>
              )}
              <div className="space-y-2">
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggleAvailable={() => handleToggleItemAvailable(item)}
                    onEdit={() => openEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                  />
                ))}
              </div>
            </div>
          ))}

          {uncategorisedItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Uncategorised
              </h3>
              <div className="space-y-2">
                {uncategorisedItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggleAvailable={() => handleToggleItemAvailable(item)}
                    onEdit={() => openEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {menuItems.length === 0 && (
            <p className="text-gray-400 text-sm py-8 text-center">No menu items yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// Sub-component for a single item row
function ItemRow({
  item,
  onToggleAvailable,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  onToggleAvailable: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
      {/* Thumbnail */}
      {item.image_url ? (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={item.image_url} alt={item.name_en} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
          <span className="text-gray-300 text-xl">🍽</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">
          {item.name_th}
          <span className="text-gray-400 font-normal ml-2">/ {item.name_en}</span>
        </p>
        <p className="text-sm text-blue-700 font-semibold">{formatPrice(item.price)}</p>
      </div>

      {/* is_available toggle */}
      <button
        onClick={onToggleAvailable}
        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
          item.is_available
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {item.is_available ? 'Available' : 'Unavailable'}
      </button>

      <button
        onClick={onEdit}
        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 flex-shrink-0"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 text-sm px-2 py-1 flex-shrink-0"
      >
        Delete
      </button>
    </div>
  )
}
