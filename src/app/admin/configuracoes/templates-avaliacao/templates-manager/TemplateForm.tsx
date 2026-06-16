'use client'

import { Button, Input } from '@client/components/ui'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { Template } from './types'
import { getBlocoSummary } from './helpers'
import { CriterioEditor } from './CriterioEditor'

interface TemplateFormProps {
  editingTemplate: Template | null
  error: string
  loading: boolean
  formNome: string
  setFormNome: (v: string) => void
  formFormula: string
  setFormFormula: (v: string) => void
  formDescricao: string
  setFormDescricao: (v: string) => void
  formCriterios: CriterioAvaliacao[]
  onAddCriterio: () => void
  onRemoveCriterio: (index: number) => void
  onUpdateCriterio: (index: number, field: string, value: unknown) => void
  onSave: () => void
  onClose: () => void
}

export function TemplateForm({
  editingTemplate,
  error,
  loading,
  formNome,
  setFormNome,
  formFormula,
  setFormFormula,
  formDescricao,
  setFormDescricao,
  formCriterios,
  onAddCriterio,
  onRemoveCriterio,
  onUpdateCriterio,
  onSave,
  onClose,
}: TemplateFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={editingTemplate ? 'Editar template' : 'Novo template'}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingTemplate ? 'Editar Template' : 'Novo Template'}
          </h2>
        </div>

        <div className="px-6 py-4 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {editingTemplate?.isSystem && (
            <p className="text-xs text-amber-600">Template do sistema — o nome não pode ser alterado.</p>
          )}

          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do template"
              required
              value={formNome}
              onChange={e => setFormNome(e.target.value)}
              placeholder="Ex: PNAB Cultura Viva"
              disabled={editingTemplate?.isSystem}
            />
            <Input
              label="Fórmula de cálculo"
              value={formFormula}
              onChange={e => setFormFormula(e.target.value)}
              placeholder="Ex: ((B1+B2)/2)+B3"
            />
          </div>

          <div>
            <label htmlFor="tpl-descricao" className="text-sm font-medium text-slate-700 block mb-1.5">
              Descrição <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="tpl-descricao"
              value={formDescricao}
              onChange={e => setFormDescricao(e.target.value)}
              placeholder="Breve descrição do template..."
              rows={2}
              maxLength={1000}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Resumo por bloco */}
          {formCriterios.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getBlocoSummary(formCriterios).map(([bloco, maxPts]) => (
                <span key={bloco} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded">
                  {bloco}: {maxPts} pts max
                </span>
              ))}
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded">
                {formCriterios.length} critério(s)
              </span>
            </div>
          )}

          {/* Editor de critérios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Critérios de Avaliação</h3>
              <Button size="sm" onClick={onAddCriterio}>+ Critério</Button>
            </div>

            {formCriterios.map((c, i) => (
              <CriterioEditor
                key={i}
                criterio={c}
                index={i}
                onUpdate={onUpdateCriterio}
                onRemove={onRemoveCriterio}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? 'Salvando...' : editingTemplate ? 'Salvar alterações' : 'Criar template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
