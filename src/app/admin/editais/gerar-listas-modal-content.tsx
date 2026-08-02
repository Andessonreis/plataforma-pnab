'use client'

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import { STATUS_OPTIONS, ALL_PHASES, isPhaseReached } from './gerar-listas-status'
import type { EditalInscricaoCounts } from './actions'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'

interface GerarListasModalContentProps {
  editalId: string
  editalTitulo: string
  editalStatus: EditalStatus
  selected: string
  onSelectedChange: (value: string) => void
  data: EditalInscricaoCounts | null
  loading: 'pdf' | 'csv' | null
  onDownload: (format: 'pdf' | 'csv') => void
}

export function GerarListasModalContent({
  editalId,
  editalTitulo,
  editalStatus,
  selected,
  onSelectedChange,
  data,
  loading,
  onDownload,
}: GerarListasModalContentProps) {
  const isAllPhases = selected === ALL_PHASES
  const phaseNotReached = !isAllPhases && !isPhaseReached(selected as InscricaoStatus, editalStatus)
  const hasZero = !isAllPhases && data !== null && (data.byStatus[selected] ?? 0) === 0
  const buttonsDisabled = loading !== null || phaseNotReached || hasZero

  const options = [
    { value: ALL_PHASES, label: 'Todas as fases' },
    ...STATUS_OPTIONS.map((status) => {
      const reached = isPhaseReached(status, editalStatus)
      const count = data?.byStatus[status] ?? 0
      const disabled = !reached || count === 0

      let label = status === 'ENVIADA' ? 'Inscrições Enviadas' : inscricaoStatusLabel[status]
      if (!reached) {
        label += ' (fase não alcançada)'
      } else if (data !== null) {
        label += ` (${count})`
      }

      return { value: status, label, disabled }
    }),
  ]

  return (
    <>
      <DialogHeader>
        <DialogTitle>Gerar Listas</DialogTitle>
        <DialogDescription className="line-clamp-1">
          {editalTitulo}
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <Select
          id={`status-select-${editalId}`}
          label="Status da inscrição"
          value={selected}
          onChange={(e) => onSelectedChange(e.target.value)}
          options={options}
        />

        {phaseNotReached && (
          <p className="mt-1.5 text-xs text-amber-600">
            O edital ainda não chegou nesta fase.
          </p>
        )}
        {!phaseNotReached && hasZero && (
          <p className="mt-1.5 text-xs text-slate-500">
            Nenhuma inscrição com este status.
          </p>
        )}
      </div>

      <DialogFooter>
        <button
          type="button"
          onClick={() => onDownload('csv')}
          disabled={buttonsDisabled}
          className={[
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
            'bg-slate-100 text-slate-700 hover:bg-slate-200',
            buttonsDisabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {loading === 'csv' ? (
            <Spinner />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {isAllPhases ? 'Ver Todas' : 'Baixar CSV'}
        </button>
        <button
          type="button"
          onClick={() => onDownload('pdf')}
          disabled={buttonsDisabled}
          className={[
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
            'bg-brand-600 text-white hover:bg-brand-700',
            buttonsDisabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {loading === 'pdf' ? (
            <Spinner />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {isAllPhases ? 'Ver Todas' : 'Baixar PDF'}
        </button>
      </DialogFooter>
    </>
  )
}
