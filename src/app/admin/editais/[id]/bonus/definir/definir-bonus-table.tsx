'use client'

import { useMemo, useState } from 'react'
import { IconSearch } from '@/components/ui'
import type { ItemBonusConfig } from '@/types/bonus-config'
import { LinhaDefinirBonus, type InscricaoParaBonus } from './linha-bonus'

interface Props {
  linhas: InscricaoParaBonus[]
  itens: ItemBonusConfig[]
  maxItens: number | null
  /** Texto do edital exibido acima da tabela, quando houver regra a lembrar. */
  avisoEdital?: string
}

type Filtro = 'todas' | 'com-bonus' | 'sem-bonus'

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'com-bonus', label: 'Com bônus' },
  { valor: 'sem-bonus', label: 'Sem bônus' },
]

export function DefinirBonusTable({ linhas, itens, maxItens, avisoEdital }: Props) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return linhas.filter((l) => {
      if (filtro === 'com-bonus' && l.bonusItens.length === 0) return false
      if (filtro === 'sem-bonus' && l.bonusItens.length > 0) return false
      if (!termo) return true
      return (
        l.numero.toLowerCase().includes(termo) ||
        l.proponenteNome.toLowerCase().includes(termo) ||
        (l.categoria ?? '').toLowerCase().includes(termo)
      )
    })
  }, [linhas, busca, filtro])

  return (
    <div className="space-y-3">
      {avisoEdital && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          {avisoEdital}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative sm:max-w-sm w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, proponente ou categoria"
            aria-label="Buscar inscrições"
            className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
          />
        </div>
        <div className="flex gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltro(f.valor)}
              className={[
                'text-xs font-medium px-3 min-h-[44px] rounded-lg border focus-visible:outline-2',
                filtro === f.valor
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 sm:ml-auto">
          {visiveis.length} de {linhas.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Inscrição</th>
              <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Declarado na inscrição</th>
              <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Bonificação validada{maxItens != null && ` (máx. ${maxItens})`}
              </th>
              <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((linha) => (
              <LinhaDefinirBonus key={linha.inscricaoId} linha={linha} itens={itens} maxItens={maxItens} />
            ))}
          </tbody>
        </table>
      </div>

      {visiveis.length === 0 && (
        <p className="text-sm text-slate-500 py-6 text-center">Nenhuma inscrição encontrada.</p>
      )}
    </div>
  )
}
