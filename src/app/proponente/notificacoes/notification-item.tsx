'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import { linkTexto } from '../estilos'

interface NotificationItemProps {
  id: string
  titulo: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  lidaEm: string | null
  createdAt: string
  /** Só o primeiro aviso da página recebe as âncoras do tour guiado. */
  destaqueTour?: boolean
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

/** Avisos antigos não guardam o texto do botão; o destino do link já diz o que ele abre. */
function rotuloDoLink(link: string): string {
  if (link.startsWith('/proponente/inscricoes/')) return 'Ver inscrição'
  if (link.startsWith('/proponente/perfil')) return 'Abrir meu perfil'
  if (link.startsWith('/editais/')) return 'Ver edital'
  return 'Abrir'
}

/**
 * Um aviso no fio do dia: hora à esquerda, título e texto, e as ações. Não
 * lido não depende só de cor: leva a palavra "Novo" e título em negrito.
 * Abrir o link já marca como lido, porque é o que a pessoa veio fazer.
 */
export function NotificationItem({ id, titulo, corpo, link, ctaLabel, lidaEm, createdAt, destaqueTour }: NotificationItemProps) {
  const router = useRouter()
  const [lida, setLida] = useState(!!lidaEm)
  const [marcando, setMarcando] = useState(false)
  const tituloId = `aviso-${id}`

  async function marcarComoLida() {
    if (lida) return
    setLida(true)
    setMarcando(true)
    try {
      await fetch(`/api/proponente/notifications/${id}/read`, { method: 'POST' })
      router.refresh()
    } finally {
      setMarcando(false)
    }
  }

  return (
    <li
      aria-labelledby={tituloId}
      className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 border-b border-tinta-900/15 py-5 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)]"
    >
      <time dateTime={createdAt} className={`pt-0.5 text-sm tabular-nums ${lida ? 'text-tinta-700' : 'font-bold text-brand-700'}`}>
        {hora(createdAt)}
      </time>

      <div className="min-w-0">
        <h3 id={tituloId} className={`leading-snug ${lida ? 'text-tinta-800' : 'font-bold text-tinta-900'}`}>
          {!lida && (
            <span
              id={destaqueTour ? 'tour-notificacoes-item' : undefined}
              // deslop-ignore-next-line 10 28 — "Novo" escrito: o não lido não pode depender só de cor
              className="mr-2 inline-block -translate-y-px bg-brand-700 px-1.5 py-0.5 align-middle text-xs font-bold uppercase tracking-wider text-papel-50"
            >
              Novo
            </span>
          )}
          {titulo}
        </h3>
        <p className="mt-1.5 max-w-prose whitespace-pre-wrap text-tinta-700">{corpo}</p>

        {(link || !lida) && (
          <div id={destaqueTour ? 'tour-notificacoes-acoes-item' : undefined} className="mt-1 flex flex-wrap items-center gap-x-6">
            {link && (
              <Link href={link} onClick={marcarComoLida} className={linkTexto}>
                {ctaLabel ?? rotuloDoLink(link)}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
            {!lida && (
              <button
                type="button"
                onClick={marcarComoLida}
                disabled={marcando}
                className="inline-flex min-h-[44px] items-center text-sm text-tinta-700 underline decoration-tinta-900/30 underline-offset-4 [@media(hover:hover)]:hover:text-tinta-900 [@media(hover:hover)]:hover:decoration-tinta-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
              >
                Marcar como lido
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
