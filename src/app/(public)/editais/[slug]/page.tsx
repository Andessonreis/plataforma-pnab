import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft, IconArrowRight } from '@/components/ui/icons'
import { BarraInscricaoFixa } from './barra-inscricao-fixa'
import { CapaEdital } from './capa-edital'
import { consultarEdital } from './consulta'
import { CronogramaEdital } from './cronograma-edital'
import { DocumentoNav } from './document-nav'
import { FaixaResultado } from './faixa-resultado'
import { QuadroVagas } from './quadro-vagas'
import { ZonaDocumentosDuvidas } from './zona-documentos-duvidas'
import { ZonaSobreEdital } from './zona-sobre-edital'

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
 * O edital como documento: shell fixo (capa + navegação) e corpo em zonas.
 *
 * Cada campo do banco virava sua própria faixa de cor de ponta a ponta — um
 * edital com os sete campos preenchidos empilhava sete faixas saturadas
 * seguidas, e o comprimento do documento crescia 1:1 com o número de faixas.
 * Aqui o corpo é agrupado por intenção de leitura (zonas I a IV, sempre as
 * mesmas quatro), e é o conteúdo dentro de cada zona que absorve a variação
 * de 3 a 15+ blocos, não o número de campos de cor.
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
          <Link href={`/admin/editais/${edital.id}/editar`} className="underline underline-offset-4">
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
      <div id="fim-capa" aria-hidden="true" className="h-px" />

      <DocumentoNav
        partes={edital.partes}
        versaoAcessivelHref={edital.versaoAcessivelHref}
        resultado={edital.resultado}
        inscricao={edital.inscricao}
      />

      {edital.resultado && <FaixaResultado resultado={edital.resultado} />}

      {/* Zona I — sobre o edital: resumo, elegibilidade, ações afirmativas. */}
      <ZonaSobreEdital
        resumo={edital.resumo}
        regrasElegibilidade={edital.regrasElegibilidade}
        acoesAfirmativas={edital.acoesAfirmativas}
      />

      {/* Zona II — cronograma. */}
      {edital.cronograma.length > 0 && (
        <FaixaSecao id="cronograma" cartela="Cronograma" cor="tinta" corCartela="oliva">
          <CronogramaEdital itens={edital.cronograma} slug={edital.slug} agora={new Date()} escuro />
        </FaixaSecao>
      )}

      {/* Zona III — vagas e valores. */}
      {edital.categoriasConfig.length > 0 && (
        <FaixaSecao id="vagas" cartela="Vagas e valores" cor="papel-forte" corCartela="terracota">
          <QuadroVagas categorias={edital.categoriasConfig} cotas={edital.cotas} />
        </FaixaSecao>
      )}

      {/* Zona IV — documentos e dúvidas, lado a lado no desktop. */}
      <ZonaDocumentosDuvidas arquivos={edital.arquivos} duvidas={edital.duvidas} />

      {/* A chamada volta no fim: quem leu o edital inteiro chega aqui, e é o
          momento em que a decisão de se inscrever é tomada. */}
      {edital.inscricao && (
        <section className="bg-oliva-700 text-papel-100">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="titulo text-3xl leading-tight text-papel-50">Inscrições abertas</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel-100/85">
                Você pode salvar como rascunho e enviar quando estiver pronto.
              </p>
            </div>
            <Link
              href={edital.inscricao.href}
              className="group inline-flex min-h-[52px] shrink-0 items-center gap-2 bg-accent-500 px-7 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
            >
              {edital.inscricao.rotulo}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}

      <div className="papel-textura bg-papel-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/editais"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
          >
            <IconArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ver todos os editais
          </Link>
        </div>
      </div>

      {edital.inscricao && <BarraInscricaoFixa inscricao={edital.inscricao} />}
    </div>
  )
}
