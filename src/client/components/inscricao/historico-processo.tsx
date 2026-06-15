import { Card, Badge, IconClock } from '@client/components/ui'
import { ACTION_LABELS, actionBadgeVariant } from '@server/lib/audit'
import { getHistoricoProcesso, type EventoHistorico } from '@/lib/services/historico-processo'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
  PROPONENTE: 'Proponente',
}

/**
 * Linha do tempo do processo da inscrição (habilitação + avaliação).
 * ⚠️ Restrito ao ADMIN — expõe quem avaliou e a nota (avaliação é cega).
 */
export async function HistoricoProcesso({ inscricaoId }: { inscricaoId: string }) {
  const eventos = await getHistoricoProcesso(inscricaoId)

  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <IconClock className="h-5 w-5 text-slate-400" />
        Histórico do processo
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Registro de habilitação e avaliação. Visível apenas para a administração.
      </p>

      {eventos.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">
          Nenhum evento registrado ainda para esta inscrição.
        </p>
      ) : (
        <ol className="relative border-l border-slate-200 ml-1.5 space-y-5">
          {eventos.map((evento) => (
            <li key={evento.id} className="ml-5">
              <span
                className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <Badge variant={actionBadgeVariant(evento.action)}>
                  {ACTION_LABELS[evento.action] ?? evento.action}
                </Badge>
                <time className="text-xs text-slate-400 tabular-nums">
                  {new Date(evento.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </time>
              </div>
              {evento.ator && (
                <p className="text-sm text-slate-700">
                  {evento.ator.nome}{' '}
                  <span className="text-slate-400">
                    · {ROLE_LABELS[evento.ator.role] ?? evento.ator.role}
                  </span>
                </p>
              )}
              <DetalheEvento evento={evento} />
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

/** Linha de detalhe contextual por tipo de evento */
function DetalheEvento({ evento }: { evento: EventoHistorico }) {
  const d = evento.details
  if (!d) return null

  // Nota da avaliação finalizada
  if (evento.action === 'AVALIACAO_FINALIZADA' && d.notaTotal != null) {
    return (
      <p className="text-xs text-slate-500 mt-0.5">
        Nota: <span className="font-semibold text-brand-700">{String(d.notaTotal)}</span>
      </p>
    )
  }

  // Quantidade de avaliadores atribuídos
  if (evento.action === 'AVALIADOR_ATRIBUIDO' && Array.isArray(d.avaliadorIds)) {
    const n = d.avaliadorIds.length
    return (
      <p className="text-xs text-slate-500 mt-0.5">
        {n} {n === 1 ? 'avaliador atribuído' : 'avaliadores atribuídos'}
      </p>
    )
  }

  // Motivo (inabilitação ou bloqueio de fase)
  if (typeof d.motivo === 'string' && d.motivo.trim()) {
    return <p className="text-xs text-slate-500 mt-0.5 break-words">Motivo: {d.motivo}</p>
  }

  return null
}
