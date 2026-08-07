'use client'

import { useEffect, useRef } from 'react'

export type ErrosContato = Partial<
  Record<'nomeContato' | 'emailContato' | 'assunto' | 'mensagem', string>
>

const ORDEM_CAMPOS: { campo: keyof ErrosContato; rotulo: string }[] = [
  { campo: 'nomeContato', rotulo: 'Nome completo' },
  { campo: 'emailContato', rotulo: 'E-mail' },
  { campo: 'assunto', rotulo: 'Assunto' },
  { campo: 'mensagem', rotulo: 'Mensagem' },
]

function comportamentoDeRolagem(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

/**
 * Resumo dos campos inválidos após uma tentativa de envio.
 *
 * `role="alert"` já avisa quem usa leitor de tela, mas não move quem navega
 * por teclado até o problema — por isso o foco programático, no mesmo padrão
 * já usado em `CadastroForm`.
 */
export function ResumoErros({ erros }: { erros: ErrosContato }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (Object.values(erros).some(Boolean)) {
      ref.current?.focus()
      ref.current?.scrollIntoView({ block: 'center', behavior: comportamentoDeRolagem() })
    }
  }, [erros])

  const mensagens = ORDEM_CAMPOS.filter(({ campo }) => erros[campo])
  if (mensagens.length === 0) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      <p className="font-semibold">Corrija os campos abaixo antes de enviar:</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        {mensagens.map(({ campo, rotulo }) => (
          <li key={campo}>
            {rotulo}: {erros[campo]}
          </li>
        ))}
      </ul>
    </div>
  )
}
