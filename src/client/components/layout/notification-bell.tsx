'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Popover, PopoverTrigger, PopoverContent } from '@client/components/ui/popover'

interface NotificationItem {
  id: string
  titulo: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  lidaEm: string | null
  createdAt: string
}

const POLL_INTERVAL_MS = 60_000 // 1 min

function timeAgo(iso: string): string {
  const date = new Date(iso)
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'agora'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `${diffD}d`
}

export function NotificationBell({ listLink = '/proponente/notificacoes' }: { listLink?: string }) {
  const [count, setCount] = useState<number>(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/proponente/notifications/unread-count', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count ?? 0)
    } catch {
      // silencioso — não bloqueia a UI
    }
  }, [])

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/proponente/notifications?pageSize=5&lida=false', {
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.data ?? [])
      setLoaded(true)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const t = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [fetchCount])

  async function markAsRead(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id))
    setCount((c) => Math.max(0, c - 1))
    try {
      await fetch(`/api/proponente/notifications/${id}/read`, { method: 'POST' })
    } catch {
      // se falhar, refetch reconcilia
      fetchCount()
      fetchItems()
    }
  }

  return (
    <Popover onOpenChange={(open) => open && fetchItems()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
          className="relative inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {count > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none"
              aria-hidden="true"
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notificações</p>
          <Link
            href={listLink}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Ver todas
          </Link>
        </div>

        {!loaded ? (
          <div className="p-6 text-center text-xs text-slate-400">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Nenhuma notificação nova.
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id} className="p-3 hover:bg-slate-50">
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => markAsRead(n.id)}
                    className="block"
                  >
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.titulo}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.corpo}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => markAsRead(n.id)}
                    className="text-left w-full"
                  >
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.titulo}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.corpo}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
