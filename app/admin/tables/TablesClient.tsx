'use client'

import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { nanoid } from 'nanoid'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Table } from '@/types/database'
import { cn } from '@/lib/utils'

interface QRModalProps {
  table: Table
  baseUrl: string
  onClose: () => void
}

function QRModal({ table, baseUrl, onClose }: QRModalProps) {
  const url = `${baseUrl}/menu?token=${table.qr_token ?? ''}`
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `table-${table.number}-qr.png`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col items-center gap-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg font-bold text-gray-800">Table {table.number} QR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <QRCodeCanvas value={url} size={256} ref={canvasRef} />

        <div className="w-full">
          <p className="text-xs text-gray-500 mb-1">Customer URL</p>
          <p className="text-xs text-gray-700 break-all bg-gray-50 border border-gray-200 rounded px-2 py-1 select-all">
            {url}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-text-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-text-primary/80 transition-colors"
        >
          Download PNG
        </button>
      </div>
    </div>
  )
}

interface Props {
  tables: Table[]
}

const STATUS_LABELS: Record<Table['status'], string> = {
  available: 'ว่าง',
  occupied: 'มีลูกค้า',
  bill_requested: 'ขอเช็คบิล',
}

const STATUS_BADGE: Record<Table['status'], string> = {
  available: 'bg-status-available-bg text-status-available border-status-available/10',
  occupied: 'bg-status-occupied-bg text-status-occupied border-status-occupied/10',
  bill_requested: 'bg-status-bill-bg text-status-bill border-status-bill/10',
}

export function TablesClient({ tables: initialTables }: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState('')



  async function handleAddTableSubmit() {
    const tableNumber = parseInt(newTableNumber, 10)
    if (isNaN(tableNumber) || tableNumber <= 0) {
      setError('Invalid table number. Please enter a positive integer.')
      return
    }

    const qr_token = nanoid(21)
    const supabase = getSupabaseBrowserClient()

    const { data, error: insertError } = await supabase
      .from('tables')
      .insert({ number: tableNumber, qr_token, status: 'available' })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    setError(null)
    setTables(prev => [...prev, data as Table].sort((a, b) => a.number - b.number))
    setShowAddForm(false)
    setNewTableNumber('')
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button
            className="ml-3 text-red-500 hover:text-red-700 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{tables.length} table{tables.length !== 1 ? 's' : ''}</p>
        {showAddForm ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <input
              type="number"
              value={newTableNumber}
              onChange={e => setNewTableNumber(e.target.value)}
              placeholder="โต๊ะ #"
              className="w-24 border border-text-muted/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddTableSubmit(); if (e.key === 'Escape') { setShowAddForm(false); setNewTableNumber('') } }}
            />
            <button
              onClick={handleAddTableSubmit}
              disabled={!newTableNumber}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              เพิ่ม
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewTableNumber('') }}
              className="text-text-muted hover:text-text-secondary text-sm transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + เพิ่มโต๊ะ
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {tables.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No tables yet. Add one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Table #</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden sm:table-cell">QR Token</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tables.map(table => (
                <tr key={table.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {table.number}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border',
                        STATUS_BADGE[table.status]
                      )}
                    >
                      {STATUS_LABELS[table.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                    {table.qr_token ? `${table.qr_token.slice(0, 10)}…` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedTable(table)}
                      className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors"
                    >
                      QR Code
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTable && (
        <QRModal
          table={selectedTable}
          baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  )
}
