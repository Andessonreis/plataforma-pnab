'use client'

import { Input, Textarea, Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { generateFieldName } from '@/lib/utils/slug'
import { CampoEditor } from './campo-editor'

interface EtapaEditorProps {
  etapa: EtapaCustomizada
  index: number
  isFirst: boolean
  isLast: boolean
  onUpdate: (patch: Partial<EtapaCustomizada>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddCampo: () => void
  onRemoveCampo: (campoIndex: number) => void
  onMoveCampo: (campoIndex: number, dir: -1 | 1) => void
  onUpdateCampo: (campoIndex: number, patch: Partial<CampoFormulario>) => void
}

// ─── Editor de uma etapa customizada (título, descrição e elementos) ────────

function EtapaEditor({
  etapa,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddCampo,
  onRemoveCampo,
  onMoveCampo,
  onUpdateCampo,
}: EtapaEditorProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-full bg-brand-100 text-brand-700 text-xs font-bold px-2">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {etapa.titulo || 'Nova etapa'}
          </p>
          <p className="text-xs text-slate-500">
            ID: <code className="font-mono">{etapa.id}</code> · {etapa.campos.length} elemento(s)
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
            aria-label="Mover para cima"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
            aria-label="Mover para baixo"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
            aria-label={`Remover etapa ${etapa.titulo || index + 1}`}
          >
            Remover
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Título da etapa"
          value={etapa.titulo}
          onChange={(e) => {
            const titulo = e.target.value
            const autoGenId = etapa.id.startsWith('etapa_') && /^etapa_\d+$/.test(etapa.id)
            onUpdate({
              titulo,
              ...(autoGenId && titulo.trim() ? { id: generateFieldName(titulo) } : {}),
            })
          }}
          placeholder="Ex: Plano de Trabalho"
          required
        />
        <Input
          label="ID (slug único)"
          value={etapa.id}
          onChange={(e) => onUpdate({ id: e.target.value.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() })}
          hint="Apenas letras minúsculas, números, hífen ou underline"
        />
      </div>

      <Textarea
        label="Descrição (opcional)"
        value={etapa.descricao ?? ''}
        onChange={(e) => onUpdate({ descricao: e.target.value })}
        placeholder="Instruções exibidas ao proponente no topo desta etapa"
        rows={3}
      />

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            Elementos desta etapa
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={onAddCampo}>
            + Adicionar elemento
          </Button>
        </div>

        {etapa.campos.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            Nenhum elemento. Clique em &ldquo;Adicionar elemento&rdquo; para começar.
          </p>
        )}

        {etapa.campos.map((campo, cIdx) => (
          <CampoEditor
            key={`campo-${cIdx}`}
            campo={campo}
            index={cIdx}
            isFirst={cIdx === 0}
            isLast={cIdx === etapa.campos.length - 1}
            onChange={(patch) => onUpdateCampo(cIdx, patch)}
            onRemove={() => onRemoveCampo(cIdx)}
            onMoveUp={() => onMoveCampo(cIdx, -1)}
            onMoveDown={() => onMoveCampo(cIdx, 1)}
          />
        ))}
      </div>
    </div>
  )
}

export { EtapaEditor }
export type { EtapaEditorProps }
