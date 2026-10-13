'use client'

import { useEffect, useRef } from 'react'
import type { CampoFormulario } from '@/types/campo-formulario'
import { idDoCampo } from './campo-com-erro'

interface ResumoErrosProps {
  campos: CampoFormulario[]
  erros: Record<string, string>
  /** Muda a cada tentativa de envio, para devolver o foco ao resumo mesmo com os mesmos erros. */
  tentativa: number
}

/**
 * Lista os problemas na ordem em que os campos aparecem, cada um com link para
 * o campo. Recebe foco a cada tentativa de envio: `role="alert"` avisa o leitor
 * de tela, mas só o foco leva quem navega por teclado até o problema.
 */
export function ResumoErros({ campos, erros, tentativa }: ResumoErrosProps) {
  const ref = useRef<HTMLDivElement>(null)
  const comErro = campos.filter((c) => erros[c.nome])

  useEffect(() => {
    if (tentativa === 0 || !ref.current) return
    ref.current.focus()
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' })
  }, [tentativa])

  if (comErro.length === 0) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      <p className="font-semibold">
        {comErro.length === 1 ? 'Falta corrigir 1 resposta:' : `Falta corrigir ${comErro.length} respostas:`}
      </p>
      <ul className="mt-1.5 space-y-1">
        {comErro.map((c) => (
          <li key={c.nome}>
            <a href={`#${idDoCampo(c.nome)}`} className="inline-flex min-h-[44px] items-center underline underline-offset-2 sm:min-h-0">
              {erros[c.nome]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
