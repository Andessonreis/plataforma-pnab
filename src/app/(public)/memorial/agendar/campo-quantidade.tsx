'use client'

import { IconMinus, IconPlus } from '@/components/ui'
import { idDoCampo } from '@/components/formulario-dinamico/campo-com-erro'
import { apenasDigitos, PROPS_NUMERICO } from './entrada-numerica'

interface CampoQuantidadeProps {
  valor: string
  max: number
  erro?: string
  aoMudar: (valor: string) => void
}

const BOTAO =
  'flex h-12 w-12 shrink-0 items-center justify-center border-2 border-tinta-900/50 text-tinta-900 hover:border-tinta-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700'

/**
 * Quantidade de pessoas com botões de menos e mais, que nunca saem de 1 até o teto
 * configurado. A digitação aceita só algarismos; acima do teto o aviso aparece ao
 * continuar, com a mesma mensagem que a API devolveria.
 */
export function CampoQuantidade({ valor, max, erro, aoMudar }: CampoQuantidadeProps) {
  const id = idDoCampo('quantidade')
  const numero = Number(valor) || 0
  const descricao = erro ? `${id}-erro` : `${id}-dica`
  const ajustar = (delta: number) => aoMudar(String(Math.min(max, Math.max(1, numero + delta))))

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        Quantidade de pessoas<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="flex items-stretch gap-2">
        <button type="button" className={BOTAO} onClick={() => ajustar(-1)} disabled={numero <= 1} aria-label="Uma pessoa a menos" aria-controls={id}>
          <IconMinus className="h-5 w-5" />
        </button>
        <input
          id={id}
          {...PROPS_NUMERICO}
          value={valor}
          onChange={(e) => aoMudar(apenasDigitos(e.target.value))}
          required
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao}
          className={`min-h-[48px] w-20 border-2 px-2 text-center text-base font-semibold tabular-nums text-tinta-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700 ${erro ? 'border-red-600' : 'border-tinta-900/50'}`}
        />
        <button type="button" className={BOTAO} onClick={() => ajustar(1)} disabled={numero >= max} aria-label="Uma pessoa a mais" aria-controls={id}>
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-red-700">
          {erro}
        </p>
      ) : (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-slate-600">
          De 1 a {max} pessoas, contando os responsáveis.
        </p>
      )}
    </div>
  )
}
