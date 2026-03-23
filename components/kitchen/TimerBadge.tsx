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
      ? 'bg-green-500 text-white'
      : minutes < 10
        ? 'bg-yellow-400 text-gray-900'
        : 'bg-red-500 text-white animate-pulse'

  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', colorClass)}>
      {label}
    </span>
  )
}
