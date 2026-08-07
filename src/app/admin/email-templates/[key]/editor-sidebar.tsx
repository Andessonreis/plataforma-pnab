'use client'

import { Badge, Card } from '@/components/ui'
import type { PlaceholderSpec } from '@/lib/mail/placeholders'

interface EditorSidebarProps {
  placeholders: PlaceholderSpec[]
  onInsertPlaceholder: (key: string) => void
  previewHtml: string | null
  previewError: string | null
  previewLoading: boolean
}

export function EditorSidebar({
  placeholders,
  onInsertPlaceholder,
  previewHtml,
  previewError,
  previewLoading,
}: EditorSidebarProps) {
  return (
    <div className="lg:col-span-2 space-y-3">
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Atalhos disponíveis</h3>
        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Clique pra inserir no texto. O <strong>sistema preenche cada um automaticamente</strong> com os
          dados do destinatário no momento do envio — você não precisa adivinhar o valor.
        </p>
        <ul className="space-y-1.5">
          {placeholders.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => onInsertPlaceholder(p.key)}
                className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 border border-slate-200 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-brand-700 font-medium">{'{{' + p.key + '}}'}</code>
                  {p.required && <Badge variant="warning" className="shrink-0">obrigatório</Badge>}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{p.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">Pré-visualização</h3>
          {previewLoading && <span className="text-[11px] text-slate-500">Atualizando...</span>}
        </div>
        {previewError ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {previewError}
          </div>
        ) : previewHtml ? (
          <iframe
            title="Preview do e-mail"
            srcDoc={previewHtml}
            sandbox=""
            className="w-full h-[420px] rounded-md border border-slate-200 bg-white"
          />
        ) : (
          <div className="h-[420px] rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
            {previewLoading ? 'Gerando preview...' : 'Sem preview'}
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
          A pré-visualização usa <strong>valores de exemplo</strong> nos atalhos (ex: &ldquo;Edital PNAB Música 2026&rdquo;).
          No envio real, cada destinatário recebe o e-mail com os dados específicos da inscrição/recurso/etc dele.
        </p>
      </Card>
    </div>
  )
}
