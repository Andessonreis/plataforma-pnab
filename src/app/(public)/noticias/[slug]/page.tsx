import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FadeIn } from '@/components/ui/animated'
import { IconArrowLeft, IconArrowRight } from '@/components/ui/icons'
import { extractHeadings, stripMarkdown } from '@/lib/utils/markdown'
import { noticiaParaListagem } from '../consulta'
import { EntradaNoticia } from '../entrada-noticia'
import { CabecalhoNoticia } from './cabecalho-noticia'
import { CorpoNoticia } from './corpo-noticia'
import { SumarioNoticia } from './sumario-noticia'

interface NoticiaPageProps {
  params: Promise<{ slug: string }>
}

function estimarTempoLeitura(texto: string): number {
  const palavras = texto.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(palavras / 200))
}

function porExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: NoticiaPageProps): Promise<Metadata> {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
    select: { titulo: true, corpo: true, imagemUrl: true },
  })

  if (!noticia) {
    return { title: 'Notícia não encontrada' }
  }

  const descricao = stripMarkdown(noticia.corpo, 160)

  return {
    title: noticia.titulo,
    description: descricao,
    openGraph: {
      title: noticia.titulo,
      description: descricao,
      images: noticia.imagemUrl ? [{ url: noticia.imagemUrl }] : [],
    },
  }
}

/**
 * A notícia como documento, na mesma linguagem de `editais/[slug]`: faixas de
 * cor chapada encostadas, sem cartão flutuante nem barra lateral fixa.
 *
 * A barra lateral anterior (metadados, CTA de editais, link de volta) só
 * existia como coluna no desktop — no mobile ela já vinha depois do artigo no
 * DOM, então a versão desktop fingia uma hierarquia que o próprio mobile
 * negava. Os três blocos viram faixas de largura cheia na ordem de leitura.
 */
export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({ where: { slug } })

  if (!noticia || !noticia.publicado || !noticia.publicadoEm) {
    notFound()
  }

  const relacionadas = await prisma.noticia.findMany({
    where: { publicado: true, publicadoEm: { not: null }, id: { not: noticia.id } },
    orderBy: { publicadoEm: 'desc' },
    take: 3,
    select: {
      id: true,
      titulo: true,
      slug: true,
      corpo: true,
      tags: true,
      imagemUrl: true,
      publicadoEm: true,
    },
  })

  const headings = extractHeadings(noticia.corpo)

  return (
    <div className="tema-secult font-questrial">
      <CabecalhoNoticia
        titulo={noticia.titulo}
        tags={noticia.tags}
        dataPorExtenso={porExtenso(noticia.publicadoEm)}
        publicadoEmIso={noticia.publicadoEm.toISOString()}
        tempoLeitura={estimarTempoLeitura(noticia.corpo)}
        imagemUrl={noticia.imagemUrl}
      />

      <SumarioNoticia headings={headings} />

      <CorpoNoticia corpo={noticia.corpo} />

      {/* A chamada volta no fim, mesmo padrão literal do fechamento de
          editais/[slug]: quem leu o artigo inteiro chega aqui. */}
      <section id="cta-editais" className="bg-oliva-700 text-papel-100">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="titulo text-3xl leading-tight text-papel-50">Confira os editais abertos</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel-100/85">
              Consulte os editais em andamento e inscreva seu projeto cultural.
            </p>
          </div>
          <Link
            href="/editais"
            className="group inline-flex min-h-[52px] shrink-0 items-center gap-2 bg-accent-500 px-7 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
          >
            Ver editais
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {relacionadas.length > 0 && (
        <section id="relacionadas" aria-label="Outras notícias" className="papel-textura bg-papel-100">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">Outras notícias</h2>
            <FadeIn className="mt-6 grid gap-x-10 md:grid-cols-2 xl:grid-cols-3">
              {relacionadas.map((item) => (
                <EntradaNoticia key={item.id} noticia={noticiaParaListagem(item, 150)} />
              ))}
            </FadeIn>
          </div>
        </section>
      )}

      <div className="papel-textura bg-papel-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
          >
            <IconArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ver todas as notícias
          </Link>
        </div>
      </div>
    </div>
  )
}
