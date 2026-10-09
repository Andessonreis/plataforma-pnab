'use client'

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { campo, rotuloCampo } from './classes'

interface Moldura {
  rotulo: string
  /** Exemplo ou explicação curta, abaixo do campo. */
  dica?: string
  erro?: string
}

/** Rótulo, dica e erro ligados ao campo por id, para o leitor de tela anunciar tudo junto. */
function Envoltorio({ rotulo, dica, erro, id, children }: Moldura & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={rotuloCampo}>
        {rotulo}
      </label>
      {children}
      {dica && !erro && (
        <p id={`${id}-dica`} className="mt-1 text-xs text-tinta-600">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-xs font-semibold text-brand-800">
          {erro}
        </p>
      )}
    </div>
  )
}

function descricao(id: string, { dica, erro }: Moldura) {
  return erro ? `${id}-erro` : dica ? `${id}-dica` : undefined
}

const comErro = (erro?: string) => (erro ? ' border-brand-600' : '')

export function CampoTexto({ rotulo, dica, erro, className = '', ...props }: Moldura & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Envoltorio rotulo={rotulo} dica={dica} erro={erro} id={id}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, { rotulo, dica, erro })}
        className={`${campo}${comErro(erro)} ${className}`}
        {...props}
      />
    </Envoltorio>
  )
}

export function CampoArea({ rotulo, dica, erro, className = '', ...props }: Moldura & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Envoltorio rotulo={rotulo} dica={dica} erro={erro} id={id}>
      <textarea
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, { rotulo, dica, erro })}
        className={`${campo}${comErro(erro)} py-2 leading-relaxed ${className}`}
        {...props}
      />
    </Envoltorio>
  )
}

export function CampoSelecao({
  rotulo,
  dica,
  erro,
  opcoes,
  className = '',
  ...props
}: Moldura & SelectHTMLAttributes<HTMLSelectElement> & { opcoes: { valor: string; rotulo: string }[] }) {
  const id = useId()
  return (
    <Envoltorio rotulo={rotulo} dica={dica} erro={erro} id={id}>
      <select id={id} aria-describedby={descricao(id, { rotulo, dica, erro })} className={`${campo}${comErro(erro)} ${className}`} {...props}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </Envoltorio>
  )
}
