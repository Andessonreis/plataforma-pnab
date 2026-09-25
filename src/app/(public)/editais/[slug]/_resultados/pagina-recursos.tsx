import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft, IconDownload } from '@/components/ui/icons'
import { hrefResultados } from '@/lib/edital/rotas-resultado'
import { formatDate } from '@/lib/utils/format'
import { consultarResultadoRecursos, type ResultadoRecursos } from './consulta-recursos'
import { rotuloDiarioOficial } from './diario-oficial'
import { TabelaRecursos } from './tabela-recursos'

const TITULO = 'Resultado dos recursos'

const LINK_DA_CAPA =
  'inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-300 underline-offset-4 hover:underline'
const BOTAO_DA_CAPA =
  'inline-flex min-h-[44px] items-center gap-2 bg-accent-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400'

export async function metadataRecursos(slug: string): Promise<Metadata> {
  const dados = await consultarResultadoRecursos(slug)
  return { title: dados ? `${TITULO} — ${dados.titulo}` : 'Resultados' }
}

function apoioDaCapa(dados: ResultadoRecursos): string {
  if (!dados.disponivel) return 'O resultado dos recursos ainda não foi publicado.'
  const n = dados.recursos.length
  if (n === 0) return `Nenhum recurso foi interposto na etapa de ${dados.etapa.toLowerCase()}.`
  return `${n} ${n === 1 ? 'recurso interposto' : 'recursos interpostos'} na etapa de ${dados.etapa.toLowerCase()}.`
}

/** Dados da etapa como o Relatório de Recursos Interpostos os apresenta. */
function ResumoDaEtapa({ dados }: { dados: ResultadoRecursos }) {
  const itens = [
    ['Etapa', dados.etapa],
    ...(dados.prazo ? [['Prazo para interposição', `${formatDate(dados.prazo.inicio)} a ${formatDate(dados.prazo.fim)}`]] : []),
    [dados.rotuloDoUniverso, String(dados.totalInscricoes)],
    ['Recursos interpostos', String(dados.recursos.length)],
  ]
  return (
    <dl className="mb-8 grid gap-x-8 gap-y-3 border-2 border-tinta-900/15 bg-papel-50 p-5 sm:grid-cols-2">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">{rotulo}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-tinta-900">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A decisão dos recursos da seleção, na mesma capa e navegação das páginas de
 * resultado. Só lista quando o resultado final saiu; antes disso avisa que
 * ainda não foi publicado.
 */
export async function PaginaRecursos({ slug }: { slug: string }) {
  const dados = await consultarResultadoRecursos(slug)
  if (!dados) notFound()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={dados.fotos}
        trilha="Resultados"
        chamada={`Edital de ${dados.ano}`}
        titulo={TITULO}
        apoio={apoioDaCapa(dados)}
        compacto
      >
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link href={`/editais/${slug}`} className={LINK_DA_CAPA}>
            <IconArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {dados.titulo}
          </Link>
          {dados.relatorioUrl && (
            <a href={dados.relatorioUrl} target="_blank" rel="noopener noreferrer" className={BOTAO_DA_CAPA}>
              <IconDownload className="h-4 w-4" aria-hidden="true" />
              Baixar relatório (PDF)
            </a>
          )}
        </div>
      </FolhaDeRosto>

      {!dados.disponivel ? (
        <FaixaSecao id="aguardando" cartela="Ainda não publicado" cor="papel" corCartela="tinta">
          <p className="max-w-2xl leading-relaxed">
            A decisão dos recursos é divulgada junto com o resultado final, na data prevista no cronograma do edital.
          </p>
          <Link
            href={`/editais/${slug}#cronograma`}
            className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Ver o cronograma do edital
          </Link>
        </FaixaSecao>
      ) : (
        <FaixaSecao id="recursos" cartela="Recursos" cor="papel" corCartela="terracota">
          <ResumoDaEtapa dados={dados} />
          {dados.recursos.length === 0 ? (
            <p className="leading-relaxed">Nenhum recurso foi interposto nesta etapa.</p>
          ) : (
            <TabelaRecursos recursos={dados.recursos} />
          )}
          <p className="mt-8 max-w-2xl leading-relaxed text-tinta-700">
            Relação dos recursos registrados no prazo recursal, com a decisão da Comissão de Seleção. O resultado já
            considera essas decisões:{' '}
            <Link href={hrefResultados(slug, true)} className="font-semibold text-brand-700 underline underline-offset-4">
              ver o resultado final
            </Link>
            .
            {dados.diarioOficialUrl && (
              <>
                {' '}Publicação oficial:{' '}
                <a
                  href={dados.diarioOficialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-700 underline underline-offset-4"
                >
                  {rotuloDiarioOficial(dados.diarioOficialUrl)}
                </a>
                .
              </>
            )}
          </p>
        </FaixaSecao>
      )}
    </div>
  )
}
