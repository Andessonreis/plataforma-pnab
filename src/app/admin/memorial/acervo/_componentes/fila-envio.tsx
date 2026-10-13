'use client'

import { useEffect, useMemo } from 'react'
import { IconCheckSimple, IconClose } from '@/components/ui'

export interface ArquivoNaFila {
  chave: string
  file: File
  titulo: string
  /** Percentual já enviado; definido enquanto a foto sobe. */
  progresso?: number
  /** Endereço depois de enviado ao armazenamento. */
  url?: string
  erro?: string
}

interface Props {
  fila: ArquivoNaFila[]
  desabilitado: boolean
  onChange: (fila: ArquivoNaFila[]) => void
}

/** Fotos escolhidas como miniaturas, com título editável e a barra de envio de cada uma. */
export function FilaEnvio({ fila, desabilitado, onChange }: Props) {
  const arquivos = useMemo(() => fila.map((f) => f.file), [fila])
  const previas = useMemo(() => new Map(arquivos.map((f) => [f, URL.createObjectURL(f)])), [arquivos])
  useEffect(() => () => previas.forEach((u) => URL.revokeObjectURL(u)), [previas])

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {fila.map((f) => (
        <li key={f.chave} className="overflow-hidden rounded-lg border border-tinta-900/10 bg-white">
          <div className="relative aspect-square bg-papel-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previas.get(f.file)} alt={`Prévia de ${f.file.name}`} width={240} height={240} className="h-full w-full object-cover" />
            {!f.url && (
              <button
                type="button"
                disabled={desabilitado}
                onClick={() => onChange(fila.filter((x) => x.chave !== f.chave))}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-tinta-800 shadow-sm hover:text-brand-700 disabled:opacity-50"
              >
                <IconClose className="h-5 w-5" />
                <span className="sr-only">Tirar {f.file.name} da lista</span>
              </button>
            )}
            <Situacao f={f} />
          </div>
          <label className="sr-only" htmlFor={`titulo-${f.chave}`}>
            Título da foto {f.file.name}
          </label>
          <input
            id={`titulo-${f.chave}`}
            value={f.titulo}
            disabled={desabilitado || Boolean(f.url)}
            onChange={(e) => onChange(fila.map((x) => (x.chave === f.chave ? { ...x, titulo: e.target.value } : x)))}
            className="min-h-[44px] w-full border-0 border-t border-tinta-900/10 px-2.5 text-sm text-tinta-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500 disabled:bg-papel-50"
          />
        </li>
      ))}
    </ul>
  )
}

/** Faixa sobre a prévia: aguardando, barra de progresso, enviada ou o erro. */
function Situacao({ f }: { f: ArquivoNaFila }) {
  const base = 'absolute inset-x-0 bottom-0 px-2 py-1 text-xs font-semibold'
  if (f.erro) return <p role="alert" className={`${base} bg-brand-700 text-white`}>{f.erro}</p>
  if (f.url)
    return (
      <p className={`${base} flex items-center gap-1 bg-oliva-700 text-white`}>
        <IconCheckSimple className="h-3.5 w-3.5" /> Enviada
      </p>
    )
  if (f.progresso === undefined) return <p className={`${base} bg-white/95 text-tinta-700`}>Aguardando</p>
  return (
    <div className={`${base} bg-white/95 text-tinta-800`}>
      <span aria-live="polite">Enviando {f.progresso}%</span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-tinta-900/10">
        <span className="block h-full bg-brand-600 transition-[width]" style={{ width: `${f.progresso}%` }} />
      </span>
    </div>
  )
}
