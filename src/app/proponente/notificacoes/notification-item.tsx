'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, IconChatBubble, IconArrowRight } from '@/components/ui'

interface NotificationItemProps {
  id: string
  titulo: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  lidaEm: string | null
  createdAt: string
  /** Marca este item com os ids do tour guiado — só o primeiro da lista precisa. */
  destaqueTour?: boolean
}

export function NotificationItem({
  id,
  titulo,
  corpo,
  link,
  ctaLabel,
  lidaEm,
  createdAt,
  destaqueTour,
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
    <li className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
      <span
        aria-hidden="true"
        // deslop-ignore-next-line 19 — avatar circular, não card/input
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:h-10 sm:w-10"
      >
        <IconChatBubble className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div
          id={destaqueTour ? 'tour-notificacoes-item' : undefined}
          className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
        >
          <p className="flex min-w-0 items-center gap-2 break-words text-sm text-slate-900 sm:text-base">
            {!isRead && (
              <span
                aria-hidden="true"
                // deslop-ignore-next-line 19 — dot de não-lida, não card/input
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
              />
            )}
            <span className={isRead ? 'font-normal' : 'font-semibold'}>
              {titulo}
              {!isRead && <span className="sr-only"> (não lida)</span>}
            </span>
          </p>
          <time dateTime={createdAt} className="shrink-0 whitespace-nowrap text-xs text-slate-500">
            {new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </time>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{corpo}</p>

        <div
          id={destaqueTour ? 'tour-notificacoes-acoes-item' : undefined}
          className="mt-3 flex flex-wrap items-center gap-4"
        >
          {link && (
            <Link
              href={link}
              onClick={markRead}
              className="inline-flex min-h-[44px] items-center gap-1 py-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {ctaLabel ?? 'Acessar'}
              <IconArrowRight className="h-3.5 w-3.5" />
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
    </li>
  )
}
