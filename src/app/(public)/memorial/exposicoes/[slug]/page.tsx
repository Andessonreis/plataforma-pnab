import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { obterPublica } from '@/lib/services/memorial-exposicao.service'
import { stripMarkdown, renderMarkdown } from '@/lib/utils/markdown'
import { formatDate } from '@/lib/utils/format'
import { AberturaConteudo } from '../../_componentes/abertura-conteudo'
import { ConteudoRelacionado } from '../../_componentes/conteudo-relacionado'

interface Props {
  params: Promise<{ slug: string }>
}

const buscar = (slug: string) => obterPublica(slug).catch(() => null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const exposicao = await buscar((await params).slug)
  if (!exposicao) return { title: 'Exposição não encontrada' }
  return {
    title: exposicao.titulo,
    description: exposicao.subtitulo ?? (exposicao.descricao ? stripMarkdown(exposicao.descricao, 160) : undefined),
  }
}

export default async function ExposicaoPage({ params }: Props) {
  const exposicao = await buscar((await params).slug)
  if (!exposicao) notFound()

  const datas = [exposicao.dataInicio && `desde ${formatDate(exposicao.dataInicio)}`, exposicao.dataFim && `até ${formatDate(exposicao.dataFim)}`]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <AberturaConteudo
        secao={{ href: '/memorial/exposicoes', rotulo: 'Exposições' }}
        titulo={exposicao.titulo}
        subtitulo={exposicao.subtitulo}
        imagem={exposicao.capaUrl}
      >
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          {exposicao.periodo && (
            <>
              <dt className="font-semibold text-papel-50">Período</dt>
              <dd>{exposicao.periodo}</dd>
            </>
          )}
          {exposicao.localizacao && (
            <>
              <dt className="font-semibold text-papel-50">Onde</dt>
              <dd>{exposicao.localizacao}</dd>
            </>
          )}
          {datas && (
            <>
              <dt className="font-semibold text-papel-50">Em cartaz</dt>
              <dd>{datas}</dd>
            </>
          )}
        </dl>
      </AberturaConteudo>

      {exposicao.descricao && (
        <section aria-label="Texto da exposição" className="papel-textura bg-papel-50 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-lg leading-relaxed text-tinta-800 sm:px-6 [&_p]:mt-5 first:[&_p]:mt-0">
            {renderMarkdown(exposicao.descricao)}
          </div>
        </section>
      )}

      <ConteudoRelacionado itens={exposicao.itens} pessoas={exposicao.pessoas} eventos={exposicao.eventos} />
    </>
  )
}
