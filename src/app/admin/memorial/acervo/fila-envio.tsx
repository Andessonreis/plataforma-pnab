'use client'

import { useEffect, useMemo } from 'react'

export interface ArquivoNaFila {
  chave: string
  file: File
  titulo: string
  /** Endereço depois de enviado ao armazenamento. */
  url?: string
  erro?: string
}

interface FilaEnvioProps {
  fila: ArquivoNaFila[]
  desabilitado: boolean
  onChange: (fila: ArquivoNaFila[]) => void
}

/** Miniaturas das fotos escolhidas, com título editável e situação de cada envio. */
export function FilaEnvio({ fila, desabilitado, onChange }: FilaEnvioProps) {
  const previas = useMemo(() => new Map(fila.map((f) => [f.chave, URL.createObjectURL(f.file)])), [fila])
  useEffect(() => () => previas.forEach((u) => URL.revokeObjectURL(u)), [previas])

  function atualizar(chave: string, titulo: string) {
    onChange(fila.map((f) => (f.chave === chave ? { ...f, titulo } : f)))
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {fila.map((f) => (
        <li key={f.chave} className="flex gap-3 rounded-lg border border-slate-200 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previas.get(f.chave)} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1 space-y-1">
            <label className="sr-only" htmlFor={`titulo-${f.chave}`}>
              Título da foto {f.file.name}
            </label>
            <input
              id={`titulo-${f.chave}`}
              value={f.titulo}
              disabled={desabilitado || Boolean(f.url)}
              onChange={(e) => atualizar(f.chave, e.target.value)}
              className="min-h-[44px] w-full rounded border border-slate-300 px-2 text-sm"
            />
            <p className={`text-xs ${f.erro ? 'text-red-700' : 'text-slate-500'}`} aria-live="polite">
              {f.erro ?? (f.url ? 'Enviada' : 'Aguardando envio')}
            </p>
            {!f.url && (
              <button
                type="button"
                disabled={desabilitado}
                onClick={() => onChange(fila.filter((x) => x.chave !== f.chave))}
                className="min-h-[44px] text-xs text-slate-600 underline underline-offset-4 hover:text-red-700"
              >
                Tirar da lista
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
