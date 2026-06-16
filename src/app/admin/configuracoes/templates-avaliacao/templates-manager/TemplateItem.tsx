'use client'

import { Button, Badge } from '@client/components/ui'
import type { Template } from './types'
import { parseCriterios } from './helpers'

interface TemplateItemProps {
  template: Template
  loading: boolean
  onToggleAtivo: (t: Template) => void
  onEdit: (t: Template) => void
  onRequestDelete: (id: string) => void
}

export function TemplateItem({ template: t, loading, onToggleAtivo, onEdit, onRequestDelete }: TemplateItemProps) {
  const criterios = parseCriterios(t.criterios)
  return (
    <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-4 py-2.5">
        <div className="font-medium text-slate-900">{t.nome}</div>
        {t.descricao && <div className="text-xs text-slate-400 line-clamp-1">{t.descricao}</div>}
      </td>
      <td className="px-4 py-2.5 text-center">
        <Badge variant="neutral">{criterios.length}</Badge>
      </td>
      <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">
        {t.formula ? (
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{t.formula}</code>
        ) : (
          <span className="text-slate-300">Média ponderada</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-center">
        {t.ativo ? <Badge variant="success">Ativo</Badge> : <Badge variant="neutral">Inativo</Badge>}
      </td>
      <td className="px-4 py-2.5 text-center">
        {t.isSystem && <Badge variant="info">Sistema</Badge>}
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" onClick={() => onToggleAtivo(t)} disabled={loading}>
            {t.ativo ? 'Desativar' : 'Ativar'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(t)}>Editar</Button>
          {!t.isSystem && (
            <Button variant="danger" size="sm" onClick={() => onRequestDelete(t.id)}>Excluir</Button>
          )}
        </div>
      </td>
    </tr>
  )
}
