'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/components/ui/dialog'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import { editaisClient } from '@client/api/editais.client'
import { getInscricaoCountsByEdital } from './actions'
import type { EditalInscricaoCounts } from './actions'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'

const STATUS_OPTIONS: InscricaoStatus[] = [
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

const ALL_PHASES = '__ALL__'

const EDITAL_PHASE_ORDER: Record<EditalStatus, number> = {
  RASCUNHO: 0,
  PUBLICADO: 1,
  INSCRICOES_ABERTAS: 2,
  INSCRICOES_ENCERRADAS: 3,
  HABILITACAO: 4,
  AVALIACAO: 5,
  RESULTADO_PRELIMINAR: 6,
  RECURSO: 7,
  RESULTADO_FINAL: 8,
  ENCERRADO: 9,
}

const MIN_EDITAL_PHASE: Record<InscricaoStatus, EditalStatus> = {
  RASCUNHO: 'INSCRICOES_ABERTAS',
  ENVIADA: 'INSCRICOES_ABERTAS',
  HABILITADA: 'HABILITACAO',
  INABILITADA: 'HABILITACAO',
  EM_AVALIACAO: 'AVALIACAO',
  RESULTADO_PRELIMINAR: 'RESULTADO_PRELIMINAR',
  RECURSO_ABERTO: 'RECURSO',
  RESULTADO_FINAL: 'RESULTADO_FINAL',
  CONTEMPLADA: 'RESULTADO_FINAL',
  NAO_CONTEMPLADA: 'RESULTADO_FINAL',
  SUPLENTE: 'RESULTADO_FINAL',
}

function isPhaseReached(inscricaoStatus: InscricaoStatus, editalStatus: EditalStatus): boolean {
  return EDITAL_PHASE_ORDER[editalStatus] >= EDITAL_PHASE_ORDER[MIN_EDITAL_PHASE[inscricaoStatus]]
}

interface GerarListasModalProps {
  editalId: string
  editalTitulo: string
  editalStatus: EditalStatus
}

export function GerarListasModal({ editalId, editalTitulo, editalStatus }: GerarListasModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>(ALL_PHASES)
  const [loading, setLoading] = useState<'pdf' | 'csv' | null>(null)
  const [data, setData] = useState<EditalInscricaoCounts | null>(null)

  // Buscar contagens ao abrir o modal
  useEffect(() => {
    if (!open) return
    setData(null)
    getInscricaoCountsByEdital(editalId).then(setData)
  }, [open, editalId])

  async function handleDownload(format: 'pdf' | 'csv') {
    if (selected === ALL_PHASES) {
      setOpen(false)
      router.push(`/admin/editais/${editalId}/listas`)
      return
    }

    setLoading(format)

    try {
      const url = format === 'pdf'
        ? editaisClient.listaPdfUrl(editalId, selected)
        : `/api/v1/inscricoes/exportacao?editalId=${editalId}&status=${selected}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ${res.status}`)

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download =
        res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ??
        `lista_${selected.toLowerCase()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro ao baixar:', err)
      alert('Erro ao gerar o arquivo. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  const isAllPhases = selected === ALL_PHASES
  const phaseNotReached = !isAllPhases && !isPhaseReached(selected as InscricaoStatus, editalStatus)
  const hasZero = !isAllPhases && data !== null && (data.byStatus[selected] ?? 0) === 0
  const buttonsDisabled = loading !== null || phaseNotReached || hasZero

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
        >
          Listas
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white max-h-[85vh] flex flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar Listas</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {editalTitulo}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label htmlFor={`status-select-${editalId}`} className="block text-sm font-medium text-slate-700 mb-1.5">
            Status da inscrição
          </label>
          <select
            id={`status-select-${editalId}`}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none min-h-[44px]"
          >
            <option value={ALL_PHASES}>Todas as fases</option>
            {STATUS_OPTIONS.map((status) => {
              const reached = isPhaseReached(status, editalStatus)
              const count = data?.byStatus[status] ?? 0
              const disabled = !reached || count === 0

              let label = status === 'ENVIADA' ? 'Inscrições Enviadas' : inscricaoStatusLabel[status]
              if (!reached) {
                label += ' (fase não alcançada)'
              } else if (data !== null) {
                label += ` (${count})`
              }

              return (
                <option key={status} value={status} disabled={disabled}>
                  {label}
                </option>
              )
            })}
          </select>

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
            onClick={() => handleDownload('csv')}
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
            onClick={() => handleDownload('pdf')}
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
      </DialogContent>
    </Dialog>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
