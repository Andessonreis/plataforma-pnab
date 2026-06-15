'use client'

import { Input, Button, Card } from '@client/components/ui'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import { SectionHeader } from '../SectionHeader'
import type { TemplateDisponivel } from '../useEditalCatalogos'

export function SecaoCriterios({
  collapsed,
  onToggle,
  templatesDisponiveis,
  criteriosAvaliacao,
  setCriteriosAvaliacao,
  formulaAvaliacao,
  setFormulaAvaliacao,
  notaMinima,
  setNotaMinima,
  addCriterio,
  duplicarUltimoCriterio,
  removeCriterio,
  updateCriterio,
}: {
  collapsed: boolean
  onToggle: () => void
  templatesDisponiveis: TemplateDisponivel[]
  criteriosAvaliacao: CriterioAvaliacao[]
  setCriteriosAvaliacao: (v: CriterioAvaliacao[]) => void
  formulaAvaliacao: string
  setFormulaAvaliacao: (v: string) => void
  notaMinima: string
  setNotaMinima: (v: string) => void
  addCriterio: () => void
  duplicarUltimoCriterio: () => void
  removeCriterio: (index: number) => void
  updateCriterio: (index: number, field: keyof CriterioAvaliacao, value: unknown) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader
        number={5}
        title="Critérios de Avaliação"
        collapsed={collapsed}
        onToggle={onToggle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {criteriosAvaliacao.length === 0 ? (
              <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Usando critérios padrão PNAB (5)
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                {criteriosAvaliacao.length} critérios customizados
              </span>
            )}
            <div className="flex items-center gap-2">
              {criteriosAvaliacao.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={duplicarUltimoCriterio}>
                  + Duplicar último
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addCriterio}>
                + Adicionar critério
              </Button>
            </div>
          </div>
        }
      >
        <p className="text-sm text-slate-500 mt-2">
          Configure critérios específicos para este edital. Se vazio, serão usados os 5 critérios padrão PNAB.
        </p>
      </SectionHeader>

      {/* Selector de template */}
      {!collapsed && templatesDisponiveis.length > 0 && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Carregar de template
              </label>
              <select
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                defaultValue=""
                onChange={e => {
                  const tpl = templatesDisponiveis.find(t => t.id === e.target.value)
                  if (tpl) {
                    setCriteriosAvaliacao(tpl.criterios)
                    setFormulaAvaliacao(tpl.formula ?? '')
                    e.target.value = ''
                  }
                }}
              >
                <option value="" disabled>Selecione um template...</option>
                {templatesDisponiveis.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} ({t.criterios.length} critérios)</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Os critérios do template serão carregados abaixo. Você pode editá-los depois.
          </p>
        </div>
      )}

      {!collapsed && <>{criteriosAvaliacao.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4 mt-4">
          Nenhum critério customizado. O edital usará os critérios padrão PNAB.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {criteriosAvaliacao.map((crit, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">Critério {idx + 1}</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeCriterio(idx)}
                    aria-label={`Remover critério ${idx + 1}`}
                  >
                    Remover
                  </Button>
                </div>

                <Input
                  label="Bloco / Grupo"
                  value={crit.bloco ?? ''}
                  onChange={e => updateCriterio(idx, 'bloco', e.target.value)}
                  placeholder="Ex: Bloco 1 — Atuação da entidade"
                />

                <Input
                  label="Nome do Critério"
                  required
                  value={crit.criterio}
                  onChange={e => updateCriterio(idx, 'criterio', e.target.value)}
                  placeholder="Nome do critério"
                />

                <Input
                  label="Descrição / Orientação"
                  value={crit.descricao ?? ''}
                  onChange={e => updateCriterio(idx, 'descricao', e.target.value)}
                  placeholder="Descrição ou orientação para o avaliador"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Modo</label>
                    <select
                      value={crit.modo ?? 'slider'}
                      onChange={e => updateCriterio(idx, 'modo', e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      <option value="slider">Slider (nota livre)</option>
                      <option value="discreto">Discreto (3 níveis)</option>
                    </select>
                  </div>

                  {crit.modo === 'discreto' ? (
                    <>
                      <Input
                        label="Não Atende"
                        type="number"
                        min={0}
                        value={crit.naoAtende ?? 0}
                        onChange={e => updateCriterio(idx, 'naoAtende', Number(e.target.value))}
                      />
                      <Input
                        label="Parcial"
                        type="number"
                        min={0}
                        value={crit.parcial ?? 0}
                        onChange={e => updateCriterio(idx, 'parcial', Number(e.target.value))}
                      />
                      <Input
                        label="Plenamente"
                        type="number"
                        min={0}
                        value={crit.plenamente ?? 0}
                        onChange={e => {
                          const val = Number(e.target.value)
                          updateCriterio(idx, 'plenamente', val)
                          updateCriterio(idx, 'notaMax', val)
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
                        value={crit.notaMax || ''}
                        onChange={e => updateCriterio(idx, 'notaMax', e.target.value ? Number(e.target.value) : 0)}
                        placeholder="Nota máxima"
                      />
                      <Input
                        label="Peso"
                        type="number"
                        required
                        min={0}
                        step={0.5}
                        value={crit.peso || ''}
                        onChange={e => updateCriterio(idx, 'peso', e.target.value ? Number(e.target.value) : 0)}
                        placeholder="Peso"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <span className="text-slate-600">
                Total de pesos: <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.peso, 0)}</strong>
              </span>
              <span className="text-slate-600">
                Nota máxima possível: <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.notaMax, 0)}</strong>
              </span>
            </div>
            <span className="text-slate-500">{criteriosAvaliacao.length} critério(s)</span>
          </div>
        </>
      )}

      {/* Fórmula de cálculo */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Fórmula de Cálculo</h3>
        <p className="text-xs text-slate-500 mb-3">
          Define como os blocos são combinados na nota final. Use B1, B2, B3... para referenciar os blocos (ordem alfabética). Em branco = média ponderada padrão.
        </p>
        <Input
          label="Fórmula"
          value={formulaAvaliacao}
          onChange={e => setFormulaAvaliacao(e.target.value)}
          placeholder="Ex: ((B1+B2)/2)+B3"
        />
      </div>

      {/* Nota Mínima */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Nota Mínima para Classificação</h3>
        <p className="text-xs text-slate-500 mb-3">
          Inscrições com nota abaixo deste valor serão automaticamente não contempladas. A nota é na escala 0-10 (normalizada). Deixe em branco para sem corte.
        </p>
        <Input
          label="Nota mínima (escala 0-10)"
          type="number"
          step="0.01"
          min={0}
          max={10}
          value={notaMinima}
          onChange={e => setNotaMinima(e.target.value)}
          placeholder="Ex: 3.0 (equivale a 60/200)"
        />
      </div>

      {/* Desempate */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Desempate</h3>
        <p className="text-xs text-slate-500">
          Em caso de empate, o administrador define a ordem manualmente na tela de resultados.
        </p>
      </div></>}
    </Card>
  )
}
