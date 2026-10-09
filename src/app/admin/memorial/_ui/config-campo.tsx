import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { campo } from './classes'

interface Moldura {
  rotulo: string
  /** Frase curta sob o campo dizendo onde aquilo aparece ou como preencher. */
  dica?: ReactNode
  erro?: string
  className?: string
}

function Envoltorio({ id, rotulo, dica, erro, obrigatorio, className = '', children }: Moldura & { id: string; obrigatorio?: boolean; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-tinta-900">
        {rotulo}
        {obrigatorio && <span className="ml-1 font-normal text-tinta-600">(obrigatório)</span>}
      </label>
      {children}
      {dica && !erro && <p id={`${id}-dica`} className="mt-1.5 text-sm text-tinta-600">{dica}</p>}
      {erro && <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{erro}</p>}
    </div>
  )
}

function descricao(id: string, dica: unknown, erro?: string) {
  if (erro) return `${id}-erro`
  return dica ? `${id}-dica` : undefined
}

const comErro = (erro?: string) => (erro ? 'border-red-400 ' : '')

/** Campo de uma linha com rótulo em português comum, dica e erro ligados por aria-describedby. */
export function CampoTexto({ rotulo, dica, erro, className, required, ...input }: Moldura & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Envoltorio id={id} rotulo={rotulo} dica={dica} erro={erro} obrigatorio={required} className={className}>
      <input id={id} required={required} aria-invalid={!!erro} aria-describedby={descricao(id, dica, erro)} className={`${comErro(erro)}${campo}`} {...input} />
    </Envoltorio>
  )
}

export function CampoArea({ rotulo, dica, erro, className, required, ...area }: Moldura & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Envoltorio id={id} rotulo={rotulo} dica={dica} erro={erro} obrigatorio={required} className={className}>
      <textarea
        id={id}
        required={required}
        aria-invalid={!!erro}
        aria-describedby={descricao(id, dica, erro)}
        className={`${comErro(erro)}${campo} py-2.5 leading-relaxed`}
        {...area}
      />
    </Envoltorio>
  )
}

/** Caixa de marcar grande, fácil de acertar no celular, com explicação ao lado. */
export function CampoMarcar({ rotulo, dica, ...input }: { rotulo: string; dica?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg py-2">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 rounded border-tinta-900/30 text-brand-600 accent-brand-600" {...input} />
      <span>
        <span className="block text-sm font-semibold text-tinta-900">{rotulo}</span>
        {dica && <span className="mt-0.5 block text-sm text-tinta-600">{dica}</span>}
      </span>
    </label>
  )
}
