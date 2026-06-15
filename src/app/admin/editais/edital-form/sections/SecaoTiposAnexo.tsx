'use client'

import { Button, Card } from '@client/components/ui'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import { SectionHeader } from '../SectionHeader'
import type { TipoAnexoDisponivel } from '../useEditalCatalogos'

export function SecaoTiposAnexo({
  collapsed,
  onToggle,
  tiposAnexoDisponiveis,
  tiposAnexo,
  setTiposAnexo,
  addTipoIndividual,
}: {
  collapsed: boolean
  onToggle: () => void
  tiposAnexoDisponiveis: TipoAnexoDisponivel[]
  tiposAnexo: TipoAnexo[]
  setTiposAnexo: (updater: TipoAnexo[] | ((prev: TipoAnexo[]) => TipoAnexo[])) => void
  addTipoIndividual: (tipoId: string) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader
        number={6}
        title="Tipos de Anexo"
        collapsed={collapsed}
        onToggle={onToggle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tiposAnexo.length > 0 && (
              <>
                <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {tiposAnexo.length} tipo{tiposAnexo.length !== 1 ? 's' : ''} selecionado{tiposAnexo.length !== 1 ? 's' : ''}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setTiposAnexo([])}>
                  Limpar todos
                </Button>
              </>
            )}
          </div>
        }
      >
      </SectionHeader>

      {!collapsed && <>
        {/* Adicionar tipo individual */}
        {tiposAnexoDisponiveis.length > 0 && (
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Adicionar tipo</label>
            <select
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value=""
              onChange={(e) => {
                if (e.target.value) addTipoIndividual(e.target.value)
              }}
            >
              <option value="">Selecionar tipo...</option>
              {tiposAnexoDisponiveis
                .filter(t => !tiposAnexo.some(ta => ta.tipo === t.tipo))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.tag}){t.obrigatorio ? ' *' : ''}
                  </option>
                ))}
            </select>
          </div>
        )}

        {tiposAnexo.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum tipo selecionado. Use o dropdown acima para adicionar os tipos de anexo deste edital.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tiposAnexo.map((ta, idx) => (
              <div
                key={idx}
                className="inline-flex flex-col items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-900">{ta.label}</span>
                  <button
                    type="button"
                    onClick={() => setTiposAnexo(prev => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Remover ${ta.label}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer mt-0.5">
                  <input
                    type="checkbox"
                    checked={ta.obrigatorio}
                    onChange={e => setTiposAnexo(prev => prev.map((t, i) => i === idx ? { ...t, obrigatorio: e.target.checked } : t))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-500">Obrigatório</span>
                </label>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-500 mt-4">
          Selecione os tipos de documento que o proponente deverá enviar neste edital.{' '}
          <a href="/admin/configuracoes/tipos-anexo" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 underline">
            Gerenciar tipos
          </a>
        </p>
      </>}
    </Card>
  )
}
