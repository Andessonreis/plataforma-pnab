import type { Notification } from '@prisma/client'
import { CaixaData } from '../caixa-data'
import type { GrupoDoDia } from './agrupar-por-dia'
import { NotificationItem } from './notification-item'

interface DiaNotificacoesProps {
  grupo: GrupoDoDia<Notification>
  /** Só o primeiro dia leva as âncoras do tour no seu primeiro aviso. */
  destaqueTour?: boolean
}

/**
 * Um dia do fio de avisos, como a página de um diário: a data em caixa na
 * margem esquerda (no celular, ao lado do título do dia) e os avisos dela à
 * direita, separados por fio fino.
 */
export function DiaNotificacoes({ grupo, destaqueTour }: DiaNotificacoesProps) {
  const tituloId = `dia-${grupo.chave}`

  return (
    <section aria-labelledby={tituloId} className="grid gap-x-8 border-t-2 border-tinta-900 pt-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3">
        <CaixaData dia={grupo.dia} mes={grupo.mes} className="text-tinta-900" />
        <h2 id={tituloId} className="font-semibold leading-tight text-tinta-900">
          {grupo.rotulo}
          {grupo.data && <span className="block text-sm font-normal text-tinta-700">{grupo.data}</span>}
        </h2>
      </div>

      <ul className="mt-2 sm:mt-0">
        {grupo.itens.map((n, index) => (
          <NotificationItem
            key={n.id}
            id={n.id}
            titulo={n.titulo}
            corpo={n.corpo}
            link={n.link}
            ctaLabel={n.ctaLabel}
            lidaEm={n.lidaEm?.toISOString() ?? null}
            createdAt={n.createdAt.toISOString()}
            destaqueTour={destaqueTour && index === 0}
          />
        ))}
      </ul>
    </section>
  )
}
