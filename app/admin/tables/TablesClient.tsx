'use client'

import { useState, useRef, useEffect } from 'react'
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
        className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col items-center gap-4"
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
          className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
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

const STATUS_BADGE: Record<Table['status'], string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-yellow-100 text-yellow-800',
  bill_requested: 'bg-pink-100 text-pink-800',
}

export function TablesClient({ tables: initialTables }: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  async function handleAddTable() {
    const input = window.prompt('Enter table number:')
    if (input === null) return

    const tableNumber = parseInt(input, 10)
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
        <button
          onClick={handleAddTable}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Add Table
        </button>
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
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_BADGE[table.status]
                      )}
                    >
                      {table.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                    {table.qr_token ? `${table.qr_token.slice(0, 10)}…` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedTable(table)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-500 transition-colors"
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
          baseUrl={baseUrl}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  )
}
