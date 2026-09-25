import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft, IconDownload } from '@/components/ui/icons'
import { ClassificacaoPorCategoria } from './classificacao-por-categoria'
import { AvisoIndisponivel, ComoLer } from './avisos-resultado'
import { consultarResultado, type FaseResultado, type ResultadoEdital } from './consulta'
import { rotuloDiarioOficial } from './diario-oficial'

interface PropsPagina {
  slug: string
  fase: FaseResultado
}

const TITULO_DA_FASE: Record<FaseResultado, string> = {
  preliminar: 'Resultado preliminar',
  definitivo: 'Resultado final',
}

const FOTOS = [
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

export async function metadataResultados({ slug, fase }: PropsPagina): Promise<Metadata> {
  const dados = await consultarResultado(slug, fase)
  if (!dados) return { title: 'Resultados' }

  return {
    title: `${TITULO_DA_FASE[fase]} — ${dados.titulo}`,
    description: dados.disponivel ? `Classificação das propostas do edital ${dados.titulo}.` : undefined,
  }
}

/** Texto de apoio sob o título: quantas propostas, em quantas categorias, ou por que ainda não há lista. */
function apoioDaCapa(dados: ResultadoEdital): string {
  if (!dados.disponivel) return 'A classificação desta fase não está disponível.'
  const propostas = `${dados.total} ${dados.total === 1 ? 'proposta classificada' : 'propostas classificadas'}`
  const categorias = `${dados.categorias.length} ${dados.categorias.length === 1 ? 'categoria' : 'categorias'}`
  return `${propostas}, em ${categorias}.`
}

/**
 * A classificação de uma fase do edital, na mesma capa e navegação do documento.
 *
 * É a página que o proponente mais procura depois que o prazo fecha. O
 * preliminar e o definitivo compartilham este corpo e mudam só a lista lida e
 * os avisos: o preliminar mostra a cópia do que foi publicado, o definitivo, a
 * classificação depois dos recursos.
 */
export async function PaginaResultados({ slug, fase }: PropsPagina) {
  const dados = await consultarResultado(slug, fase)
  if (!dados) notFound()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Resultados"
        chamada={`Edital de ${dados.ano}`}
        titulo={TITULO_DA_FASE[fase]}
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
        </div>
      </FolhaDeRosto>

      {!dados.disponivel ? (
        <AvisoIndisponivel dados={dados} />
      ) : (
        <>
          <FaixaSecao id="classificacao" cartela="Classificação" cor="papel" corCartela="terracota">
            {dados.categorias.length === 0 ? (
              <p className="leading-relaxed">Nenhuma proposta chegou à fase de classificação neste edital.</p>
            ) : (
              <>
                {dados.diarioOficialUrl && (
                  <div className="mb-6 flex flex-col gap-3 border-2 border-tinta-900 bg-papel-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-700">Publicação Oficial</p>
                      <p className="mt-0.5 text-sm font-medium text-tinta-900">
                        Consulte a publicação oficial com a lista completa no Diário Oficial do Município de Irecê.
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
                <ClassificacaoPorCategoria categorias={dados.categorias} porPontuacao={dados.porPontuacao} />
              </>
            )}
          </FaixaSecao>

          <ComoLer dados={dados} />
        </>
      )}
    </div>
  )
}
