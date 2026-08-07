import Link from 'next/link'
import type { InscricaoStatus } from '@prisma/client'
import { STATUS_BUCKETS, contarBucket, type StatusBucketKey } from './status-buckets'

interface StatusTabsProps {
  activeKey: StatusBucketKey
  contagemPorStatus: Map<InscricaoStatus, number>
  totalGeral: number
}

/**
 * Grade 2 colunas no mobile em vez de fileira com scroll horizontal —
 * o scroll cortava "Contempladas" na metade e escondia "Não contempladas"
 * fora da tela, sem nenhuma pista visual de que dava pra arrastar.
 * A partir de sm, os 5 filtros cabem numa linha só, então volta a ser fileira.
 */
function StatusTabs({ activeKey, contagemPorStatus, totalGeral }: StatusTabsProps) {
  const chaves = Object.keys(STATUS_BUCKETS) as StatusBucketKey[]
  const tabs = chaves.map((key) => {
    const bucket = STATUS_BUCKETS[key]
    const contagem = contarBucket(bucket.statuses, contagemPorStatus, totalGeral)
    return {
      key,
      label: bucket.label,
      contagem,
      href: key === 'todas' ? '/proponente/inscricoes' : `/proponente/inscricoes?status=${key}`,
    }
  })

  return (
    <nav
      aria-label="Filtrar inscrições por status"
      className="mb-5 grid grid-cols-2 gap-1.5 sm:mb-6 sm:flex sm:flex-wrap sm:gap-1 sm:rounded-lg sm:bg-papel-200/70 sm:p-1"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeKey
        const isUltimoImpar = index === tabs.length - 1 && tabs.length % 2 === 1
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'sm:rounded-md sm:px-4',
              isUltimoImpar ? 'col-span-2 sm:col-span-1' : '',
              isActive
                ? 'bg-accent-500 font-bold text-tinta-950 shadow-sm sm:bg-white sm:font-semibold sm:text-tinta-950'
                : 'bg-papel-100 text-tinta-700/70 hover:bg-papel-200 sm:bg-transparent sm:hover:bg-white/60',
            ].join(' ')}
          >
            {tab.label}
            <span className={isActive ? 'text-tinta-950/60' : 'text-tinta-700/45'}>({tab.contagem})</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { StatusTabs }
