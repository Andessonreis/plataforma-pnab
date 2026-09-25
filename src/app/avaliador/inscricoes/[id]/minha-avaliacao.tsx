import type { Avaliacao } from '@prisma/client'
import { AvaliacaoForm } from '@/app/admin/inscricoes/[id]/avaliacao-form'
import { SomenteLeitura } from '@/components/espelho/somente-leitura'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

interface Props {
  inscricao: { id: string; numero: string }
  criterios: CriterioAvaliacao[]
  /** Avaliação do avaliador dono da visão; ainda não existe antes do primeiro salvamento. */
  avaliacao: Avaliacao | undefined
  formulaAvaliacao: string | null
  podeReabrir: boolean
  avaliacaoEncerrada: boolean
  /** Modo espelho: mostra a avaliação, mas travada. */
  somenteLeitura: boolean
}

/**
 * Notas e parecer do próprio avaliador. Com a avaliação finalizada ou encerrada
 * o formulário vira a vista "Minha Avaliação", só de leitura.
 */
export function MinhaAvaliacao({
  inscricao,
  criterios,
  avaliacao,
  formulaAvaliacao,
  podeReabrir,
  avaliacaoEncerrada,
  somenteLeitura,
}: Props) {
  return (
    <SomenteLeitura ativo={somenteLeitura}>
      <AvaliacaoForm
        inscricaoId={inscricao.id}
        inscricaoNumero={inscricao.numero}
        criterios={criterios}
        initialAvaliacao={
          avaliacao
            ? {
                id: avaliacao.id,
                notas: avaliacao.notas as { criterio: string; nota: number; peso: number }[],
                parecer: avaliacao.parecer,
                notaTotal: avaliacao.notaTotal === null ? null : String(avaliacao.notaTotal),
                finalizada: avaliacao.finalizada,
                updatedAt: avaliacao.updatedAt.toISOString(),
              }
            : null
        }
        formulaAvaliacao={formulaAvaliacao}
        podeReabrir={podeReabrir}
        avaliacaoEncerrada={avaliacaoEncerrada}
      />
    </SomenteLeitura>
  )
}
