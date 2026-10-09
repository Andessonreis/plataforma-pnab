'use client'

import { useRef, useState } from 'react'
import type { PastaUploadMemorial } from '@/lib/memorial/midia'
import { IMAGEM_MIMES } from '@/lib/upload/imagem'
import { enviarImagem, problemaDoArquivo } from './acervo-enviar-imagem'
import { botaoNeutro } from './classes'

interface Props {
  rotulo: string
  pasta: PastaUploadMemorial
  onEnviada: (url: string) => void
  className?: string
}

/** Botão que escolhe uma imagem, sobe com progresso e devolve o endereço gravado. */
export function AcervoTrocaImagem({ rotulo, pasta, onEnviada, className = '' }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [progresso, setProgresso] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function escolher(file: File | undefined) {
    if (!file) return
    const problema = problemaDoArquivo(file)
    if (problema) return setErro(problema)
    setErro(null)
    setProgresso(0)
    const r = await enviarImagem(file, pasta, setProgresso)
    setProgresso(null)
    if ('url' in r) onEnviada(r.url)
    else setErro(r.erro)
  }

  return (
    <div className={className}>
      <input
        ref={entrada}
        type="file"
        accept={IMAGEM_MIMES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          escolher(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button type="button" className={botaoNeutro} disabled={progresso !== null} onClick={() => entrada.current?.click()}>
        {progresso !== null ? `Enviando ${progresso}%` : rotulo}
      </button>
      {erro && (
        <p role="alert" className="mt-1 text-sm font-semibold text-brand-800">
          {erro}
        </p>
      )}
    </div>
  )
}
