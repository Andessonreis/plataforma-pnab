'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'

interface NotificationItemProps {
  id: string
  titulo: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  lidaEm: string | null
  createdAt: string
}

export function NotificationItem({
  id,
  titulo,
  corpo,
  link,
  ctaLabel,
  lidaEm,
  createdAt,
}: NotificationItemProps) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)
  const [isRead, setIsRead] = useState(!!lidaEm)

  async function markRead() {
    if (isRead) return
    setMarking(true)
    setIsRead(true)
    try {
      await fetch(`/api/proponente/notifications/${id}/read`, { method: 'POST' })
      router.refresh()
    } finally {
      setMarking(false)
    }
  }

  return (
    <li>
      <Card
        padding="sm"
        className={`sm:p-4 transition-colors ${
          isRead ? 'bg-white' : 'bg-brand-50/40 border-brand-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {!isRead && (
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 rounded-full bg-brand-600 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p
                className={`text-sm sm:text-base ${
                  isRead ? 'text-slate-700' : 'font-semibold text-slate-900'
                }`}
              >
                {titulo}
              </p>
              <p className="text-[11px] text-slate-400 shrink-0">
                {new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-wrap">{corpo}</p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {link && (
                <Link
                  href={link}
                  onClick={markRead}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {ctaLabel ?? 'Acessar'} →
                </Link>
              )}
              {!isRead && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={markRead}
                  loading={marking}
                  className="text-xs"
                >
                  Marcar como lida
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </li>
  )
}
