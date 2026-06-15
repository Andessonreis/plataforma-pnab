'use client'

import { Card } from '@client/components/ui'
import { SectionHeader } from '../SectionHeader'
import { TEMPLATE_REGRAS, TEMPLATE_ACOES } from '../constants'

export function SecaoRegrasAcoes({
  collapsed,
  onToggle,
  regrasElegibilidade,
  setRegrasElegibilidade,
  acoesAfirmativas,
  setAcoesAfirmativas,
}: {
  collapsed: boolean
  onToggle: () => void
  regrasElegibilidade: string
  setRegrasElegibilidade: (v: string) => void
  acoesAfirmativas: string
  setAcoesAfirmativas: (v: string) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader number={3} title="Regras e Ações Afirmativas" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && <div className="space-y-5 sm:space-y-6 mt-4 sm:mt-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="regras-elegibilidade" className="block text-sm font-medium text-slate-700">
              Regras de Elegibilidade
            </label>
            <button
              type="button"
              onClick={() => setRegrasElegibilidade(TEMPLATE_REGRAS)}
              className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            id="regras-elegibilidade"
            rows={5}
            value={regrasElegibilidade}
            onChange={e => setRegrasElegibilidade(e.target.value)}
            placeholder="Liste os requisitos para participação neste edital (um por linha)"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="acoes-afirmativas" className="block text-sm font-medium text-slate-700">
              Ações Afirmativas
            </label>
            <button
              type="button"
              onClick={() => setAcoesAfirmativas(TEMPLATE_ACOES)}
              className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            id="acoes-afirmativas"
            rows={5}
            value={acoesAfirmativas}
            onChange={e => setAcoesAfirmativas(e.target.value)}
            placeholder="Liste as ações afirmativas previstas neste edital (uma por linha)"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200"
          />
        </div>
      </div>}
    </Card>
  )
}
