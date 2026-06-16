'use client'

import { Input } from '@client/components/ui'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'

interface CriterioEditorProps {
  criterio: CriterioAvaliacao
  index: number
  onUpdate: (index: number, field: string, value: unknown) => void
  onRemove: (index: number) => void
}

export function CriterioEditor({ criterio: c, index: i, onUpdate, onRemove }: CriterioEditorProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 mt-1">#{i + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(i)}
          className="text-red-400 hover:text-red-600 text-xs"
          aria-label="Remover critério"
        >
          Remover
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Bloco"
          value={c.bloco ?? ''}
          onChange={e => onUpdate(i, 'bloco', e.target.value)}
          placeholder="Ex: Bloco 1"
        />
        <div className="md:col-span-2">
          <Input
            label="Nome do critério"
            required
            value={c.criterio}
            onChange={e => onUpdate(i, 'criterio', e.target.value)}
            placeholder="Ex: Iniciativas Desenvolvidas"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">
          Descrição <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={c.descricao ?? ''}
          onChange={e => onUpdate(i, 'descricao', e.target.value)}
          placeholder="Orientação para o avaliador..."
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Modo</label>
          <select
            value={c.modo ?? 'slider'}
            onChange={e => onUpdate(i, 'modo', e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="slider">Slider (nota livre)</option>
            <option value="discreto">Discreto (3 níveis)</option>
          </select>
        </div>

        {c.modo === 'discreto' ? (
          <>
            <Input
              label="Não Atende"
              type="number"
              value={c.naoAtende ?? 0}
              onChange={e => onUpdate(i, 'naoAtende', Number(e.target.value))}
              min={0}
            />
            <Input
              label="Parcial"
              type="number"
              value={c.parcial ?? 0}
              onChange={e => onUpdate(i, 'parcial', Number(e.target.value))}
              min={0}
            />
            <Input
              label="Plenamente"
              type="number"
              value={c.plenamente ?? 0}
              onChange={e => onUpdate(i, 'plenamente', Number(e.target.value))}
              min={0}
            />
          </>
        ) : (
          <>
            <Input
              label="Nota Máxima"
              type="number"
              value={c.notaMax}
              onChange={e => onUpdate(i, 'notaMax', Number(e.target.value))}
              min={0}
              step={0.5}
            />
            <Input
              label="Peso"
              type="number"
              value={c.peso}
              onChange={e => onUpdate(i, 'peso', Number(e.target.value))}
              min={0}
              step={0.5}
            />
          </>
        )}
      </div>
    </div>
  )
}
