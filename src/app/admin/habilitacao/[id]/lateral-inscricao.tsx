import type { InscricaoStatus } from '@prisma/client'
import { Card, IconClock } from '@/components/ui'
import { SomenteLeitura } from '@/components/espelho/somente-leitura'
import { HabilitacaoActions } from '@/app/admin/inscricoes/[id]/habilitacao-actions'

interface Props {
  inscricao: {
    id: string
    numero: string
    status: InscricaoStatus
    submittedAt: Date | null
    motivoInabilitacao: string | null
    totalAnexos: number
  }
  /** Edital na fase de habilitação: só então a habilitação pode ser registrada. */
  podeHabilitarAgora: boolean
  /** Modo espelho: mostra as ações de habilitação, mas travadas. */
  somenteLeitura: boolean
}

/** Coluna lateral da conferência: resumo, ações de habilitação e motivo da inabilitação. */
export function LateralInscricao({ inscricao, podeHabilitarAgora, somenteLeitura }: Props) {
  return (
    <aside className="xl:col-span-4 2xl:col-span-3 space-y-4 sm:space-y-6">
      {/* Resumo */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Resumo
        </h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-500">Número</dt>
            <dd className="text-slate-900 font-mono mt-0.5">{inscricao.numero}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Enviada em</dt>
            <dd className="text-slate-900 mt-0.5">
              {inscricao.submittedAt
                ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'America/Sao_Paulo',
                  })
                : 'Não enviada'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Documentos enviados</dt>
            <dd className="text-slate-900 mt-0.5">
              {inscricao.totalAnexos} {inscricao.totalAnexos === 1 ? 'documento' : 'documentos'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Ações de habilitação — só quando edital está na fase HABILITACAO */}
      {podeHabilitarAgora ? (
        <SomenteLeitura ativo={somenteLeitura}>
          <HabilitacaoActions
            inscricaoId={inscricao.id}
            currentStatus={inscricao.status}
            motivoAtual={inscricao.motivoInabilitacao ?? ''}
          />
        </SomenteLeitura>
      ) : (
        <Card padding="sm" className="sm:p-6 border-slate-200 bg-slate-50/60">
          <div className="flex items-start gap-2.5">
            <IconClock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                Fora da fase de habilitação
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A habilitação só pode ser registrada enquanto o edital estiver na fase de
                habilitação. Aguarde a abertura da fase para conferir e decidir.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Motivo da inabilitação — quando já existe */}
      {inscricao.motivoInabilitacao && (
        <Card padding="sm" className="sm:p-6 border-rose-200 bg-rose-50">
          <h2 className="text-sm font-semibold text-rose-900 uppercase tracking-wider mb-2">
            Motivo da inabilitação
          </h2>
          <p className="text-sm text-rose-800 break-words leading-relaxed">
            {inscricao.motivoInabilitacao}
          </p>
        </Card>
      )}
    </aside>
  )
}
