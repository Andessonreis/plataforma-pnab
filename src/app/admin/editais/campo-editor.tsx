'use client'

import { Select } from '@/components/ui'
import type { CampoFormulario, CampoTipo } from '@/types/campo-formulario'
import { TIPO_CAMPO_TODOS_OPTIONS } from './campo-formulario-options'
import { CampoInfoFields } from './campo-info-fields'
import { CampoTabelaFields } from './campo-tabela-fields'
import { CampoGrupoFields } from './campo-grupo-fields'
import { CampoSimplesFields } from './campo-simples-fields'

interface CampoEditorProps {
  campo: CampoFormulario
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<CampoFormulario>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

// ─── Editor de um elemento (campo) de uma etapa customizada ─────────────────
// Os campos específicos de cada tipo (info/tabela/grupo_repetivel/simples)
// vivem em componentes próprios — ver campo-*-fields.tsx nesta pasta.

function CampoEditor({ campo, index, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown }: CampoEditorProps) {
  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Elemento {index + 1} — {campo.tipo}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded text-xs"
            aria-label="Mover para cima"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded text-xs"
            aria-label="Mover para baixo"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
          >
            Remover
          </button>
        </div>
      </div>

      <Select
        label="Tipo do elemento"
        value={campo.tipo}
        onChange={(e) => onChange({ tipo: e.target.value as CampoTipo })}
        options={TIPO_CAMPO_TODOS_OPTIONS}
      />

      {campo.tipo === 'info' && (
        <CampoInfoFields campo={campo} index={index} onChange={onChange} />
      )}

      {campo.tipo === 'tabela' && (
        <CampoTabelaFields campo={campo} onChange={onChange} />
      )}

      {campo.tipo === 'grupo_repetivel' && (
        <CampoGrupoFields campo={campo} onChange={onChange} />
      )}

      {campo.tipo !== 'info' && campo.tipo !== 'tabela' && campo.tipo !== 'grupo_repetivel' && (
        <CampoSimplesFields campo={campo} onChange={onChange} />
      )}
    </div>
  )
}

export { CampoEditor }
export type { CampoEditorProps }
