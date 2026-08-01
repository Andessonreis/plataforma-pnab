import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/ui'
import { AbasFiltro, type AbaFiltro } from '@/components/ui/abas-filtro'
import { IconChart } from '@/components/ui/icons'
import { IconeRecursos } from '@/components/ui/ornamentos/icones'
import { consultarPrestacao } from './consulta'
import { FolhaDeRosto } from './folha-de-rosto'
import { RegistroProjeto } from './registro-projeto'

export const metadata: Metadata = {
  title: 'Projetos Apoiados',
  description:
    'Consulte os projetos culturais apoiados pela Política Nacional Aldir Blanc em Irecê. Transparência com valores, situação e contrapartidas.',
}

interface Props {
  searchParams: Promise<{ ano?: string }>
}

function montarAbas(anos: number[]): AbaFiltro[] {
  return [
    { chave: 'todos', label: 'Todos os anos', href: '/projetos-apoiados' },
    ...anos.map((ano) => ({
      chave: String(ano),
      label: String(ano),
      href: `/projetos-apoiados?ano=${ano}`,
    })),
  ]
}

export default async function ProjetosApoiadosPage({ searchParams }: Props) {
  const params = await searchParams
  const anoSelecionado = params.ano ? Number.parseInt(params.ano, 10) : undefined
  const ano = Number.isFinite(anoSelecionado) ? anoSelecionado : undefined

  const prestacao = await consultarPrestacao(ano)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        valorTotal={prestacao.valorTotal}
        totalProjetos={prestacao.totalProjetos}
        concluidos={prestacao.concluidos}
        emExecucao={prestacao.emExecucao}
      />

      <section className="papel-textura bg-papel-50 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {prestacao.anos.length > 0 && (
            <AbasFiltro
              abas={montarAbas(prestacao.anos)}
              ativa={ano ? String(ano) : 'todos'}
              rotulo="Filtrar projetos por ano do edital"
            />
          )}

          {prestacao.grupos.length > 0 ? (
            <div className="space-y-12 pt-10">
              {prestacao.grupos.map((grupo) => (
                <div key={grupo.slug}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">
                      <Link
                        href={`/editais/${grupo.slug}`}
                        className="underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                      >
                        {grupo.titulo}
                      </Link>
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-500">
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

              <p className="flex items-start gap-4 border-t-2 border-dashed border-tinta-900/20 pt-6 text-sm leading-relaxed text-tinta-600">
                <IconeRecursos className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" />
                <span>
                  Dados publicados em atendimento ao princípio da transparência e da publicidade na
                  aplicação de recursos públicos, previsto na Lei nº 14.399/2022, que institui a
                  Política Nacional Aldir Blanc.
                </span>
              </p>
            </div>
          ) : (
            <div className="py-20">
              <EmptyState
                icon={<IconChart className="h-8 w-8 text-tinta-400" />}
                title="Nenhum projeto publicado ainda"
                description={
                  ano
                    ? `Nenhum projeto de edital de ${ano} foi publicado até agora.`
                    : 'Os projetos apoiados aparecem aqui quando a execução começa, com valor aprovado e contrapartida.'
                }
                action={ano ? { label: 'Ver todos os anos', href: '/projetos-apoiados' } : undefined}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
