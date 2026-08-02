'use client'

import { useEditalForm } from './edital-form-context'
import { CategoriaConfigEditor } from './categoria-config-editor'
import type { CategoriaDisponivel } from './use-edital-form-data'

interface SecaoCategoriasProps {
  categoriasDisponiveis: CategoriaDisponivel[]
  loadingCategorias: boolean
}

export function SecaoCategorias({ categoriasDisponiveis, loadingCategorias }: SecaoCategoriasProps) {
  const { categorias, setCategorias, toggleCategoria } = useEditalForm()

  const categoriasOrfas = categorias.filter((c) => !categoriasDisponiveis.some((d) => d.nome === c))

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Selecione todas as categorias contempladas por este edital.</p>

      {loadingCategorias ? (
        <p className="text-sm text-slate-400">Carregando categorias...</p>
      ) : categoriasDisponiveis.length === 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Nenhuma categoria cadastrada.{' '}
            <a href="/admin/configuracoes/categorias" className="underline font-medium hover:text-amber-900">
              Cadastre categorias
            </a>{' '}
            antes de criar um edital.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias culturais">
          {categoriasDisponiveis.map((cat) => {
            const selected = categorias.includes(cat.nome)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategoria(cat.nome)}
                aria-pressed={selected}
                className={[
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  selected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400',
                ].join(' ')}
              >
                {cat.nome}
              </button>
            )
          })}
        </div>
      )}

      {categoriasOrfas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {categoriasOrfas.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
            >
              {cat}
              <button
                type="button"
                onClick={() => setCategorias((prev) => prev.filter((c) => c !== cat))}
                className="ml-0.5 text-amber-400 hover:text-red-500"
                aria-label={`Remover ${cat}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {categorias.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">{categorias.length} categoria(s) selecionada(s)</p>
      )}

      {categorias.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-slate-700">Vagas, cotas e valor por categoria (opcional)</p>
          <p className="text-xs text-slate-500">
            Configure quando o edital reservar vagas e valores específicos por categoria (ex.: quadro de vagas do
            edital). Categorias sem configuração continuam funcionando normalmente, sem corte por categoria no
            resultado.
          </p>
          {categorias.map((nome) => (
            <CategoriaConfigEditor key={nome} nome={nome} />
          ))}
        </div>
      )}
    </div>
  )
}
