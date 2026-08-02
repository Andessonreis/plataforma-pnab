'use client'

import { Input, Button } from '@/components/ui'
import { useEditalForm } from './edital-form-context'
import { CriterioAvaliacaoItem } from './criterio-avaliacao-item'
import type { TemplateAvaliacao } from './use-edital-form-data'

export function SecaoCriteriosAvaliacao({ templatesDisponiveis }: { templatesDisponiveis: TemplateAvaliacao[] }) {
  const {
    criteriosAvaliacao, setCriteriosAvaliacao,
    formulaAvaliacao, setFormulaAvaliacao,
    notaMinima, setNotaMinima,
    addCriterio, duplicarUltimoCriterio,
  } = useEditalForm()

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <p className="text-sm text-slate-500 max-w-prose">
          Configure critérios específicos para este edital. Se vazio, serão usados os 5 critérios padrão PNAB.
        </p>
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

      {templatesDisponiveis.length > 0 && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
          <label htmlFor="criterios-template" className="text-sm font-medium text-slate-700 block mb-1.5">
            Carregar de template
          </label>
          <select
            id="criterios-template"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white min-h-[44px]"
            defaultValue=""
            onChange={(e) => {
              const tpl = templatesDisponiveis.find((t) => t.id === e.target.value)
              if (tpl) {
                setCriteriosAvaliacao(tpl.criterios)
                setFormulaAvaliacao(tpl.formula ?? '')
                e.target.value = ''
              }
            }}
          >
            <option value="" disabled>Selecione um template...</option>
            {templatesDisponiveis.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.criterios.length} critérios)
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            Os critérios do template serão carregados abaixo. Você pode editá-los depois.
          </p>
        </div>
      )}

      {criteriosAvaliacao.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum critério customizado. O edital usará os critérios padrão PNAB.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {criteriosAvaliacao.map((crit, idx) => (
              <CriterioAvaliacaoItem key={idx} criterio={crit} index={idx} />
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex flex-wrap gap-6">
              <span className="text-slate-600">
                Total de pesos: <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.peso, 0)}</strong>
              </span>
              <span className="text-slate-600">
                Nota máxima possível:{' '}
                <strong className="text-slate-800">{criteriosAvaliacao.reduce((s, c) => s + c.notaMax, 0)}</strong>
              </span>
            </div>
            <span className="text-slate-500">{criteriosAvaliacao.length} critério(s)</span>
          </div>
        </>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Fórmula de Cálculo</h3>
        <p className="text-xs text-slate-500 mb-3">
          Define como os blocos são combinados na nota final. Use B1, B2, B3... para referenciar os blocos (ordem
          alfabética). Em branco = média ponderada padrão.
        </p>
        <Input
          label="Fórmula"
          value={formulaAvaliacao}
          onChange={(e) => setFormulaAvaliacao(e.target.value)}
          placeholder="Ex: ((B1+B2)/2)+B3"
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Nota Mínima para Classificação</h3>
        <p className="text-xs text-slate-500 mb-3">
          Inscrições com nota abaixo deste valor serão automaticamente não contempladas. A nota é na escala 0-10
          (normalizada). Deixe em branco para sem corte.
        </p>
        <Input
          label="Nota mínima (escala 0-10)"
          type="number"
          step="0.01"
          min={0}
          max={10}
          value={notaMinima}
          onChange={(e) => setNotaMinima(e.target.value)}
          placeholder="Ex: 3.0 (equivale a 60/200)"
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Desempate</h3>
        <p className="text-xs text-slate-500">
          Em caso de empate, o administrador define a ordem manualmente na tela de resultados.
        </p>
      </div>
    </div>
  )
}
