'use client'

import { SeletorVinculos, type OpcaoVinculo } from '@/app/admin/memorial/_componentes/seletor-vinculos'
import { BlocoSecao } from '@/app/admin/memorial/_ui'

export interface Ligacao {
  legenda: string
  /** O que essa ligação faz no site, em uma frase. */
  efeito: string
  opcoes: OpcaoVinculo[]
  selecionados: string[]
  onChange: (ids: string[]) => void
}

function Escolhidos({ opcoes, selecionados }: Pick<Ligacao, 'opcoes' | 'selecionados'>) {
  const nomes = opcoes.filter((o) => selecionados.includes(o.id)).map((o) => o.rotulo)
  if (nomes.length === 0) return <p className="text-sm italic text-tinta-600">Nenhuma ligação ainda.</p>
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Já ligados">
      {nomes.map((n) => (
        <li key={n} className="rounded-full bg-turquesa-100 px-2.5 py-1 text-xs font-semibold text-turquesa-800">
          {n}
        </li>
      ))}
    </ul>
  )
}

/**
 * Ligações com outros conteúdos do Memorial. Mostra primeiro o que já está ligado,
 * e só abre a lista completa para marcar quando a pessoa pede.
 */
export function Ligacoes({ titulo, ligacoes }: { titulo: string; ligacoes: Ligacao[] }) {
  return (
    <BlocoSecao titulo={titulo} dica="No site, cada ligação vira um atalho entre as páginas. Só aparece o que estiver publicado.">
      <div className="divide-y divide-tinta-900/10">
        {ligacoes.map((l) => (
          <div key={l.legenda} className="py-4 first:pt-0 last:pb-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-bold text-tinta-900">{l.legenda}</h3>
              <span className="text-xs font-semibold tabular-nums text-tinta-600">{l.selecionados.length} ligados</span>
            </div>
            <p className="mb-2 text-sm text-tinta-600">{l.efeito}</p>
            <Escolhidos opcoes={l.opcoes} selecionados={l.selecionados} />
            <details className="group mt-3">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
                <span className="group-open:hidden">Marcar ou desmarcar</span>
                <span className="hidden group-open:inline">Fechar lista</span>
              </summary>
              <div className="mt-2">
                <SeletorVinculos legenda={l.legenda} opcoes={l.opcoes} selecionados={l.selecionados} onChange={l.onChange} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </BlocoSecao>
  )
}
