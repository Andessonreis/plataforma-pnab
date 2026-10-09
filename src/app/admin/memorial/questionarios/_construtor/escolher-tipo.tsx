'use client'

import { useState } from 'react'
import type { CampoTipo } from '@/types/campo-formulario'
import { TIPOS_PERGUNTA, tipoDaPergunta } from './tipos-pergunta'

interface Props {
  onEscolher: (tipo: CampoTipo) => void
  /** Ao trocar o tipo de uma pergunta existente, o atual aparece marcado. */
  atual?: CampoTipo
  rotulo: string
}

/** Escolha do tipo de pergunta por ícone e nome, com um exemplo de uso em cada botão. */
export function EscolherTipo({ onEscolher, atual, rotulo }: Props) {
  const atualNormalizado = atual ? tipoDaPergunta(atual).tipo : undefined
  const [verTodos, setVerTodos] = useState(() => TIPOS_PERGUNTA.some((t) => t.avancado && t.tipo === atualNormalizado))
  const visiveis = TIPOS_PERGUNTA.filter((t) => verTodos || !t.avancado)

  return (
    <div role="group" aria-label={rotulo}>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visiveis.map(({ tipo, rotulo: nome, explicacao, Icone }) => {
          const marcado = tipo === atualNormalizado
          return (
            <li key={tipo}>
              <button
                type="button"
                aria-pressed={atual ? marcado : undefined}
                onClick={() => onEscolher(tipo)}
                className={`flex h-full min-h-[44px] w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                  marcado ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500' : 'border-tinta-900/15 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <Icone className={`mt-0.5 h-5 w-5 shrink-0 ${marcado ? 'text-accent-800' : 'text-brand-700'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-tinta-900">{nome}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-tinta-600">{explicacao}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {!verTodos && (
        <button type="button" onClick={() => setVerTodos(true)} className="mt-2 min-h-[44px] text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
          Mais tipos (valor em reais, tabela, bloco que se repete)
        </button>
      )}
    </div>
  )
}
