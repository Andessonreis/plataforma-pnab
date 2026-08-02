'use client'

import { Input } from '@/components/ui'
import { useEditalForm } from './edital-form-context'

/** Editor de vagas/cotas/valor de uma única categoria já selecionada (expansível). */
export function CategoriaConfigEditor({ nome }: { nome: string }) {
  const {
    getCategoriaConfig,
    ativarConfigCategoria,
    removerConfigCategoria,
    updateCategoriaConfig,
    updateCotaConfig,
    addCotaConfig,
    removeCotaConfig,
  } = useEditalForm()

  const config = getCategoriaConfig(nome)

  return (
    <div className="border border-slate-200 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-800">{nome}</span>
        {config ? (
          <button
            type="button"
            onClick={() => removerConfigCategoria(nome)}
            className="text-xs text-red-600 hover:text-red-700 shrink-0 min-h-[44px] px-1"
          >
            Remover configuração
          </button>
        ) : (
          <button
            type="button"
            onClick={() => ativarConfigCategoria(nome)}
            className="text-xs text-brand-600 hover:text-brand-700 shrink-0 min-h-[44px] px-1"
          >
            + Configurar vagas/cotas
          </button>
        )}
      </div>

      {config && (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={config.vagasAmplaConcorrencia === null}
              onChange={(e) => updateCategoriaConfig(nome, { vagasAmplaConcorrencia: e.target.checked ? null : 0 })}
            />
            Sem limite discreto de vagas (só valor total da categoria)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {config.vagasAmplaConcorrencia !== null && (
              <Input
                label="Vagas ampla concorrência"
                type="number"
                min={0}
                value={String(config.vagasAmplaConcorrencia)}
                onChange={(e) => updateCategoriaConfig(nome, { vagasAmplaConcorrencia: Number(e.target.value) || 0 })}
              />
            )}
            <Input
              label="Valor por projeto (R$)"
              type="number"
              min={0}
              step="0.01"
              value={config.valorPorProjeto != null ? String(config.valorPorProjeto) : ''}
              onChange={(e) =>
                updateCategoriaConfig(nome, { valorPorProjeto: e.target.value.trim() ? Number(e.target.value) : null })
              }
              placeholder="Sem valor fixo por projeto"
            />
            <Input
              label="Valor total da categoria (R$)"
              type="number"
              min={0}
              step="0.01"
              value={String(config.valorTotalCategoria)}
              onChange={(e) => updateCategoriaConfig(nome, { valorTotalCategoria: Number(e.target.value) || 0 })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Cotas reservadas</span>
              <button
                type="button"
                onClick={() => addCotaConfig(nome)}
                className="text-xs text-brand-600 hover:text-brand-700 min-h-[44px] px-1"
              >
                + Adicionar cota
              </button>
            </div>
            <div className="space-y-2">
              {config.cotas.map((cota) => (
                <div key={cota.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={cota.label}
                    onChange={(e) => updateCotaConfig(nome, cota.key, { label: e.target.value })}
                    placeholder="Nome da cota"
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={cota.vagas}
                      onChange={(e) => updateCotaConfig(nome, cota.key, { vagas: Number(e.target.value) || 0 })}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2"
                      aria-label={`Vagas para ${cota.label || 'cota'}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCotaConfig(nome, cota.key)}
                      className="text-slate-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Remover cota ${cota.label || ''}`}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
              {config.cotas.length === 0 && (
                <p className="text-xs text-slate-400">Nenhuma cota — todas as vagas são de ampla concorrência.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
