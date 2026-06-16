'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, Card } from '@client/components/ui'

interface Props {
  titulo: string
  assunto?: string
  corpo: string
  link?: string
  ctaLabel?: string
}

type Tab = 'email' | 'inapp'

// Preview ao vivo da notificação. Faz fetch debounced no endpoint
// /api/v1/notificacoes/preview enquanto admin digita.
export function NotificationPreview({ titulo, assunto, corpo, link, ctaLabel }: Props) {
  const [tab, setTab] = useState<Tab>('email')
  const [emailHtml, setEmailHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/v1/notificacoes/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, assunto, corpo, link, ctaLabel }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.message ?? 'Falha ao gerar preview')
          return
        }
        setEmailHtml(json.data.emailHtml)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro de rede')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [titulo, assunto, corpo, link, ctaLabel])

  return (
    <Card padding="sm" className="sm:p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Pré-visualização</h3>
        {loading && <span className="text-[11px] text-slate-500">Atualizando...</span>}
      </div>

      <div className="flex gap-1 mb-3 bg-slate-100 p-0.5 rounded-md text-xs">
        <button
          type="button"
          onClick={() => setTab('email')}
          className={`flex-1 py-1.5 rounded font-medium transition-colors ${
            tab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => setTab('inapp')}
          className={`flex-1 py-1.5 rounded font-medium transition-colors ${
            tab === 'inapp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          No portal
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </div>
      )}

      {tab === 'email' && (
        <div>
          {assunto !== undefined && (
            <div className="mb-2 px-2 py-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
              <span className="font-medium text-slate-500">Assunto: </span>
              <span className="text-slate-900">
                {assunto?.trim() || '(sem assunto — usar título)'}
              </span>
            </div>
          )}
          {emailHtml ? (
            <iframe
              title="Preview do e-mail"
              srcDoc={emailHtml}
              sandbox=""
              className="w-full h-[460px] rounded-md border border-slate-200 bg-white"
            />
          ) : (
            <div className="h-[460px] rounded-md border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              Gerando preview...
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-500 leading-tight">
            Layout final (logo + rodapé) é aplicado em cima do corpo automaticamente. Imagens podem
            ser bloqueadas até o destinatário aceitar exibi-las no Gmail.
          </p>
        </div>
      )}

      {tab === 'inapp' && (
        <div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-2.5 bg-white rounded-md p-3 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-semibold">
                P
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="success">Nova</Badge>
                  <span className="text-[10px] text-slate-400">agora</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {titulo?.trim() || 'Título da notificação'}
                </p>
                <div
                  className="text-xs text-slate-600 mt-1 line-clamp-4 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      corpo?.trim() ||
                      '<span class="text-slate-400">O corpo aparece aqui conforme você digita.</span>',
                  }}
                />
                {link && ctaLabel && (
                  <span className="inline-flex items-center mt-2 text-xs font-medium text-brand-700">
                    {ctaLabel} →
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-tight">
            Aparência aproximada do card no portal. O formato final pode variar levemente.
          </p>
        </div>
      )}
    </Card>
  )
}
