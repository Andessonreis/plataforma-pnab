import type { Metadata } from 'next'
import Link from 'next/link'
import { z } from 'zod'
import { EmptyState, Pagination } from '@/components/ui'
import { IconChart } from '@/components/ui/icons'
import { IconeRecursos } from '@/components/ui/ornamentos/icones'
import { consultarPrestacao } from './consulta'
import { FiltrosProjetos } from './filtros-projetos'
import { FolhaDeRosto } from './folha-de-rosto'
import { RegistroProjeto } from './registro-projeto'
import { SITUACOES_FILTRAVEIS } from './tipos'

export const metadata: Metadata = {
  title: 'Projetos Apoiados',
  description:
    'Consulte os projetos culturais apoiados pela Política Nacional Aldir Blanc em Irecê. Transparência com valores, situação e contrapartidas.',
}

const searchParamsSchema = z.object({
  ano: z.coerce.number().int().positive().optional(),
  situacao: z.enum(['EM_EXECUCAO', 'CONCLUIDO', 'PRESTACAO_CONTAS']).optional(),
  q: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
})

interface Props {
  // `page`, não `pagina`: nome do parâmetro é fixado pelo componente `Pagination` compartilhado.
  searchParams: Promise<{ ano?: string; situacao?: string; q?: string; page?: string }>
}

function montarUrlLimpa(overrides: { ano?: number; situacao?: string; q?: string }): string {
  const sp = new URLSearchParams()
  if (overrides.ano) sp.set('ano', String(overrides.ano))
  if (overrides.situacao) sp.set('situacao', overrides.situacao)
  if (overrides.q) sp.set('q', overrides.q)
  const qs = sp.toString()
  return qs ? `/projetos-apoiados?${qs}` : '/projetos-apoiados'
}

/** Resumo textual do filtro ativo, para o `<summary>` do painel no celular. */
function resumoFiltros(ano?: number, situacaoLabel?: string, q?: string): string {
  const partes = [ano ? String(ano) : 'Todos os anos', situacaoLabel, q ? `"${q}"` : null].filter(
    (parte): parte is string => Boolean(parte),
  )
  return partes.join(', ')
}

function descreverVazio(ano?: number, situacaoLabel?: string, q?: string): string {
  const partes: string[] = []
  if (ano) partes.push(`do edital de ${ano}`)
  if (situacaoLabel) partes.push(`com situação "${situacaoLabel}"`)
  if (q) partes.push(`para a busca "${q}"`)

  if (partes.length === 0) {
    return 'Os projetos apoiados aparecem aqui quando a execução começa, com valor aprovado e contrapartida.'
  }
  return `Nenhum projeto ${partes.join(', ')} foi encontrado.`
}

export default async function ProjetosApoiadosPage({ searchParams }: Props) {
  const raw = await searchParams
  const parsed = searchParamsSchema.safeParse(raw)
  const { ano, situacao, q, page = 1 } = parsed.success ? parsed.data : {}

  const prestacao = await consultarPrestacao({ ano, situacao, q, pagina: page })
  const situacaoLabel = SITUACOES_FILTRAVEIS.find((s) => s.chave === situacao)?.label
  const filtroAtivo = Boolean(ano || situacao || q)
  const paginaUrlBase = montarUrlLimpa({ ano, situacao, q })

  return (
    <div className="tema-secult font-questrial">
      <div id="resumo-financeiro">
        <FolhaDeRosto
          valorTotal={prestacao.valorTotal}
          totalProjetos={prestacao.totalProjetos}
          concluidos={prestacao.concluidos}
          emExecucao={prestacao.emExecucao}
        />
      </div>

      <section id="sobre-estes-dados" aria-labelledby="sobre-estes-dados-titulo" className="bg-papel-50">
        <h2 id="sobre-estes-dados-titulo" className="sr-only">
          Sobre estes dados
        </h2>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="flex items-start gap-4 text-sm leading-relaxed text-tinta-600">
            <IconeRecursos className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" />
            <span>
              Dados publicados em atendimento ao princípio da transparência e da publicidade na
              aplicação de recursos públicos, previsto na Lei nº 14.399/2022, que institui a
              Política Nacional Aldir Blanc.
            </span>
          </p>
        </div>
      </section>

      <section
        id="filtros"
        aria-labelledby="filtros-titulo"
        className="papel-textura border-t border-tinta-900/10 bg-papel-50"
      >
        <h2 id="filtros-titulo" className="sr-only">
          Filtrar projetos
        </h2>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <details className="lg:hidden">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between py-4 text-xs font-bold uppercase tracking-[0.14em] text-tinta-700 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500">
              <span>Filtros</span>
              <span className="text-tinta-500">{resumoFiltros(ano, situacaoLabel, q)}</span>
            </summary>
            <FiltrosProjetos anos={prestacao.anos} anoAtivo={ano} situacaoAtiva={situacao} q={q} />
          </details>

          <div className="hidden lg:block">
            <FiltrosProjetos anos={prestacao.anos} anoAtivo={ano} situacaoAtiva={situacao} q={q} />
          </div>
        </div>
      </section>

      <section
        id="prestacao-por-edital"
        aria-labelledby="prestacao-titulo"
        className="papel-textura bg-papel-50 pb-16"
      >
        <h2 id="prestacao-titulo" className="sr-only">
          Prestação de contas por edital
        </h2>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {prestacao.grupos.length > 0 ? (
            <div className="space-y-12 pt-10">
              {prestacao.grupos.map((grupo) => (
                <div key={grupo.slug} id={`edital-${grupo.slug}`} className="scroll-mt-32">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">
                      <Link
                        href={`/editais/${grupo.slug}`}
                        className="underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                      >
                        {grupo.titulo}
                      </Link>
                    </h3>
                    <p className="text-right text-xs font-bold uppercase tracking-[0.14em] text-tinta-500">
                      <span className="titulo block text-base normal-case tracking-normal text-brand-700">
                        {grupo.subtotal}
                      </span>
                      {grupo.ano} · {grupo.projetos.length}{' '}
                      {grupo.projetos.length === 1 ? 'projeto' : 'projetos'}
                    </p>
                  </div>

                  <ul className="mt-4 divide-y divide-tinta-900/10 border-y border-tinta-900/10">
                    {grupo.projetos.map((projeto) => (
                      <RegistroProjeto key={projeto.id} projeto={projeto} />
                    ))}
                  </ul>
                </div>
              ))}

              {prestacao.totalPaginas > 1 && (
                <Pagination
                  currentPage={prestacao.paginaAtual}
                  totalPages={prestacao.totalPaginas}
                  baseUrl={paginaUrlBase}
                />
              )}
            </div>
          ) : (
            <div className="py-20">
              <EmptyState
                icon={<IconChart className="h-8 w-8 text-tinta-400" />}
                title="Nenhum projeto publicado ainda"
                description={descreverVazio(ano, situacaoLabel, q)}
                action={
                  filtroAtivo ? { label: 'Ver todos os projetos', href: '/projetos-apoiados' } : undefined
                }
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
