'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlaceholderSpec } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'
import { EditorTopbar } from './editor-topbar'
import { SensitiveWarning } from './sensitive-warning'
import { EditorFields } from './editor-fields'
import { EditorSidebar } from './editor-sidebar'

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
  const [testSending, setTestSending] = useState(false)
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const dirty =
    (initial?.subject ?? '') !== subject ||
    (initial?.body ?? '') !== body ||
    (initial?.enabled ?? false) !== enabled

  // Renderiza preview ao montar e atualiza em tempo real (debounced 400ms)
  // conforme admin digita — igual ao notification-preview das campanhas.
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

  // Debounce — espera o admin parar de digitar 400ms antes de fazer fetch.
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPreview()
    }, 400)
    return () => clearTimeout(timer)
  }, [refreshPreview])

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
      setTimeout(() => setTestFeedback(null), 8000)
    } catch (err) {
      setTestFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro de rede' })
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <EditorTopbar
        enabled={enabled}
        onEnabledChange={setEnabled}
        hasOverride={!!initial}
        sensitive={meta.sensitive}
        dirty={dirty}
        savedAt={savedAt}
        savedByName={initial?.updatedByName ?? null}
        saving={saving}
        saveError={saveError}
        onSave={handleSave}
        testSending={testSending}
        testFeedback={testFeedback}
        onTestSend={handleTestSend}
      />

      {meta.sensitive && <SensitiveWarning />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <EditorFields subject={subject} onSubjectChange={setSubject} body={body} onBodyChange={setBody} bodyRef={bodyRef} />
        <EditorSidebar
          placeholders={meta.placeholders}
          onInsertPlaceholder={insertPlaceholder}
          previewHtml={previewHtml}
          previewError={previewError}
          previewLoading={previewLoading}
        />
      </div>
    </div>
  )
}
