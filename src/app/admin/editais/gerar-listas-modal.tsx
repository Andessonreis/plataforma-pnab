'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { IconClipboard } from '@/components/ui/icons'
import { getInscricaoCountsByEdital } from './actions'
import type { EditalInscricaoCounts } from './actions'
import type { EditalStatus } from '@prisma/client'
import { ALL_PHASES } from './gerar-listas-status'
import { GerarListasModalContent } from './gerar-listas-modal-content'

interface GerarListasModalProps {
  editalId: string
  editalTitulo: string
  editalStatus: EditalStatus
  /** Ícone só, sem rótulo visível (mantido para leitor de tela). */
  compact?: boolean
}

export function GerarListasModal({ editalId, editalTitulo, editalStatus, compact = false }: GerarListasModalProps) {
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
        ? `/api/admin/editais/${editalId}/listas?status=${selected}`
        : `/api/admin/inscricoes/export?editalId=${editalId}&status=${selected}`

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Gerar listas"
          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-md font-medium text-xs text-slate-600 transition-colors hover:bg-slate-100 ${compact ? 'min-w-[32px] justify-center px-1' : 'px-1.5'}`}
        >
          <IconClipboard className="h-3.5 w-3.5" />
          <span className={compact ? 'sr-only' : ''}>Listas</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white max-h-[85vh] flex flex-col sm:max-w-lg">
        <GerarListasModalContent
          editalId={editalId}
          editalTitulo={editalTitulo}
          editalStatus={editalStatus}
          selected={selected}
          onSelectedChange={setSelected}
          data={data}
          loading={loading}
          onDownload={handleDownload}
        />
      </DialogContent>
    </Dialog>
  )
}
