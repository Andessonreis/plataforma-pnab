'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export interface DestinatarioOption {
  id: string
  nome: string
  email: string
}

interface EnviarRelatorioModalProps {
  total: number
  status: InscricaoStatus
  editalId?: string
  categoria?: string
  destinatarios: DestinatarioOption[]
  onClose: () => void
}

interface Resultado {
  enviados: string[]
  falhas: { email: string; motivo: string }[]
  arquivos: number
  total: number
}

export default function EnviarRelatorioModal({
  total,
  status,
  editalId,
  categoria,
  destinatarios,
  onClose,
}: EnviarRelatorioModalProps) {
  const [selecionados, setSelecionados] = useState<string[]>(destinatarios.map((d) => d.id))
  const [ocultarTeste, setOcultarTeste] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    )
  }

  async function enviar() {
    if (selecionados.length === 0) return
    setEnviando(true)
    setErro(null)

    try {
      const res = await fetch('/api/admin/inscricoes/relatorio/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          editalId,
          categoria,
          ocultarTeste,
          destinatarios: selecionados,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message ?? 'Falha ao enviar o relatório.')
      setResultado(json.data)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao enviar o relatório.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar relatório por e-mail</DialogTitle>
          <DialogDescription>
            Um PDF por edital, com telefone de contato, anexado ao e-mail.
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-700">
              Enviado para <strong>{resultado.enviados.length}</strong> destinatário(s) —{' '}
              {resultado.arquivos} arquivo(s), {resultado.total} inscrição(ões).
            </p>
            <ul className="space-y-1 text-slate-600">
              {resultado.enviados.map((email) => (
                <li key={email}>✓ {email}</li>
              ))}
            </ul>
            {resultado.falhas.length > 0 && (
              <ul className="space-y-1 text-red-600">
                {resultado.falhas.map((f) => (
                  <li key={f.email}>✕ {f.email} — {f.motivo}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <dl className="rounded-lg bg-slate-50 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium text-slate-800">{inscricaoStatusLabel[status]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Área</dt>
                <dd className="font-medium text-slate-800">{categoria ?? 'Todas'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Inscrições no recorte</dt>
                <dd className="font-medium text-slate-800 tabular-nums">{total}</dd>
              </div>
            </dl>

            <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={ocultarTeste}
                onChange={(e) => setOcultarTeste(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                Descartar cadastros de teste
                <span className="block text-xs text-slate-400">
                  Ignora inscrições cujo nome do proponente contenha “teste”.
                </span>
              </span>
            </label>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Destinatários
              </legend>
              <ul className="space-y-1.5">
                {destinatarios.map((d) => (
                  <li key={d.id}>
                    <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer min-h-[36px]">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(d.id)}
                        onChange={() => alternar(d.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="min-w-0">
                        {d.nome}
                        <span className="block text-xs text-slate-400 truncate">{d.email}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            {erro && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {erro}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {resultado ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-900 min-h-[44px]"
            >
              Fechar
            </button>
          ) : (
            <button
              type="button"
              onClick={enviar}
              disabled={enviando || selecionados.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
            >
              {enviando ? 'Enviando…' : `Enviar para ${selecionados.length}`}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
