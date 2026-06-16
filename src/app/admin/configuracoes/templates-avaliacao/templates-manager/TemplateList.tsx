'use client'

import { Button, Card } from '@client/components/ui'
import type { Template } from './types'
import { TemplateItem } from './TemplateItem'

interface TemplateListProps {
  templates: Template[]
  loading: boolean
  deleteConfirm: string | null
  onToggleAtivo: (t: Template) => void
  onEdit: (t: Template) => void
  onRequestDelete: (id: string) => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
}

export function TemplateList({
  templates,
  loading,
  deleteConfirm,
  onToggleAtivo,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: TemplateListProps) {
  return (
    <Card padding="sm" className="sm:p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-2.5 font-medium text-slate-500">Nome</th>
              <th className="text-center px-4 py-2.5 font-medium text-slate-500">Critérios</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 hidden md:table-cell">Fórmula</th>
              <th className="text-center px-4 py-2.5 font-medium text-slate-500">Status</th>
              <th className="text-center px-4 py-2.5 font-medium text-slate-500">Sistema</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <TemplateItem
                key={t.id}
                template={t}
                loading={loading}
                onToggleAtivo={onToggleAtivo}
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-2">
            Excluir template &quot;{templates.find(t => t.id === deleteConfirm)?.nome}&quot;? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={() => onConfirmDelete(deleteConfirm)} disabled={loading}>
              {loading ? 'Excluindo...' : 'Confirmar exclusão'}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancelDelete} disabled={loading}>Cancelar</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
