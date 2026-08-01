import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconArrowLeft } from '@/components/ui/icons'
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

/**
 * A classificação do edital, na mesma linguagem do documento.
 *
 * A página tinha ficado para trás da repaginação: cabeçalho genérico com
 * migalhas, fundo cinza de aplicativo e tabela de sistema, enquanto o edital ao
 * lado virou faixas de cor de ponta a ponta. Como é a página que o proponente
 * mais procura depois do prazo, destoar dela era o pior lugar para destoar.
 */
export default async function PaginaResultados({ params }: Props) {
  const { slug } = await params
  const dados = await consultarResultado(slug)

  if (!dados) notFound()

  return (
    <div className="tema-secult font-questrial">
      <section className="bg-tinta-950 text-papel-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href={`/editais/${slug}`}
            className="rotulo inline-flex min-h-[44px] items-center gap-2 text-[0.7rem] text-papel-100/75 transition-colors hover:text-papel-50"
          >
            <IconArrowLeft className="h-4 w-4" />
            {dados.titulo}
          </Link>

          <h1 className="titulo mt-4 text-4xl leading-tight text-papel-50 sm:text-5xl">
            {dados.resultado?.titulo ?? 'Resultados'}
          </h1>

          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-papel-100/80">
            {dados.resultado
              ? `${dados.linhas.length} ${dados.linhas.length === 1 ? 'proposta classificada' : 'propostas classificadas'} · Edital de ${dados.ano}`
              : 'A classificação deste edital ainda não foi divulgada.'}
          </p>
        </div>
      </section>

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
              <TabelaClassificacao linhas={dados.linhas} porPontuacao={dados.porPontuacao} />
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
