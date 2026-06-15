'use client'

import { Card } from '@client/components/ui'
import { SectionHeader } from '../SectionHeader'
import type { CategoriaDisponivel } from '../useEditalCatalogos'

export function SecaoCategorias({
  collapsed,
  onToggle,
  loadingCategorias,
  categoriasDisponiveis,
  categorias,
  setCategorias,
  toggleCategoria,
}: {
  collapsed: boolean
  onToggle: () => void
  loadingCategorias: boolean
  categoriasDisponiveis: CategoriaDisponivel[]
  categorias: string[]
  setCategorias: (updater: (prev: string[]) => string[]) => void
  toggleCategoria: (cat: string) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader number={2} title="Categorias Culturais" collapsed={collapsed} onToggle={onToggle}>
        <p className="text-sm text-slate-500 mt-2">
          Selecione todas as categorias contempladas por este edital.
        </p>
      </SectionHeader>
      {!collapsed && <>
        {loadingCategorias ? (
          <p className="text-sm text-slate-400 mt-4">Carregando categorias...</p>
        ) : categoriasDisponiveis.length === 0 ? (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Nenhuma categoria cadastrada.{' '}
              <a href="/admin/configuracoes/categorias" className="underline font-medium hover:text-amber-900">
                Cadastre categorias
              </a>{' '}
              antes de criar um edital.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {categoriasDisponiveis.map(cat => {
              const selected = categorias.includes(cat.nome)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategoria(cat.nome)}
                  aria-pressed={selected}
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
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

        {/* Categorias salvas no edital que não existem mais no cadastro */}
        {categorias.filter(c => !categoriasDisponiveis.some(d => d.nome === c)).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categorias.filter(c => !categoriasDisponiveis.some(d => d.nome === c)).map(cat => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => setCategorias(prev => prev.filter(c => c !== cat))}
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
          <p className="mt-3 text-xs text-slate-500">
            {categorias.length} categoria(s) selecionada(s)
          </p>
        )}
      </>}
    </Card>
  )
}
