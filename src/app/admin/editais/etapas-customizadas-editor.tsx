'use client'

import { useCallback } from 'react'
import { Input, Textarea, Button, Select } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'

interface Props {
  value: EtapaCustomizada[]
  onChange: (next: EtapaCustomizada[]) => void
}

const TIPO_CAMPO_OPTIONS = [
  { value: 'texto', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'numero', label: 'Número' },
  { value: 'moeda', label: 'Moeda (R$)' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || `etapa_${Date.now().toString(36).slice(-4)}`
}

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
    const next = etapas.filter((_, i) => i !== index)
    onChange(next)
  }, [etapas, onChange])

  const updateEtapa = useCallback((index: number, patch: Partial<EtapaCustomizada>) => {
    const next = etapas.map((e, i) => (i === index ? { ...e, ...patch } : e))
    onChange(next)
  }, [etapas, onChange])

  const moveEtapa = useCallback((index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= etapas.length) return
    const next = [...etapas]
    ;[next[index], next[target]] = [next[target], next[index]]
    // Re-normalizar a ordem
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
        <div
          key={`etapa-${idx}`}
          className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
        >
          {/* Header da etapa */}
          <div className="flex items-start gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-full bg-brand-100 text-brand-700 text-xs font-bold px-2">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {etapa.titulo || 'Nova etapa'}
              </p>
              <p className="text-xs text-slate-500">
                ID: <code className="font-mono">{etapa.id}</code> · {etapa.campos.length} campo(s)
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveEtapa(idx, -1)}
                disabled={idx === 0}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
                aria-label="Mover para cima"
                title="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveEtapa(idx, 1)}
                disabled={idx === etapas.length - 1}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
                aria-label="Mover para baixo"
                title="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeEtapa(idx)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
                aria-label={`Remover etapa ${etapa.titulo || idx + 1}`}
              >
                Remover
              </button>
            </div>
          </div>

          {/* Configuração da etapa */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Título da etapa"
              value={etapa.titulo}
              onChange={(e) => {
                const titulo = e.target.value
                // Auto-gerar id se ainda estiver no padrão default
                const autoGenId = etapa.id.startsWith('etapa_') && /^etapa_\d+$/.test(etapa.id)
                updateEtapa(idx, {
                  titulo,
                  ...(autoGenId && titulo.trim() ? { id: slugify(titulo) } : {}),
                })
              }}
              placeholder="Ex: Plano de Trabalho"
              required
            />
            <Input
              label="ID (slug único)"
              value={etapa.id}
              onChange={(e) => updateEtapa(idx, { id: e.target.value.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() })}
              hint="Apenas letras minúsculas, números, hífen ou underline"
            />
          </div>

          <Textarea
            label="Descrição (opcional)"
            value={etapa.descricao ?? ''}
            onChange={(e) => updateEtapa(idx, { descricao: e.target.value })}
            placeholder="Instruções exibidas ao proponente no topo desta etapa"
            rows={3}
          />

          {/* Campos da etapa */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">
                Campos desta etapa
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCampo(idx)}
              >
                + Adicionar campo
              </Button>
            </div>

            {etapa.campos.length === 0 && (
              <p className="text-xs text-slate-500 italic">
                Nenhum campo adicionado. Clique em &ldquo;Adicionar campo&rdquo; para começar.
              </p>
            )}

            {etapa.campos.map((campo, cIdx) => (
              <div
                key={`campo-${cIdx}`}
                className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Rótulo (visível)"
                    value={campo.label}
                    onChange={(e) => {
                      const label = e.target.value
                      // Auto-gerar nome se vazio
                      const patch: Partial<CampoFormulario> = { label }
                      if (!campo.nome.trim() && label.trim()) {
                        patch.nome = slugify(label)
                      }
                      updateCampo(idx, cIdx, patch)
                    }}
                    placeholder="Ex: Objeto do Projeto"
                    required
                  />
                  <Input
                    label="Nome técnico"
                    value={campo.nome}
                    onChange={(e) => updateCampo(idx, cIdx, { nome: slugify(e.target.value) })}
                    hint="Identificador único do campo. Gerado automaticamente a partir do rótulo"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    label="Tipo"
                    value={campo.tipo}
                    onChange={(e) => updateCampo(idx, cIdx, { tipo: e.target.value as CampoFormulario['tipo'] })}
                    options={TIPO_CAMPO_OPTIONS}
                  />
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={campo.obrigatorio ?? false}
                        onChange={(e) => updateCampo(idx, cIdx, { obrigatorio: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Obrigatório
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCampo(idx, cIdx)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium self-end min-h-[44px]"
                  >
                    Remover campo
                  </button>
                </div>

                {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                  <Textarea
                    label="Opções (uma por linha)"
                    value={(campo.opcoes ?? []).join('\n')}
                    onChange={(e) =>
                      updateCampo(idx, cIdx, {
                        opcoes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder="Opção A&#10;Opção B"
                  />
                )}

                <Input
                  label="Texto de ajuda (hint)"
                  value={campo.hint ?? ''}
                  onChange={(e) => updateCampo(idx, cIdx, { hint: e.target.value })}
                  placeholder="Instrução curta exibida abaixo do campo"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addEtapa}>
        + Adicionar nova etapa
      </Button>
    </div>
  )
}

export { EtapasCustomizadasEditor }
