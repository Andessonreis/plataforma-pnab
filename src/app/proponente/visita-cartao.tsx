import type { MemorialStatusAgendamento } from '@prisma/client'
import { Carimbo, type TomCarimbo } from '@/components/ui/carimbo'
import { dateParaDia, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { CaixaData } from './caixa-data'
import { diaEMes } from './prazos'

export interface VisitaMemorial {
  protocolo: string
  data: Date
  status: MemorialStatusAgendamento
  horaInicio: string
  horaFim: string
  instituicao: string
}

const TOM_STATUS: Record<MemorialStatusAgendamento, TomCarimbo> = {
  SOLICITADO: 'curso',
  EM_ANALISE: 'curso',
  REAGENDAMENTO_SOLICITADO: 'curso',
  CONFIRMADO: 'safra',
  REALIZADO: 'prestacao',
  RECUSADO: 'arquivo',
  CANCELADO: 'arquivo',
  NAO_COMPARECEU: 'arquivo',
}

/** "15 out, 16:15": a visita em uma linha, para o atalho do pager. */
export function visitaEmPoucasPalavras(visita: VisitaMemorial): string {
  const { dia, mes } = diaEMes(visita.data, 'UTC')
  return `${dia} ${mes}, ${visita.horaInicio}`
}

interface VisitaCartaoProps {
  visita: VisitaMemorial
  /** Em que pé a visita está para quem lê: "Próxima visita", "Última visita"... */
  rotulo: string
}

/** Uma visita ao Memorial no bloco escuro do painel: data, horário, grupo e situação. */
export function VisitaCartao({ visita, rotulo }: VisitaCartaoProps) {
  const { dia, mes } = diaEMes(visita.data, 'UTC')

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-accent-300">{rotulo}</p>
      <div className="mt-3 flex gap-4">
        <CaixaData dia={dia} mes={mes} className="self-start" />
        <div className="min-w-0">
          <p className="font-semibold leading-snug first-letter:uppercase">{formatarDiaPorExtenso(dateParaDia(visita.data))}</p>
          <p className="text-sm text-papel-100">
            Das {visita.horaInicio} às {visita.horaFim}, {visita.instituicao}
          </p>
          <Carimbo tom={TOM_STATUS[visita.status]} sobre="tinta" className="mt-3 !rotate-0">
            {ROTULO_STATUS[visita.status]}
          </Carimbo>
        </div>
      </div>
    </div>
  )
}
