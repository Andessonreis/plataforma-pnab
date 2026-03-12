'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { editalStatusLabel } from '@/lib/status-maps'
import type { EditalStatus } from '@prisma/client'

interface PreFlightInfo {
  edital: { id: string; titulo: string; status: EditalStatus }
  proximaFase: EditalStatus | null
  label: string | null
  pendencias: Record<string, number> | null
}

interface Props {
  editalId: string
  statusAtual: EditalStatus
}

export function AvancarFaseButton({ editalId, statusAtual }: Props) {
  const router = useRouter()
  const [info, setInfo] = useState<PreFlightInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreflight = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/avancar-fase`)
      if (!res.ok) throw new Error('Falha ao buscar informações da fase.')
      const data: PreFlightInfo = await res.json()
      setInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [editalId])

  useEffect(() => {
    fetchPreflight()
  }, [fetchPreflight])

  const handleAvancar = async () => {
    setAdvancing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/avancar-fase`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Erro ao avançar fase.')
        return
      }
      router.refresh()
    } catch {
      setError('Erro de conexão ao avançar fase.')
    } finally {
      setAdvancing(false)
    }
  }

  // Sem próxima fase disponível
  if (!loading && info && !info.proximaFase) return null

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="h-4 w-48 rounded bg-slate-200" />
      </div>
    )
  }

  if (!info?.proximaFase) return null

  const { pendencias, label } = info
  const totalInscricoes = pendencias
    ? Object.values(pendencias).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900">
            Próxima fase manual
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">
              {editalStatusLabel[statusAtual] ?? statusAtual}
            </Badge>
            <span className="text-slate-400">→</span>
            <Badge variant="info">{label}</Badge>
          </div>
          {totalInscricoes > 0 && (
            <p className="text-xs text-amber-700">
              {totalInscricoes} inscrição(ões) no edital
            </p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="primary" size="sm" disabled={advancing}>
              Avançar Fase
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Avanço de Fase</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Você está prestes a avançar o edital de{' '}
                    <strong>{editalStatusLabel[statusAtual] ?? statusAtual}</strong> para{' '}
                    <strong>{label}</strong>.
                  </p>
                  {pendencias && Object.keys(pendencias).length > 0 && (
                    <div className="rounded-md bg-slate-50 p-3 text-sm">
                      <p className="mb-1 font-medium text-slate-700">Inscrições por status:</p>
                      <ul className="space-y-0.5 text-slate-600">
                        {Object.entries(pendencias).map(([status, count]) => (
                          <li key={status}>
                            {status}: <strong>{count}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-amber-700 font-medium">
                    Esta ação não pode ser desfeita automaticamente.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleAvancar} disabled={advancing}>
                {advancing ? 'Avançando…' : 'Confirmar Avanço'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}
