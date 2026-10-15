import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft, IconDownload } from '@/components/ui/icons'
import { rotuloDiarioOficial } from '../_resultados/diario-oficial'
import { consultarSuplentes, type SuplentesEdital } from './consulta'
import { AvisoIndisponivelSuplentes, ComoFuncionaSuplentes } from './avisos-suplentes'
import { TabelaSuplentes } from './tabela-suplentes'

interface PropsPaginaSuplentes {
  slug: string
  preview?: boolean
}

export async function metadataSuplentes({ slug }: { slug: string }): Promise<Metadata> {
  const dados = await consultarSuplentes(slug)
  if (!dados) return { title: 'Convocação de Suplentes' }

  return {
    title: `Convocação de Suplentes — ${dados.titulo}`,
    description: dados.disponivel
      ? `Relação oficial de proponentes suplentes convocados para habilitação documental no edital ${dados.titulo}.`
      : undefined,
  }
}

function apoioDaCapa(dados: SuplentesEdital): string {
  if (!dados.disponivel) {
    return 'A convocação de propostas suplentes deste edital aguarda publicação oficial.'
  }
  return `${dados.totalConvocados} propostas suplentes convocadas em ${dados.totalCategorias} categorias para entrega presencial de documentação de habilitação e preenchimento de vagas remanescentes.`
}

export async function PaginaSuplentes({ slug, preview }: PropsPaginaSuplentes) {
  const dados = await consultarSuplentes(slug, { preview })
  if (!dados) notFound()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={dados.template.fotos}
        trilha="Convocação de Suplentes"
        chamada={`Edital de ${dados.ano}`}
        titulo="Convocação de Suplentes"
        apoio={apoioDaCapa(dados)}
        compacto
      >
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href={`/editais/${slug}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-300 underline-offset-4 hover:underline"
          >
            <IconArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {dados.titulo}
          </Link>
          {dados.diarioOficialUrl && (
            <a
              href={dados.diarioOficialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 bg-accent-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400"
            >
              <IconDownload className="h-4 w-4" aria-hidden="true" />
              {rotuloDiarioOficial(dados.diarioOficialUrl)}
            </a>
          )}
          <a
            href="/documentos/convocacao-de-suplentes_festival-arte-cultura-irece-centenario-2026_2026-10-13.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 border border-papel-100/30 bg-papel-50/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-papel-50 transition-colors hover:bg-papel-50/25"
          >
            <IconDownload className="h-4 w-4" aria-hidden="true" />
            Convocação Oficial (PDF)
          </a>
        </div>
      </FolhaDeRosto>

      {!dados.disponivel ? (
        <AvisoIndisponivelSuplentes dados={dados} />
      ) : (
        <>
          <FaixaSecao id="suplentes" cartela="Resultado da Convocação" cor="papel" corCartela="terracota">
            {dados.categorias.length === 0 ? (
              <p className="leading-relaxed">Nenhuma convocação de suplente registrada para este edital.</p>
            ) : (
              <>
                {dados.diarioOficialUrl && (
                  <div className="mb-6 flex flex-col gap-3 border-2 border-tinta-900 bg-papel-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-700">Publicação Oficial no Diário</p>
                      <p className="mt-0.5 text-sm font-medium text-tinta-900">
                        Consulte a edição oficial do Diário Oficial da Prefeitura Municipal de Irecê com o decreto de convocação, prazos e orientações legais.
                      </p>
                    </div>
                    <a
                      href={dados.diarioOficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 border border-tinta-900 bg-tinta-900 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-papel-50 transition-colors hover:bg-tinta-800"
                    >
                      <IconDownload className="h-4 w-4" aria-hidden="true" />
                      Baixar Diário Oficial (PDF)
                    </a>
                  </div>
                )}

                {/* Resumo da etapa */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="border-2 border-tinta-900 bg-papel-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-tinta-600">Total Convocado</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-tinta-900">{dados.totalConvocados} propostas</p>
                  </div>
                  <div className="border-2 border-tinta-900 bg-papel-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-tinta-600">Categorias Atendidas</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-tinta-900">{dados.totalCategorias} categorias</p>
                  </div>
                  <div className="border-2 border-tinta-900 bg-papel-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-tinta-600">Prazo de Entrega</p>
                    <p className="mt-1 text-base font-bold text-terracota-700">15 e 16 de Outubro</p>
                  </div>
                </div>

                {/* Índice de Categorias */}
                <nav aria-label="Categorias desta publicação" className="mb-10 border-2 border-tinta-900/15 bg-papel-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-700">Ir para a categoria</p>
                  <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                    {dados.categorias.map((categoria) => (
                      <li key={categoria.ancora}>
                        <a
                          href={`#${categoria.ancora}`}
                          className="flex min-h-[44px] items-center justify-between gap-3 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                        >
                          <span>{categoria.nome}</span>
                          <span className="text-xs font-normal tabular-nums text-tinta-600">
                            {categoria.propostas.filter((p) => p.convocado).length} convocada(s)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Seções por Categoria */}
                <div className="space-y-14">
                  {dados.categorias.map((categoria) => {
                    const convocadas = categoria.propostas.filter((p) => p.convocado).length
                    return (
                      <section
                        key={categoria.ancora}
                        id={categoria.ancora}
                        aria-labelledby={`${categoria.ancora}-titulo`}
                        className="scroll-mt-24 space-y-4"
                      >
                        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 border-tinta-900 pb-2">
                          <h3 id={`${categoria.ancora}-titulo`} className="titulo text-2xl leading-tight text-tinta-900">
                            {categoria.nome}
                          </h3>
                          <p className="text-sm tabular-nums text-tinta-600">
                            {convocadas} {convocadas === 1 ? 'proposta convocada' : 'propostas convocadas'}
                          </p>
                        </div>
                        {categoria.vagasInfo && (
                          <p className="text-sm leading-relaxed text-tinta-700">{categoria.vagasInfo}</p>
                        )}
                        <TabelaSuplentes propostas={categoria.propostas} categoria={categoria.nome} />
                      </section>
                    )
                  })}
                </div>
              </>
            )}
          </FaixaSecao>

          <ComoFuncionaSuplentes />
        </>
      )}
    </div>
  )
}
