'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { IconCheck } from '@/components/ui'
import { formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'

export interface PedidoRegistrado {
  protocolo: string
  data: string
  horaInicio: string
  horaFim: string
  mensagem: string
}

/**
 * Comprovante do pedido. O aviso de que a visita ainda não está confirmada vem da
 * configuração do Memorial e fica acima do protocolo, porque é a informação que
 * mais gera engano.
 */
export function ProtocoloVisita({ pedido, contatoEmail }: { pedido: PedidoRegistrado; contatoEmail: string }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => titulo.current?.focus(), [])

  return (
    <div className="border-2 border-tinta-900 bg-white p-6 text-center sm:p-10">
      <IconCheck className="mx-auto h-10 w-10 text-oliva-700" aria-hidden="true" />
      <h2 ref={titulo} tabIndex={-1} className="titulo mt-4 text-2xl text-tinta-900 focus:outline-none sm:text-3xl">
        Pedido enviado
      </h2>

      <p className="mx-auto mt-5 max-w-md border-2 border-amber-600/40 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
        {pedido.mensagem}
      </p>

      <p className="mt-8 text-sm text-tinta-600">Número do protocolo</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-tinta-900">{pedido.protocolo}</p>
      <p className="mt-4 text-base text-tinta-800">
        {formatarDiaPorExtenso(pedido.data)}, das {pedido.horaInicio} às {pedido.horaFim}
      </p>

      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-tinta-700">
        Uma cópia do pedido segue para o e-mail informado.
        {contatoEmail && <> Se precisar mudar algo, escreva para {contatoEmail} citando o protocolo.</>}
      </p>

      <Link
        href="/memorial"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center border-2 border-tinta-900 px-6 text-sm font-semibold text-tinta-900 hover:bg-tinta-900 hover:text-papel-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700"
      >
        Voltar ao Memorial
      </Link>
    </div>
  )
}
