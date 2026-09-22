import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft, IconDownload } from '@/components/ui/icons'
import { consultarResultado } from './consulta'
import { TabelaClassificacao } from './tabela-classificacao'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dados = await consultarResultado(slug)
  if (!dados) return { title: 'Resultados' }

  return {
    title: dados.resultado
      ? `${dados.resultado.titulo} — ${dados.titulo}`
      : `Resultados — ${dados.titulo}`,
    description: dados.resultado
      ? `Classificação das propostas do edital ${dados.titulo}.`
      : undefined,
  }
}

const FOTOS = [
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

/**
 * A classificação do edital, na mesma capa e navegação do documento.
 *
 * A página reimplementava um cabeçalho escuro à parte, sem `FundoFotos` nem
 * migalha de fato — três produtos visuais para o mesmo edital. Aqui é a
 * mesma `FolhaDeRosto` da página principal, em variante compacta: é a
 * página que o proponente mais procura depois que o prazo fecha, e era a
 * que mais destoava do documento a que pertence.
 */
export default async function PaginaResultados({ params }: Props) {
  const { slug } = await params
  const dados = await consultarResultado(slug)

  if (!dados) notFound()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Resultados"
        chamada={`Edital de ${dados.ano}`}
        titulo={dados.resultado?.titulo ?? 'Resultados'}
        apoio={
          dados.resultado
            ? `${dados.linhas.length} ${dados.linhas.length === 1 ? 'proposta classificada' : 'propostas classificadas'}.`
            : 'A classificação deste edital ainda não foi divulgada.'
        }
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
              Diário Oficial (Edição nº 2.935)
            </a>
          )}
        </div>
      </FolhaDeRosto>

      {!dados.resultado ? (
        <FaixaSecao id="aguardando" cartela="Ainda não publicado" cor="papel" corCartela="tinta">
          <p className="max-w-2xl leading-relaxed">
            O resultado sai na data prevista no cronograma do edital. Quem tem inscrição enviada
            recebe aviso por e-mail assim que a classificação for publicada.
          </p>
          <Link
            href={`/editais/${slug}#cronograma`}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Ver o cronograma do edital
          </Link>
        </FaixaSecao>
      ) : (
        <>
          <FaixaSecao id="classificacao" cartela="Classificação" cor="papel" corCartela="terracota">
            {dados.linhas.length === 0 ? (
              <p className="leading-relaxed">
                Nenhuma proposta chegou à fase de classificação neste edital.
              </p>
            ) : (
              <>
                {dados.diarioOficialUrl && (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-2 border-tinta-900 bg-papel-50 p-4">
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
                <TabelaClassificacao linhas={dados.linhas} porPontuacao={dados.porPontuacao} />
              </>
            )}
          </FaixaSecao>

          <FaixaSecao
            id="como-ler"
            cartela="Como ler este resultado"
            cor="papel-forte"
            corCartela="ameixa"
          >
            <ul className="max-w-2xl space-y-3 leading-relaxed">
              {dados.resultado.preliminar && (
                <li>
                  Esta classificação é <strong>preliminar</strong> e ainda admite recurso, no prazo
                  previsto no cronograma do edital.
                </li>
              )}
              <li>
                Os nomes aparecem parcialmente ocultos por exigência da Lei Geral de Proteção de
                Dados. Cada proponente vê a própria inscrição por inteiro na área logada.
              </li>
              <li>
                Dúvidas sobre a pontuação recebida devem ser encaminhadas pela página de contato,
                citando o número da inscrição.
              </li>
            </ul>
          </FaixaSecao>
        </>
      )}
    </div>
  )
}
