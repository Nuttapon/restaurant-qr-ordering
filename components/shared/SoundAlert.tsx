'use client'
import { useCallback } from 'react'

export function useSoundAlert() {
  const playDing = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'

      const scheduleSound = () => {
        oscillator.frequency.setValueAtTime(880, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      }

      if (ctx.state === 'suspended') {
        ctx.resume().then(scheduleSound).catch(() => {})
      } else {
        scheduleSound()
      }
    } catch {
      // AudioContext not available (SSR or restricted environment)
    }
  }, [])

  return { playDing }
}
