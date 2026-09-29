import { IconInfo } from '@/components/ui'
import { mensagemJanela } from '@/lib/utils/cronograma-janela'
import type { SituacaoRecurso } from '@/lib/edital/recurso-proponente'
import { RecursoForm } from './recurso/recurso-form'

interface Props {
  situacao: SituacaoRecurso
  inscricaoId: string
  numero: string
  proponenteNome: string
}

/**
 * Bloco "Interpor Recurso". A página decide onde ele fica: com o prazo aberto
 * vai para o topo, em destaque, porque é a única pendência que exige ação do
 * proponente; fora do prazo fica na coluna lateral só como aviso.
 */
export function InterporRecursoSection({ situacao, inscricaoId, numero, proponenteNome }: Props) {
  const { fase, janela, aberto } = situacao

  if (!aberto && janela) {
    const titulo = janela.status === 'antes' ? 'Recurso ainda não disponível' : 'Período de recurso encerrado'
    return (
      <div className="flex items-start gap-3">
        <IconInfo className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
          <p className="text-sm text-slate-500 mt-1">{mensagemJanela(janela)}.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {janela?.ativa && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-accent-700">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" aria-hidden="true" />
          {mensagemJanela(janela)}.
        </p>
      )}
      <RecursoForm
        inscricaoId={inscricaoId}
        fase={fase}
        contexto={{
          entidadeNome: proponenteNome,
          projetoNome: numero,
          responsavelNome: proponenteNome,
        }}
      />
    </div>
  )
}
