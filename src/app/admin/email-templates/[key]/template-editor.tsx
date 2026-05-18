'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
import type { PlaceholderSpec } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'

interface InitialState {
  subject: string
  body: string
  enabled: boolean
  updatedAt: string
  updatedByName: string | null
}

interface Props {
  templateKey: EmailTemplate
  meta: {
    label: string
    sensitive: boolean
    placeholders: PlaceholderSpec[]
  }
  initial: InitialState | null
}

const DEFAULT_BODY_HINT = `<p>Olá, <strong>{{nome}}</strong>!</p>
<p>Conteúdo do e-mail aqui.</p>
<p>Use {{placeholders}} listados ao lado para inserir dados dinâmicos.</p>`

export function TemplateEditor({ templateKey, meta, initial }: Props) {
  const [subject, setSubject] = useState(initial?.subject ?? `[${meta.label}]`)
  const [body, setBody] = useState(initial?.body ?? DEFAULT_BODY_HINT)
  const [enabled, setEnabled] = useState(initial?.enabled ?? false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(initial?.updatedAt ?? null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const dirty =
    (initial?.subject ?? '') !== subject ||
    (initial?.body ?? '') !== body ||
    (initial?.enabled ?? false) !== enabled

  // Renderiza preview ao montar e quando o usuário clica em "Atualizar preview".
  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await fetch(`/api/admin/email-templates/${templateKey}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPreviewError(json.message ?? 'Falha ao gerar preview')
        return
      }
      setPreviewHtml(json.data.html)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setPreviewLoading(false)
    }
  }, [templateKey, subject, body])

  useEffect(() => {
    refreshPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function insertPlaceholder(key: string) {
    const textarea = bodyRef.current
    if (!textarea) {
      setBody((b) => `${b}{{${key}}}`)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const insert = `{{${key}}}`
    setBody((b) => b.slice(0, start) + insert + b.slice(end))
    // Reposiciona o cursor após a inserção.
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + insert.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/admin/email-templates/${templateKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, enabled }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.message ?? 'Falha ao salvar')
        return
      }
      setSavedAt(json.data.updatedAt)
      await refreshPreview()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setSaving(false)
    }
  }

  const [testSending, setTestSending] = useState(false)
  const [testFeedback, setTestFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null)

  async function handleTestSend() {
    setTestSending(true)
    setTestFeedback(null)
    try {
      const res = await fetch(`/api/admin/email-templates/${templateKey}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const json = await res.json()
      if (!res.ok) {
        setTestFeedback({ type: 'error', message: json.message ?? 'Falha ao enviar teste' })
        return
      }
      setTestFeedback({ type: 'success', message: json.message })
      // Limpa a notificação após 8s
      setTimeout(() => setTestFeedback(null), 8000)
    } catch (err) {
      setTestFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro de rede',
      })
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar: status + ações */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {enabled ? (
              <Badge variant="success">Override ativo</Badge>
            ) : initial ? (
              <Badge variant="neutral">Override desativado</Badge>
            ) : (
              <Badge variant="neutral">Sem override (usa padrão)</Badge>
            )}
            {meta.sensitive && <Badge variant="warning">Template sensível</Badge>}
            {dirty && <Badge variant="warning">Alterações não salvas</Badge>}
            {savedAt && !dirty && (
              <span className="text-xs text-slate-500">
                Salvo em {new Date(savedAt).toLocaleString('pt-BR')}
                {initial?.updatedByName && ` por ${initial.updatedByName}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Ativar override
            </label>
            <Button
              onClick={handleTestSend}
              disabled={testSending}
              size="sm"
              variant="secondary"
              title="Envia o template (com as alterações atuais) pro seu e-mail"
            >
              {testSending ? 'Enviando...' : 'Enviar pra mim'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
        {saveError && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {saveError}
          </div>
        )}
        {testFeedback && (
          <div
            className={`mt-3 text-sm rounded px-3 py-2 ${
              testFeedback.type === 'success'
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}
          >
            {testFeedback.message}
          </div>
        )}
      </Card>

      {/* Aviso de template sensível */}
      {meta.sensitive && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex gap-3 items-start">
            <span aria-hidden className="text-red-600 text-xl leading-none">⚠</span>
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-1">Template sensível — cuidado ao habilitar override</p>
              <p className="text-red-800 leading-relaxed">
                Este e-mail é parte de um fluxo crítico (autenticação / recuperação). Se o override
                quebrar (ex: link <code className="bg-red-100 px-1 rounded">{'{{resetUrl}}'}</code> esquecido),
                usuários ficam sem conseguir recuperar a senha. Use override só se houver real necessidade
                de mudança de copy. Em caso de dúvida, deixe desativado para usar o template padrão.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Editor (3/5) */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {subject.length}/255 caracteres
            </p>
          </Card>

          <Card>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Corpo (HTML)</label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={50_000}
              rows={18}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              spellCheck={false}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Tags permitidas: p, br, strong, em, h1-h4, ul, ol, li, a, img, table, hr. Scripts e formulários
              são bloqueados na sanitização. {body.length}/50000
            </p>
          </Card>
        </div>

        {/* Sidebar de placeholders + Preview (2/5) */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Placeholders disponíveis</h3>
            <p className="text-[11px] text-slate-500 mb-2">Clique pra inserir no cursor</p>
            <ul className="space-y-1.5">
              {meta.placeholders.map((p) => (
                <li key={p.key}>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder(p.key)}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-brand-700 font-medium">{'{{' + p.key + '}}'}</code>
                      {p.required && <Badge variant="neutral" className="shrink-0">obrig.</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-tight">
                      {p.description}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
              <Button
                onClick={refreshPreview}
                disabled={previewLoading}
                size="sm"
                variant="secondary"
              >
                {previewLoading ? 'Renderizando...' : 'Atualizar'}
              </Button>
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
            <p className="mt-2 text-[11px] text-slate-500">
              Preview usa dados de exemplo dos placeholders. O envio real substitui pelos valores do destinatário.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
