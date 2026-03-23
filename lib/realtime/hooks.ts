'use client'
import { useEffect } from 'react'
import { RealtimePostgresChangesPayload } from '@supabase/realtime-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Notification, OrderItem } from '@/types/database'

export function useKitchenNotifications(onNew: (n: Notification) => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.new_order',
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => onNew(payload.new as Notification)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onNew])
}

export function useAdminNotifications(onNew: (n: Notification) => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => onNew(payload.new as Notification)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onNew])
}

export function useOrderItemUpdates(
  orderId: string,
  onUpdate: (item: OrderItem) => void
) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`order-items-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => onUpdate(payload.new as OrderItem)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId, onUpdate])
}
