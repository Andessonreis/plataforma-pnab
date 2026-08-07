import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FaixaSecao } from '@/components/ui/faixa-secao'
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

const FOTOS = [
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

/**
 * Versão acessível, na mesma identidade do edital — só com escala ampliada.
 *
 * A página vivia fora de `.tema-secult`, com fundo branco liso e sua própria
 * barra de topo: um produto visual à parte para o mesmo edital, na página
 * cujo propósito é justamente ser a forma mais fácil de ler o mesmo
 * conteúdo. A moldura institucional (capa compacta, `FaixaSecao`, `Cartela`)
 * continua a mesma; o que muda é a coluna de leitura, mais estreita, e o
 * corpo de texto, maior — via `.leitura-acessivel`.
 *
 * O HTML de `conteudoAcessivel` é sanitizado no admin ao ser salvo; renderizar
 * via `dangerouslySetInnerHTML` aqui mantém o mesmo contrato que a página já
 * tinha antes deste redesign — não é escopo desta reestruturação de UI.
 */
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
    },
  })

  if (!edital || edital.status === 'RASCUNHO') notFound()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Versão acessível"
        chamada={`Chamamento público · ${edital.ano}`}
        titulo={edital.titulo}
        compacto
      >
        <Link
          href={`/editais/${slug}`}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-300 underline-offset-4 hover:underline"
        >
          <IconArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Versão padrão deste edital
        </Link>
      </FolhaDeRosto>

      {!edital.conteudoAcessivel ? (
        <FaixaSecao id="indisponivel" cartela="Ainda não disponível" cor="papel" corCartela="tinta">
          <p className="max-w-2xl leading-relaxed">
            A versão acessível deste edital ainda não está disponível.
          </p>
        </FaixaSecao>
      ) : (
        <FaixaSecao id="conteudo" cartela="Conteúdo do edital" cor="papel" corCartela="terracota">
          <div className="leitura-acessivel mx-auto max-w-3xl">
            {edital.resumo && (
              <section aria-labelledby="resumo-heading">
                <h2 id="resumo-heading">Resumo do edital</h2>
                {edital.resumo.split('\n').filter(Boolean).map((paragrafo, indice) => (
                  <p key={indice}>{paragrafo}</p>
                ))}
              </section>
            )}

            <section
              aria-label="Conteúdo integral do edital"
              dangerouslySetInnerHTML={{ __html: edital.conteudoAcessivel }}
            />

            {edital.regrasElegibilidade && (
              <section aria-labelledby="regras-heading">
                <h2 id="regras-heading">Regras de elegibilidade</h2>
                <ul>
                  {edital.regrasElegibilidade.split('\n').filter(Boolean).map((regra, indice) => (
                    <li key={indice}>{regra}</li>
                  ))}
                </ul>
              </section>
            )}

            {edital.acoesAfirmativas && (
              <section aria-labelledby="afirmativas-heading">
                <h2 id="afirmativas-heading">Ações afirmativas</h2>
                <ul>
                  {edital.acoesAfirmativas.split('\n').filter(Boolean).map((acao, indice) => (
                    <li key={indice}>{acao}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </FaixaSecao>
      )}

      <div className="papel-textura bg-papel-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Links relacionados" className="flex flex-wrap gap-x-8 gap-y-3">
            <Link
              href={`/editais/${slug}`}
              className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
            >
              <IconArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar ao edital
            </Link>
            <Link
              href="/editais"
              className="inline-flex min-h-[44px] items-center text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
            >
              Ver todos os editais
            </Link>
            <Link
              href="/contato"
              className="inline-flex min-h-[44px] items-center text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
            >
              Fale conosco
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
