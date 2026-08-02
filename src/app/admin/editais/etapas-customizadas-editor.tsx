'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { EtapaEditor } from './etapa-editor'

interface Props {
  value: EtapaCustomizada[]
  onChange: (next: EtapaCustomizada[]) => void
}

// ─── Editor principal ───────────────────────────────────────────────────────

function EtapasCustomizadasEditor({ value, onChange }: Props) {
  const etapas = value

  const addEtapa = useCallback(() => {
    const nextOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 0
    const baseId = `etapa_${nextOrdem + 1}`
    const newEtapa: EtapaCustomizada = {
      id: baseId,
      titulo: '',
      descricao: '',
      ordem: nextOrdem,
      campos: [],
    }
    onChange([...etapas, newEtapa])
  }, [etapas, onChange])

  const removeEtapa = useCallback((index: number) => {
    onChange(etapas.filter((_, i) => i !== index))
  }, [etapas, onChange])

  const updateEtapa = useCallback((index: number, patch: Partial<EtapaCustomizada>) => {
    onChange(etapas.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }, [etapas, onChange])

  const moveEtapa = useCallback((index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= etapas.length) return
    const next = [...etapas]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((e, i) => ({ ...e, ordem: i })))
  }, [etapas, onChange])

  const addCampo = useCallback((etapaIndex: number) => {
    const etapa = etapas[etapaIndex]
    const novoCampo: CampoFormulario = {
      nome: '',
      label: '',
      tipo: 'texto',
      obrigatorio: false,
    }
    updateEtapa(etapaIndex, { campos: [...etapa.campos, novoCampo] })
  }, [etapas, updateEtapa])

  const removeCampo = useCallback((etapaIndex: number, campoIndex: number) => {
    const etapa = etapas[etapaIndex]
    updateEtapa(etapaIndex, { campos: etapa.campos.filter((_, i) => i !== campoIndex) })
  }, [etapas, updateEtapa])

  const moveCampo = useCallback((etapaIndex: number, campoIndex: number, dir: -1 | 1) => {
    const etapa = etapas[etapaIndex]
    const target = campoIndex + dir
    if (target < 0 || target >= etapa.campos.length) return
    const next = [...etapa.campos]
    ;[next[campoIndex], next[target]] = [next[target], next[campoIndex]]
    updateEtapa(etapaIndex, { campos: next })
  }, [etapas, updateEtapa])

  const updateCampo = useCallback((etapaIndex: number, campoIndex: number, patch: Partial<CampoFormulario>) => {
    const etapa = etapas[etapaIndex]
    const campos = etapa.campos.map((c, i) => (i === campoIndex ? { ...c, ...patch } : c))
    updateEtapa(etapaIndex, { campos })
  }, [etapas, updateEtapa])

  if (etapas.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">
          Nenhuma etapa customizada configurada. Exemplos: &ldquo;Plano de Trabalho&rdquo;,
          &ldquo;Equipe do Projeto&rdquo;, &ldquo;Cronograma Físico-Financeiro&rdquo;.
        </p>
        <Button type="button" variant="outline" onClick={addEtapa}>
          + Adicionar primeira etapa
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {etapas.map((etapa, idx) => (
        <EtapaEditor
          key={`etapa-${idx}`}
          etapa={etapa}
          index={idx}
          isFirst={idx === 0}
          isLast={idx === etapas.length - 1}
          onUpdate={(patch) => updateEtapa(idx, patch)}
          onRemove={() => removeEtapa(idx)}
          onMoveUp={() => moveEtapa(idx, -1)}
          onMoveDown={() => moveEtapa(idx, 1)}
          onAddCampo={() => addCampo(idx)}
          onRemoveCampo={(campoIndex) => removeCampo(idx, campoIndex)}
          onMoveCampo={(campoIndex, dir) => moveCampo(idx, campoIndex, dir)}
          onUpdateCampo={(campoIndex, patch) => updateCampo(idx, campoIndex, patch)}
        />
      ))}

      <Button type="button" variant="outline" onClick={addEtapa}>
        + Adicionar nova etapa
      </Button>
    </div>
  )
}

export { EtapasCustomizadasEditor }
