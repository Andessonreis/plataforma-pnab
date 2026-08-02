'use client'

import { Input, Select, Button } from '@/components/ui'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import { useEditalForm } from './edital-form-context'

const MODO_OPTIONS = [
  { value: 'slider', label: 'Slider (nota livre)' },
  { value: 'discreto', label: 'Discreto (3 níveis)' },
]

export function CriterioAvaliacaoItem({ criterio, index }: { criterio: CriterioAvaliacao; index: number }) {
  const { updateCriterio, removeCriterio } = useEditalForm()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">Critério {index + 1}</span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => removeCriterio(index)}
          aria-label={`Remover critério ${index + 1}`}
        >
          Remover
        </Button>
      </div>

      <Input
        label="Bloco / Grupo"
        value={criterio.bloco ?? ''}
        onChange={(e) => updateCriterio(index, 'bloco', e.target.value)}
        placeholder="Ex: Bloco 1 — Atuação da entidade"
      />

      <Input
        label="Nome do Critério"
        required
        value={criterio.criterio}
        onChange={(e) => updateCriterio(index, 'criterio', e.target.value)}
        placeholder="Nome do critério"
      />

      <Input
        label="Descrição / Orientação"
        value={criterio.descricao ?? ''}
        onChange={(e) => updateCriterio(index, 'descricao', e.target.value)}
        placeholder="Descrição ou orientação para o avaliador"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Modo"
          value={criterio.modo ?? 'slider'}
          options={MODO_OPTIONS}
          onChange={(e) => updateCriterio(index, 'modo', e.target.value)}
        />

        {criterio.modo === 'discreto' ? (
          <>
            <Input
              label="Não Atende"
              type="number"
              min={0}
              value={criterio.naoAtende ?? 0}
              onChange={(e) => updateCriterio(index, 'naoAtende', Number(e.target.value))}
            />
            <Input
              label="Parcial"
              type="number"
              min={0}
              value={criterio.parcial ?? 0}
              onChange={(e) => updateCriterio(index, 'parcial', Number(e.target.value))}
            />
            <Input
              label="Plenamente"
              type="number"
              min={0}
              value={criterio.plenamente ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value)
                updateCriterio(index, 'plenamente', val)
                updateCriterio(index, 'notaMax', val)
              }}
            />
          </>
        ) : (
          <>
            <Input
              label="Nota Máxima"
              type="number"
              required
              min={0}
              step={0.5}
              value={criterio.notaMax || ''}
              onChange={(e) => updateCriterio(index, 'notaMax', e.target.value ? Number(e.target.value) : 0)}
              placeholder="Nota máxima"
            />
            <Input
              label="Peso"
              type="number"
              required
              min={0}
              step={0.5}
              value={criterio.peso || ''}
              onChange={(e) => updateCriterio(index, 'peso', e.target.value ? Number(e.target.value) : 0)}
              placeholder="Peso"
            />
          </>
        )}
      </div>
    </div>
  )
}
