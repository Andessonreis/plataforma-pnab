import type { MemorialAgendamento } from '@prisma/client'
import { IconChatBubble, IconClock, IconMail, IconPhone, IconUsers } from '@/components/ui'
import { formatTelefoneBR } from '@/lib/utils/format'
import { dateParaDia, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { ROTULO_TURNO } from '@/lib/memorial/agendamento/status'
import { FolhaData, botaoNeutro } from '@/app/admin/memorial/_ui'
import { faltaPara } from '@/app/admin/memorial/_ui/agenda-tempo'

/** O essencial do pedido de relance: quando, quantos, quem, e como falar com o responsável. */
export function ResumoVisita({ visita: v, hoje }: { visita: MemorialAgendamento; hoje: string }) {
  const dia = dateParaDia(v.data)
  const falta = faltaPara(dia, hoje)
  const digitos = v.responsavelTelefone.replace(/\D/g, '')

  return (
    <section aria-label="Resumo do pedido" className="rounded-xl border border-tinta-900/15 bg-white p-4 sm:p-5">
      <div className="flex gap-4">
        <FolhaData data={v.data} className="w-16 sm:w-20" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-lg font-bold text-tinta-900 first-letter:uppercase">
            {formatarDiaPorExtenso(dia)}
            {falta && <span className="ml-2 text-sm font-semibold text-accent-800">{falta}</span>}
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-base text-tinta-800">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <IconClock className="h-5 w-5 text-tinta-500" />
              {v.horaInicio} às {v.horaFim}, {ROTULO_TURNO[v.turno].toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
              <IconUsers className="h-5 w-5 text-tinta-500" />
              {v.quantidade} pessoas
            </span>
          </p>
          <p className="text-sm text-tinta-700">{[v.tipoVisitante, v.faixaEtaria, v.turma].filter(Boolean).join(', ')}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-tinta-900/10 pt-4">
        <h2 className="text-sm font-bold text-tinta-900">
          {v.responsavelNome}
          {v.responsavelCargo && <span className="font-normal text-tinta-600">, {v.responsavelCargo}</span>}
        </h2>
        <p className="text-sm tabular-nums text-tinta-700">{formatTelefoneBR(v.responsavelTelefone)}</p>
        <p className="break-all text-sm text-tinta-700">{v.responsavelEmail}</p>
        {v.preferenciaContato && <p className="text-sm text-tinta-700">Prefere ser avisado por {v.preferenciaContato}.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`https://wa.me/55${digitos}`} target="_blank" rel="noopener noreferrer" className={`${botaoNeutro} flex-1 whitespace-nowrap px-3`}>
            <IconChatBubble className="h-4 w-4" />
            WhatsApp
          </a>
          <a href={`tel:+55${digitos}`} className={`${botaoNeutro} flex-1 whitespace-nowrap px-3`}>
            <IconPhone className="h-4 w-4" />
            Ligar
          </a>
          <a href={`mailto:${v.responsavelEmail}`} className={`${botaoNeutro} flex-1 whitespace-nowrap px-3`}>
            <IconMail className="h-4 w-4" />
            E-mail
          </a>
        </div>
      </div>
    </section>
  )
}
