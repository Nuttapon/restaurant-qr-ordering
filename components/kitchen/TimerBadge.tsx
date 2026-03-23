'use client'
import { useState, useEffect } from 'react'
import { timeAgo, cn } from '@/lib/utils'

interface Props {
  createdAt: string
}

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

export function TimerBadge({ createdAt }: Props) {
  const [label, setLabel] = useState<string>(() => timeAgo(createdAt))
  const [minutes, setMinutes] = useState<number>(() => getElapsedMinutes(createdAt))

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(timeAgo(createdAt))
      setMinutes(getElapsedMinutes(createdAt))
    }, 10_000)
    return () => clearInterval(id)
  }, [createdAt])

  const colorClass =
    minutes < 5
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : minutes < 10
        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
        : 'bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse'

  return (
    <span className={cn('text-sm font-bold tabular-nums px-3 py-1 rounded-full border flex items-center gap-1.5', colorClass)}>
      <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  )
}
