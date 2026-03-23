'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { MenuCategory, MenuItem } from '@/types/database'

interface Props {
  categories: MenuCategory[]
  item?: MenuItem | null
  onSave: (item: MenuItem) => void
  onCancel: () => void
}

export function MenuForm({ categories, item, onSave, onCancel }: Props) {
  const isEdit = !!item

  const [categoryId, setCategoryId] = useState(item?.category_id ?? (categories[0]?.id ?? ''))
  const [nameTh, setNameTh] = useState(item?.name_th ?? '')
  const [nameEn, setNameEn] = useState(item?.name_en ?? '')
  const [descriptionTh, setDescriptionTh] = useState(item?.description_th ?? '')
  const [descriptionEn, setDescriptionEn] = useState(item?.description_en ?? '')
  const [price, setPrice] = useState(item?.price?.toString() ?? '')
  const [sortOrder, setSortOrder] = useState(item?.sort_order?.toString() ?? '0')
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke blob URL on change/unmount to avoid memory leaks
  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, or GIF images are allowed.')
        e.target.value = ''
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError('Image must be smaller than 5 MB.')
        e.target.value = ''
        return
      }
    }
    setError(null)
    setImageFile(file)
    if (!file) setImagePreview(item?.image_url ?? null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nameTh.trim() || !nameEn.trim()) {
      setError('Both Thai and English names are required.')
      return
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price.')
      return
    }

    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      let imageUrl: string | null = item?.image_url ?? null

      if (imageFile) {
        const path = `menu-items/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(path, imageFile, { upsert: true })

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`)
          setLoading(false)
          return
        }

        imageUrl = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl
      }

      const payload = {
        category_id: categoryId,
        name_th: nameTh.trim(),
        name_en: nameEn.trim(),
        description_th: descriptionTh.trim() || null,
        description_en: descriptionEn.trim() || null,
        price: parsedPrice,
        sort_order: parseInt(sortOrder) || 0,
        is_available: isAvailable,
        image_url: imageUrl,
      }

      let savedItem: MenuItem

      if (isEdit && item) {
        const { data, error: updateError } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single()

        if (updateError) {
          setError(updateError.message)
          setLoading(false)
          return
        }
        savedItem = data as MenuItem
      } else {
        const { data, error: insertError } = await supabase
          .from('menu_items')
          .insert(payload)
          .select()
          .single()

        if (insertError) {
          setError(insertError.message)
          setLoading(false)
          return
        }
        savedItem = data as MenuItem
      }

      setLoading(false)
      onSave(savedItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      <h3 className="font-semibold text-gray-700 mb-4">
        {isEdit ? 'Edit Menu Item' : 'New Menu Item'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Category */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name_th} / {cat.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Name TH */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Name (Thai) *</label>
          <input
            type="text"
            value={nameTh}
            onChange={e => setNameTh(e.target.value)}
            placeholder="ชื่อภาษาไทย"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        {/* Name EN */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Name (English) *</label>
          <input
            type="text"
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder="English name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        {/* Description TH */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Description (Thai)</label>
          <textarea
            value={descriptionTh}
            onChange={e => setDescriptionTh(e.target.value)}
            placeholder="คำอธิบายภาษาไทย"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
          />
        </div>

        {/* Description EN */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Description (English)</label>
          <textarea
            value={descriptionEn}
            onChange={e => setDescriptionEn(e.target.value)}
            placeholder="English description"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Price (฿) *</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        {/* is_available */}
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="is_available"
            type="checkbox"
            checked={isAvailable}
            onChange={e => setIsAvailable(e.target.checked)}
            className="w-4 h-4 accent-[var(--brand-primary)] rounded"
          />
          <label htmlFor="is_available" className="text-sm font-medium text-gray-600">
            Available for ordering
          </label>
        </div>

        {/* Image upload */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--brand-primary-light)] file:text-[var(--brand-primary)] hover:file:bg-[var(--brand-primary-light)]/80"
          />
          {imagePreview && (
            <div className="relative w-24 h-24 mt-2 rounded-lg overflow-hidden border border-gray-200">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={imageFile !== null} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-3">{error}</p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--brand-primary)] text-white px-5 py-2 rounded-lg text-sm hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : isEdit ? 'Update Item' : 'Add Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
