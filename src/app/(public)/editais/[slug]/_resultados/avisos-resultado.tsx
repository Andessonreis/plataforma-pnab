import Link from 'next/link'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { hrefResultados } from '@/lib/edital/rotas-resultado'
import { formatDate } from '@/lib/utils/format'
import type { ResultadoEdital } from './consulta'

/** Por que a lista da fase não aparece: ainda não saiu, ou saiu antes de o portal guardá-la. */
function textoIndisponivel(dados: ResultadoEdital): string {
  if (dados.fase === 'definitivo') {
    return 'O resultado final sai depois do julgamento dos recursos, na data prevista no cronograma do edital. Quem tem inscrição enviada recebe aviso por e-mail assim que ele for publicado.'
  }
  return dados.definitivoPublicado
    ? 'A lista do resultado preliminar deste edital foi publicada no Diário Oficial e não ficou guardada no portal. A classificação atual está no resultado final.'
    : 'O resultado preliminar deste edital ainda não foi publicado.'
}

export function AvisoIndisponivel({ dados }: { dados: ResultadoEdital }) {
  const definitivo = dados.fase === 'definitivo'
  return (
    <FaixaSecao id="aguardando" cartela="Ainda não publicado" cor="papel" corCartela="tinta">
      <p className="max-w-2xl leading-relaxed">{textoIndisponivel(dados)}</p>
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        <Link
          href={`/editais/${dados.slug}#cronograma`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Ver o cronograma do edital
        </Link>
        {(definitivo || dados.definitivoPublicado) && (
          <Link
            href={hrefResultados(dados.slug, !definitivo)}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            {definitivo ? 'Ver o resultado preliminar' : 'Ver o resultado final'}
          </Link>
        )}
      </div>
    </FaixaSecao>
  )
}

export function ComoLer({ dados }: { dados: ResultadoEdital }) {
  const preliminar = dados.fase === 'preliminar'
  return (
    <FaixaSecao id="como-ler" cartela="Como ler este resultado" cor="papel-forte" corCartela="ameixa">
      <ul className="max-w-2xl space-y-3 leading-relaxed">
        {preliminar && !dados.definitivoPublicado && (
          <li>
            Esta classificação é <strong>preliminar</strong> e ainda admite recurso, no prazo
            previsto no cronograma do edital.
          </li>
        )}
        {preliminar && dados.definitivoPublicado && (
          <li>
            Esta é a classificação <strong>preliminar</strong>
            {dados.publicadoEm ? `, publicada em ${formatDate(dados.publicadoEm)}` : ''}. Depois do
            julgamento dos recursos saiu o{' '}
            <Link href={hrefResultados(dados.slug, true)} className="font-semibold text-brand-700 underline underline-offset-4">
              resultado final
            </Link>
            , que substitui esta lista.
          </li>
        )}
        {!preliminar && (
          <li>
            Esta é a classificação <strong>final</strong>, depois do julgamento dos recursos.
            A lista publicada antes está no{' '}
            <Link href={hrefResultados(dados.slug, false)} className="font-semibold text-brand-700 underline underline-offset-4">
              resultado preliminar
            </Link>
            .
          </li>
        )}
        <li>
          Dúvidas sobre a pontuação recebida devem ser encaminhadas pela página de contato,
          citando o número da inscrição.
        </li>
      </ul>
    </FaixaSecao>
  )
}
