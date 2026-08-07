'use client'

import { Badge, Button, Card, InlineFeedback } from '@/components/ui'

interface EditorTopbarProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  hasOverride: boolean
  sensitive: boolean
  dirty: boolean
  savedAt: string | null
  savedByName: string | null
  saving: boolean
  saveError: string | null
  onSave: () => void
  testSending: boolean
  testFeedback: { type: 'success' | 'error'; message: string } | null
  onTestSend: () => void
}

export function EditorTopbar({
  enabled,
  onEnabledChange,
  hasOverride,
  sensitive,
  dirty,
  savedAt,
  savedByName,
  saving,
  saveError,
  onSave,
  testSending,
  testFeedback,
  onTestSend,
}: EditorTopbarProps) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {enabled ? (
            <Badge variant="success">Personalização ativa</Badge>
          ) : hasOverride ? (
            <Badge variant="neutral">Personalização inativa</Badge>
          ) : (
            <Badge variant="neutral">Usando texto padrão</Badge>
          )}
          {sensitive && <Badge variant="warning">E-mail sensível</Badge>}
          {dirty && <Badge variant="warning">Alterações não salvas</Badge>}
          {savedAt && !dirty && (
            <span className="text-xs text-slate-500">
              Salvo em {new Date(savedAt).toLocaleString('pt-BR')}
              {savedByName && ` por ${savedByName}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Usar este texto personalizado
          </label>
          <Button
            onClick={onTestSend}
            disabled={testSending}
            size="sm"
            variant="secondary"
            title="Envia este e-mail (com as alterações atuais) pro seu endereço logado"
          >
            {testSending ? 'Enviando...' : 'Enviar pra mim'}
          </Button>
          <Button onClick={onSave} disabled={saving || !dirty} size="sm">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
      {saveError && (
        <div className="mt-3">
          <InlineFeedback type="error" message={saveError} />
        </div>
      )}
      {testFeedback && (
        <div className="mt-3">
          <InlineFeedback type={testFeedback.type} message={testFeedback.message} />
        </div>
      )}
    </Card>
  )
}
