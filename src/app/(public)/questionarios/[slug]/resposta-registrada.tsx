'use client'

import { useEffect, useRef } from 'react'
import { IconCheck } from '@/components/ui/icons'

interface RespostaRegistradaProps {
  protocolo: string
  mensagem: string | null
  aoResponderDeNovo: () => void
}

/**
 * Comprovante do envio. O protocolo vem grande e em fonte de largura fixa
 * porque é anotado à mão ou ditado ao telefone; o título recebe foco para o
 * leitor de tela anunciar que o envio deu certo.
 */
export function RespostaRegistrada({ protocolo, mensagem, aoResponderDeNovo }: RespostaRegistradaProps) {
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <div className="border-2 border-tinta-900 bg-papel-100/70 px-5 py-8 text-center sm:p-8">
      <IconCheck className="mx-auto h-10 w-10 text-oliva-700" aria-hidden="true" />

      <h3
        ref={titulo}
        tabIndex={-1}
        className="mt-4 titulo text-xl leading-snug tracking-wide text-tinta-900 focus:outline-none"
      >
        Respostas enviadas
      </h3>

      <p className="mt-6 text-sm font-semibold text-tinta-600">Número de protocolo</p>
      <p className="mt-1 break-all font-mono text-2xl font-bold tracking-wider text-brand-700 sm:text-3xl">
        {protocolo}
      </p>

      <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-sm leading-relaxed text-tinta-600">
        {mensagem || 'Obrigado por responder. Guarde o protocolo caso precise falar com a Secretaria sobre este envio.'}
      </p>

      <button
        type="button"
        onClick={aoResponderDeNovo}
        className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center border-2 border-tinta-900 px-6 text-sm font-bold text-tinta-900 transition-colors hover:bg-tinta-900 hover:text-papel-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 sm:w-auto"
      >
        Enviar outra resposta
      </button>
    </div>
  )
}
