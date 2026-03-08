import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { titulo: true },
  })

  return {
    title: edital ? `${edital.titulo} — Versão Acessível` : 'Edital — Versão Acessível',
  }
}

export default async function EditalAcessivelPage({ params }: Props) {
  const { slug } = await params

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: {
      id: true,
      titulo: true,
      ano: true,
      status: true,
      resumo: true,
      conteudoAcessivel: true,
      regrasElegibilidade: true,
      acoesAfirmativas: true,
      cronograma: true,
    },
  })

  if (!edital || edital.status === 'RASCUNHO') notFound()

  if (!edital.conteudoAcessivel) {
    return (
      <main className="min-h-screen bg-white" role="main">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {edital.titulo} — Versão Acessível
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            A versão acessível deste edital ainda não está disponível.
          </p>
          <Link
            href={`/editais/${slug}`}
            className="inline-flex items-center gap-2 text-lg font-medium text-brand-700 hover:text-brand-800 underline"
          >
            <IconArrowLeft className="h-5 w-5" />
            Voltar ao edital
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-white text-slate-900"
      role="main"
      aria-label={`Edital: ${edital.titulo} — Versão Acessível`}
    >
      {/* Barra de acessibilidade */}
      <div className="bg-slate-900 text-white py-2 px-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <span className="text-sm font-medium">Versão Acessível</span>
          <Link
            href={`/editais/${slug}`}
            className="text-sm text-brand-300 hover:text-brand-200 underline"
          >
            Versão padrão
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Título */}
        <header className="mb-8 pb-6 border-b-2 border-slate-200">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {edital.titulo}
          </h1>
          <p className="text-lg text-slate-600">
            Ano: {edital.ano} | Status: {edital.status.replace(/_/g, ' ')}
          </p>
        </header>

        {/* Resumo */}
        {edital.resumo && (
          <section aria-labelledby="resumo-heading" className="mb-8">
            <h2 id="resumo-heading" className="text-2xl font-bold mb-4">
              Resumo do Edital
            </h2>
            <div className="text-lg leading-relaxed space-y-3">
              {edital.resumo.split('\n').filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Conteúdo Acessível (HTML sanitizado) */}
        <section aria-labelledby="conteudo-heading" className="mb-8">
          <h2 id="conteudo-heading" className="text-2xl font-bold mb-4">
            Conteúdo do Edital
          </h2>
          <div
            className="prose prose-lg prose-slate max-w-none
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2
              [&_p]:text-lg [&_p]:leading-relaxed [&_p]:mb-3
              [&_li]:text-lg [&_li]:leading-relaxed
              [&_a]:text-brand-700 [&_a]:underline [&_a]:font-medium
              [&_table]:w-full [&_th]:text-left [&_th]:p-3 [&_th]:bg-slate-100 [&_td]:p-3 [&_td]:border"
            dangerouslySetInnerHTML={{ __html: edital.conteudoAcessivel }}
          />
        </section>

        {/* Regras de Elegibilidade */}
        {edital.regrasElegibilidade && (
          <section aria-labelledby="regras-heading" className="mb-8">
            <h2 id="regras-heading" className="text-2xl font-bold mb-4">
              Regras de Elegibilidade
            </h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
              {edital.regrasElegibilidade.split('\n').filter(Boolean).map((regra, i) => (
                <li key={i}>{regra}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Ações Afirmativas */}
        {edital.acoesAfirmativas && (
          <section aria-labelledby="afirmativas-heading" className="mb-8">
            <h2 id="afirmativas-heading" className="text-2xl font-bold mb-4">
              Ações Afirmativas
            </h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
              {edital.acoesAfirmativas.split('\n').filter(Boolean).map((acao, i) => (
                <li key={i}>{acao}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Navegação */}
        <nav aria-label="Links relacionados" className="mt-12 pt-6 border-t-2 border-slate-200">
          <ul className="space-y-3">
            <li>
              <Link
                href={`/editais/${slug}`}
                className="text-lg font-medium text-brand-700 hover:text-brand-800 underline inline-flex items-center gap-2"
              >
                <IconArrowLeft className="h-5 w-5" />
                Voltar ao edital (versão padrão)
              </Link>
            </li>
            <li>
              <Link
                href="/editais"
                className="text-lg font-medium text-brand-700 hover:text-brand-800 underline"
              >
                Ver todos os editais
              </Link>
            </li>
            <li>
              <Link
                href="/contato"
                className="text-lg font-medium text-brand-700 hover:text-brand-800 underline"
              >
                Fale conosco
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  )
}
