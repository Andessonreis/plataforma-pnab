import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { obterPublica } from '@/lib/services/memorial-pessoa.service'
import { renderMarkdown, stripMarkdown } from '@/lib/utils/markdown'
import { AberturaConteudo } from '../../_componentes/abertura-conteudo'
import { ConteudoRelacionado } from '../../_componentes/conteudo-relacionado'

interface Props {
  params: Promise<{ slug: string }>
}

const buscar = (slug: string) => obterPublica(slug).catch(() => null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pessoa = await buscar((await params).slug)
  if (!pessoa) return { title: 'Pessoa não encontrada' }
  return { title: pessoa.nome, description: pessoa.biografia ? stripMarkdown(pessoa.biografia, 160) : undefined }
}

export default async function PessoaPage({ params }: Props) {
  const pessoa = await buscar((await params).slug)
  if (!pessoa) notFound()

  return (
    <>
      <AberturaConteudo
        secao={{ href: '/memorial/pessoas', rotulo: 'Pessoas' }}
        titulo={pessoa.nome}
        subtitulo={pessoa.periodo}
        imagem={pessoa.fotoUrl}
        retrato
      >
        {pessoa.exposicoes.length > 0 && (
          <p>
            Presente {pessoa.exposicoes.length === 1 ? 'na exposição' : 'nas exposições'}{' '}
            {pessoa.exposicoes.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ', '}
                <Link href={`/memorial/exposicoes/${e.slug}`} className="text-accent-300 underline underline-offset-4 hover:text-accent-200">
                  {e.titulo}
                </Link>
              </span>
            ))}
          </p>
        )}
      </AberturaConteudo>

      {pessoa.biografia && (
        <section aria-label="Biografia" className="papel-textura bg-papel-50 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-lg leading-relaxed text-tinta-800 sm:px-6 [&_p]:mt-5 first:[&_p]:mt-0">
            {renderMarkdown(pessoa.biografia)}
            {pessoa.fontes && (
              <p className="!mt-10 border-t border-tinta-900/15 pt-4 text-sm text-tinta-600">
                <span className="font-semibold text-tinta-800">Fontes: </span>
                {pessoa.fontes}
              </p>
            )}
          </div>
        </section>
      )}

      <ConteudoRelacionado itens={pessoa.itens} eventos={pessoa.eventos} />
    </>
  )
}
