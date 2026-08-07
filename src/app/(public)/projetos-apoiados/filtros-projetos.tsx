import Link from 'next/link'
import { AbasFiltro, type AbaFiltro } from '@/components/ui/abas-filtro'
import { Carimbo } from '@/components/ui/carimbo'
import { IconSearch } from '@/components/ui/icons'
import { SITUACOES_FILTRAVEIS } from './tipos'

interface FiltrosProjetosProps {
  anos: number[]
  anoAtivo?: number
  situacaoAtiva?: string
  q?: string
}

function montarUrl(params: { ano?: number; situacao?: string; q?: string }): string {
  const sp = new URLSearchParams()
  if (params.ano) sp.set('ano', String(params.ano))
  if (params.situacao) sp.set('situacao', params.situacao)
  if (params.q) sp.set('q', params.q)
  const qs = sp.toString()
  return qs ? `/projetos-apoiados?${qs}` : '/projetos-apoiados'
}

/**
 * Os três eixos de filtro da prestação de contas: ano, situação e busca.
 *
 * Ano reaproveita `AbasFiltro` — já é o padrão certo. Situação reaproveita o
 * próprio `Carimbo` que marca cada lançamento como controle clicável: o selo
 * que já aparece em cada linha do livro-caixa vira também o filtro, em vez de
 * introduzir um terceiro sistema de chip. Busca é um formulário GET simples,
 * sem JavaScript, consistente com o restante do filtro vivendo na URL.
 *
 * Renderizado duas vezes por `page.tsx` (dentro do `<details>` do celular e
 * no bloco sempre visível do desktop) — cada instância é só a metade CSS
 * escondida via `display:none`, então nunca há duas cópias interativas ao
 * mesmo tempo.
 */
export function FiltrosProjetos({ anos, anoAtivo, situacaoAtiva, q }: FiltrosProjetosProps) {
  const abasAno: AbaFiltro[] = [
    { chave: 'todos', label: 'Todos os anos', href: montarUrl({ situacao: situacaoAtiva, q }) },
    ...anos.map((ano) => ({
      chave: String(ano),
      label: String(ano),
      href: montarUrl({ ano, situacao: situacaoAtiva, q }),
    })),
  ]

  return (
    <div className="space-y-6 py-6">
      {anos.length > 0 && (
        <AbasFiltro
          abas={abasAno}
          ativa={anoAtivo ? String(anoAtivo) : 'todos'}
          rotulo="Filtrar projetos por ano do edital"
        />
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">Situação</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={montarUrl({ ano: anoAtivo, q })}
            aria-current={!situacaoAtiva ? 'true' : undefined}
            className={`inline-flex min-h-[44px] items-center text-xs font-bold uppercase tracking-[0.14em] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
              !situacaoAtiva
                ? 'text-tinta-900 underline'
                : 'text-tinta-500 hover:text-brand-700 hover:underline'
            }`}
          >
            Todas
          </Link>
          {SITUACOES_FILTRAVEIS.map(({ chave, label, tom }) => (
            <Carimbo
              key={chave}
              tom={tom}
              href={montarUrl({ ano: anoAtivo, situacao: chave, q })}
              selecionado={situacaoAtiva === chave}
            >
              {label}
            </Carimbo>
          ))}
        </div>
      </div>

      <form method="get" action="/projetos-apoiados" className="max-w-sm">
        {anoAtivo && <input type="hidden" name="ano" value={anoAtivo} />}
        {situacaoAtiva && <input type="hidden" name="situacao" value={situacaoAtiva} />}
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">
            Buscar por proponente ou nº de inscrição
          </span>
          <span className="relative block">
            <IconSearch
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="nome do proponente ou número..."
              className="w-full border-2 border-tinta-900/20 bg-papel-50 py-2.5 pl-10 pr-3 text-sm text-tinta-900 placeholder:text-tinta-400 focus:border-accent-500 focus:outline-none"
            />
          </span>
        </label>
      </form>
    </div>
  )
}
