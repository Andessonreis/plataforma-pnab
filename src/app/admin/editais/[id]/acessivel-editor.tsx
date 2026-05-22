'use client'

import { useState } from 'react'
import { Button, Card } from '@client/components/ui'
import Link from 'next/link'
import { editaisClient } from '@client/api/editais.client'

interface AcessivelEditorProps {
  editalId: string
  initialContent: string
  editalSlug: string
}

export function AcessivelEditor({ editalId, initialContent, editalSlug }: AcessivelEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    setLoading(true)
    setMessage(null)

    try {
      await editaisClient.updateAcessivel(editalId, content)
      setMessage({ type: 'success', text: 'Conteúdo acessível salvo com sucesso.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Versão Acessível (WCAG AA)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            HTML semântico do edital para acessibilidade. Scripts e iframes são removidos automaticamente.
          </p>
        </div>
        {content && (
          <Link
            href={`/editais/${editalSlug}/acessivel`}
            target="_blank"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0"
          >
            Visualizar
          </Link>
        )}
      </div>

      {message && (
        <div
          className={[
            'rounded-lg p-3 text-sm font-medium mb-4',
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
        placeholder="<h2>Título do Edital</h2>
<p>Conteúdo acessível do edital em HTML semântico...</p>
<h3>Objetivo</h3>
<p>Descreva o objetivo do edital...</p>"
      />

      <div className="flex items-center gap-3 mt-4">
        <Button
          onClick={handleSave}
          disabled={loading || !content.trim()}
          variant="primary"
        >
          {loading ? 'Salvando...' : 'Salvar Conteúdo Acessível'}
        </Button>
        <span className="text-xs text-slate-400">
          Use tags HTML semânticas: h2, h3, p, ul, ol, table, a
        </span>
      </div>
    </Card>
  )
}
