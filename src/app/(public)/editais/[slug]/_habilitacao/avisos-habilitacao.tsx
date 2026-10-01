import Link from 'next/link'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { formatDateTime } from '@/lib/utils/format'
import type { HabilitacaoEdital } from './consulta'

export function AvisoIndisponivelHabilitacao({ dados }: { dados: HabilitacaoEdital }) {
  return (
    <FaixaSecao id="aguardando" cartela="Ainda não publicado" cor="papel" corCartela="tinta">
      <div className="max-w-2xl space-y-3 leading-relaxed text-tinta-900">
        <p>
          A relação de projetos habilitados deste edital ainda não foi divulgada oficialmente pela Secretaria Municipal de Cultura e Turismo.
        </p>
        {dados.dataPublicacaoPrevista && (
          <p className="text-sm text-tinta-600">
            Previsão conforme cronograma oficial retificado: <strong>{formatDateTime(dados.dataPublicacaoPrevista)}</strong>.
          </p>
        )}
        <p className="text-sm text-tinta-600">
          Assim que a publicação for veiculada no Diário Oficial do Município de Irecê, a lista completa dos projetos habilitados e inabilitados estará disponível para consulta pública nesta página.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        <Link
          href={`/editais/${dados.slug}#cronograma`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Ver o cronograma do edital
        </Link>
        <Link
          href={`/editais/${dados.slug}/resultados-preliminar`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Ver o resultado preliminar da seleção
        </Link>
      </div>
    </FaixaSecao>
  )
}

export function ComoLerHabilitacao() {
  return (
    <FaixaSecao id="recursos" cartela="Orientações sobre Recursos — Fase de Habilitação" cor="papel-forte" corCartela="ameixa">
      <ul className="max-w-3xl space-y-3 leading-relaxed text-tinta-900">
        <li>
          Conforme cronograma oficial retificado (<strong>Retificação nº 02</strong>), o período para interposição de recursos contra o resultado da fase de habilitação documental é de{' '}
          <strong>02/10/2026 (00:00)</strong> até <strong>05/10/2026 (23:59)</strong>.
        </li>
        <li>
          Os proponentes com inscrições <strong>inabilitadas</strong> por pendência documental poderão protocolar suas razões e regularizações diretamente pelo Portal PNAB Irecê acessando sua conta com CPF/CNPJ cadastrado.
        </li>
        <li>
          O resultado definitivo dos projetos habilitados após o julgamento dos recursos será publicado em{' '}
          <strong>06/10/2026</strong>.
        </li>
        <li className="text-sm text-tinta-700 pt-2 border-t border-tinta-900/15">
          Este documento e esta página refletem as informações oficiais registradas pela Secretaria Municipal de Cultura e Turismo de Irecê/BA. Dados pessoais de proponentes são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
        </li>
      </ul>
    </FaixaSecao>
  )
}
