'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  IconInfo,
  IconExternalLink,
} from '@/components/ui'
import { AvisoRetificacao } from '@/components/edital/faixa-retificacao'
import { formatDate } from '@/lib/utils/format'
import { getEditalInfoParaAvaliador, type EditalInfoAvaliador } from './edital-info-actions'

interface Props {
  editalId: string
}

/**
 * "Ver edital" pro avaliador conferir resumo, categorias e retificações sem
 * sair da fila de avaliação — antes disso a única forma era abrir a página
 * pública numa aba nova.
 */
export function EditalInfoModal({ editalId }: Props) {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<EditalInfoAvaliador | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getEditalInfoParaAvaliador(editalId)
      .then(setInfo)
      .finally(() => setLoading(false))
  }, [open, editalId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline mt-2"
        >
          <IconInfo className="h-4 w-4" />
          Ver edital e retificações
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white max-h-[85vh] flex flex-col sm:max-w-xl overflow-y-auto">
        {loading && !info && (
          <div className="py-10 text-center text-sm text-slate-400">Carregando…</div>
        )}

        {!loading && info === null && open && (
          <div className="py-10 text-center text-sm text-slate-500">
            Não foi possível carregar os dados do edital.
          </div>
        )}

        {info && (
          <>
            <DialogHeader>
              <DialogTitle>{info.titulo}</DialogTitle>
              <DialogDescription>Edição {info.ano}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              {info.categorias.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {info.categorias.map((cat) => (
                    <Badge key={cat} variant="info">{cat}</Badge>
                  ))}
                </div>
              )}

              {info.resumo && (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{info.resumo}</p>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Retificações
                </h3>
                {info.retificacaoVigente ? (
                  <AvisoRetificacao retificacao={info.retificacaoVigente} />
                ) : (
                  <p className="text-sm text-slate-500 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    Nenhuma retificação publicada até agora para este edital.
                  </p>
                )}

                {info.retificacoesAnteriores.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Retificações anteriores ({info.retificacoesAnteriores.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                      {info.retificacoesAnteriores.map((r) => (
                        <li key={r.numero}>
                          <span className="font-medium text-slate-800">Nº {r.numero}</span>
                          <span className="px-1.5 text-slate-300" aria-hidden="true">·</span>
                          <time dateTime={r.publicadoEm} className="tabular-nums">{formatDate(r.publicadoEm)}</time>
                          <span className="px-1.5 text-slate-300" aria-hidden="true">·</span>
                          {r.resumo}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={`/editais/${info.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <IconExternalLink className="h-4 w-4" />
                  Ver página pública do edital (PDF, cronograma completo, anexos)
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
