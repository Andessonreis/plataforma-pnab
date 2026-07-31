import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { IconArrowLeft, IconArrowRight } from '@/components/ui/icons'
import { AnexosEdital } from './anexos-edital'
import { CapaEdital } from './capa-edital'
import { consultarEdital } from './consulta'
import { CronogramaEdital } from './cronograma-edital'
import { DuvidasEdital } from './duvidas-edital'
import { QuadroVagas } from './quadro-vagas'
import { SumarioEdital } from './sumario-edital'
import { TextoEdital } from './texto-edital'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true, resumo: true, status: true },
  })

  if (!edital || edital.status === 'RASCUNHO') return { title: 'Edital não encontrado' }
  return {
    title: edital.titulo,
    description: edital.resumo ?? `Detalhes do edital ${edital.titulo}`,
  }
}

/**
 * O edital como documento: capa, sumário e corpo em coluna de leitura.
 *
 * A página era dois terços de cartões brancos e um terço de barra lateral com
 * mais cartões — CTA, informações rápidas, próxima data, versão acessível,
 * resultados e link de volta —, e as informações apareciam duas e três vezes.
 * O que a lateral tinha de útil (pular para uma parte, se inscrever) virou o
 * sumário do documento e a chamada no fim; o resto era repetição do que já estava no
 * corpo.
 */
export default async function EditalPage({ params }: Props) {
  const { slug } = await params
  const edital = await consultarEdital(slug)

  if (!edital) notFound()

  return (
    <div className="tema-secult font-questrial">
      {edital.ehRascunhoEmPrevia && (
        <p className="bg-accent-500 px-4 py-2.5 text-center text-sm font-semibold text-tinta-950">
          Pré-visualização de rascunho, ainda não visível ao público.{' '}
          <Link href={`/admin/editais/${edital.id}`} className="underline underline-offset-4">
            Editar edital
          </Link>
        </p>
      )}

      <CapaEdital
        titulo={edital.titulo}
        ano={edital.ano}
        categorias={edital.categorias}
        situacao={edital.situacao}
        valorTotal={edital.valorTotal}
        vagas={edital.vagas}
        prazo={edital.prazo}
        inscricao={edital.inscricao}
        pdfUrl={edital.pdfUrl}
      />

      <SumarioEdital partes={edital.partes} versaoAcessivelHref={edital.versaoAcessivelHref} />

      <section className="papel-textura bg-papel-50 pb-16 pt-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
          {edital.resumo && (
            <TextoEdital id="resumo" titulo="Do que se trata" texto={edital.resumo} cor="terracota" />
          )}

          <CronogramaEdital itens={edital.cronograma} slug={edital.slug} agora={new Date()} />

          <QuadroVagas categorias={edital.categoriasConfig} cotas={edital.cotas} />

          {edital.regrasElegibilidade && (
            <TextoEdital
              id="elegibilidade"
              titulo="Quem pode se inscrever"
              texto={edital.regrasElegibilidade}
              cor="turquesa"
            />
          )}

          {edital.acoesAfirmativas && (
            <TextoEdital id="acoes" titulo="Ações afirmativas" texto={edital.acoesAfirmativas} cor="ameixa" />
          )}

          <AnexosEdital arquivos={edital.arquivos} />

          <DuvidasEdital duvidas={edital.duvidas} />

          <Link
            href="/editais"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
          >
            <IconArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ver todos os editais
          </Link>
        </div>
      </section>

      {/* A chamada volta no fim: quem leu o edital inteiro chega aqui, e é o
          momento em que a decisão de se inscrever é tomada. */}
      {edital.inscricao && (
        <section className="bg-tinta-950 text-papel-100">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="font-rye text-2xl leading-tight tracking-wide text-papel-50">
                Inscrições abertas
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel-200/85">
                Você pode salvar como rascunho e enviar quando estiver pronto.
              </p>
            </div>
            <Link
              href={edital.inscricao.href}
              className="group inline-flex min-h-[48px] shrink-0 items-center gap-2 bg-accent-500 px-6 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
            >
              {edital.inscricao.rotulo}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
