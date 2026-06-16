'use client'

import { Input, Textarea, Button, Select } from '@client/components/ui'
import type { CampoFormulario, CampoTipo } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { TIPO_CAMPO_TODOS_OPTIONS, VARIANTE_INFO_OPTIONS, slugify } from './constants'
import { SubcamposListEditor } from './CampoEditor'

export function EtapaItem({
  etapa,
  idx,
  total,
  moveEtapa,
  removeEtapa,
  updateEtapa,
  addCampo,
  removeCampo,
  moveCampo,
  updateCampo,
}: {
  etapa: EtapaCustomizada
  idx: number
  total: number
  moveEtapa: (index: number, dir: -1 | 1) => void
  removeEtapa: (index: number) => void
  updateEtapa: (index: number, patch: Partial<EtapaCustomizada>) => void
  addCampo: (etapaIndex: number) => void
  removeCampo: (etapaIndex: number, campoIndex: number) => void
  moveCampo: (etapaIndex: number, campoIndex: number, dir: -1 | 1) => void
  updateCampo: (etapaIndex: number, campoIndex: number, patch: Partial<CampoFormulario>) => void
}) {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-start gap-2 flex-wrap">
        <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-full bg-brand-100 text-brand-700 text-xs font-bold px-2">
          {idx + 1}
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
            onClick={() => moveEtapa(idx, -1)}
            disabled={idx === 0}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
            aria-label="Mover para cima"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveEtapa(idx, 1)}
            disabled={idx === total - 1}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
            aria-label="Mover para baixo"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Título da etapa"
          value={etapa.titulo}
          onChange={(e) => {
            const titulo = e.target.value
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

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            Elementos desta etapa
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={() => addCampo(idx)}>
            + Adicionar elemento
          </Button>
        </div>

        {etapa.campos.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            Nenhum elemento. Clique em &ldquo;Adicionar elemento&rdquo; para começar.
          </p>
        )}

        {etapa.campos.map((campo, cIdx) => (
          <div
            key={`campo-${cIdx}`}
            className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Elemento {cIdx + 1} — {campo.tipo}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveCampo(idx, cIdx, -1)}
                  disabled={cIdx === 0}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded text-xs"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCampo(idx, cIdx, 1)}
                  disabled={cIdx === etapa.campos.length - 1}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded text-xs"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCampo(idx, cIdx)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                >
                  Remover
                </button>
              </div>
            </div>

            <Select
              label="Tipo do elemento"
              value={campo.tipo}
              onChange={(e) => updateCampo(idx, cIdx, { tipo: e.target.value as CampoTipo })}
              options={TIPO_CAMPO_TODOS_OPTIONS}
            />

            {/* ── Tipo INFO ──────────────────────────────────────────── */}
            {campo.tipo === 'info' && (
              <>
                <Input
                  label="Título (opcional)"
                  value={campo.label}
                  onChange={(e) => updateCampo(idx, cIdx, {
                    label: e.target.value,
                    nome: campo.nome || slugify(e.target.value || `info_${cIdx + 1}`),
                  })}
                  placeholder="Ex: Atenção!"
                />
                <Select
                  label="Variante visual"
                  value={campo.variante ?? 'info'}
                  onChange={(e) => updateCampo(idx, cIdx, { variante: e.target.value as 'info' | 'atencao' | 'alerta' })}
                  options={VARIANTE_INFO_OPTIONS}
                />
                <Textarea
                  label="Conteúdo (markdown aceito)"
                  value={campo.conteudo ?? ''}
                  onChange={(e) => updateCampo(idx, cIdx, { conteudo: e.target.value })}
                  rows={6}
                  placeholder="Texto explicativo exibido ao proponente..."
                />
              </>
            )}

            {/* ── Tipo TABELA ────────────────────────────────────────── */}
            {campo.tipo === 'tabela' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Rótulo (título da tabela)"
                    value={campo.label}
                    onChange={(e) => {
                      const label = e.target.value
                      const patch: Partial<CampoFormulario> = { label }
                      if (!campo.nome.trim() && label.trim()) patch.nome = slugify(label)
                      updateCampo(idx, cIdx, patch)
                    }}
                    placeholder="Ex: Equipe"
                    required
                  />
                  <Input
                    label="Nome técnico"
                    value={campo.nome}
                    onChange={(e) => updateCampo(idx, cIdx, { nome: slugify(e.target.value) })}
                  />
                </div>
                <Input
                  label="Hint (opcional)"
                  value={campo.hint ?? ''}
                  onChange={(e) => updateCampo(idx, cIdx, { hint: e.target.value })}
                />
                <SubcamposListEditor
                  items={campo.colunas ?? []}
                  onChange={(cols) => updateCampo(idx, cIdx, { colunas: cols })}
                  labelSingular="Coluna"
                  labelPlural="Colunas da tabela"
                />
              </>
            )}

            {/* ── Tipo GRUPO REPETIVEL ───────────────────────────────── */}
            {campo.tipo === 'grupo_repetivel' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Rótulo (título do bloco)"
                    value={campo.label}
                    onChange={(e) => {
                      const label = e.target.value
                      const patch: Partial<CampoFormulario> = { label }
                      if (!campo.nome.trim() && label.trim()) patch.nome = slugify(label)
                      updateCampo(idx, cIdx, patch)
                    }}
                    placeholder="Ex: Planos de Formação"
                    required
                  />
                  <Input
                    label="Nome técnico"
                    value={campo.nome}
                    onChange={(e) => updateCampo(idx, cIdx, { nome: slugify(e.target.value) })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Nome singular do item"
                    value={campo.labelItem ?? ''}
                    onChange={(e) => updateCampo(idx, cIdx, { labelItem: e.target.value })}
                    placeholder="Ex: Plano"
                    hint="Usado no botão '+ Adicionar X'"
                  />
                  <Input
                    label="Hint (opcional)"
                    value={campo.hint ?? ''}
                    onChange={(e) => updateCampo(idx, cIdx, { hint: e.target.value })}
                  />
                </div>
                <SubcamposListEditor
                  items={campo.subcampos ?? []}
                  onChange={(subs) => updateCampo(idx, cIdx, { subcampos: subs })}
                  labelSingular="Campo"
                  labelPlural="Campos de cada item"
                />
              </>
            )}

            {/* ── Tipos simples ──────────────────────────────────────── */}
            {campo.tipo !== 'info' && campo.tipo !== 'tabela' && campo.tipo !== 'grupo_repetivel' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Rótulo (visível)"
                    value={campo.label}
                    onChange={(e) => {
                      const label = e.target.value
                      const patch: Partial<CampoFormulario> = { label }
                      if (!campo.nome.trim() && label.trim()) patch.nome = slugify(label)
                      updateCampo(idx, cIdx, patch)
                    }}
                    placeholder="Ex: Objeto do Projeto"
                    required
                  />
                  <Input
                    label="Nome técnico"
                    value={campo.nome}
                    onChange={(e) => updateCampo(idx, cIdx, { nome: slugify(e.target.value) })}
                    hint="Gerado automaticamente a partir do rótulo"
                  />
                </div>
                <div className="flex items-end gap-4">
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
                  />
                )}
                <Input
                  label="Texto de ajuda (hint)"
                  value={campo.hint ?? ''}
                  onChange={(e) => updateCampo(idx, cIdx, { hint: e.target.value })}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
