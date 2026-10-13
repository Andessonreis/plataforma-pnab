'use client'

import { useId, useState } from 'react'
import { IconClose, IconPlus } from '@/components/ui'
import type { OpcaoVinculo } from '../_componentes/seletor-vinculos'
import { campo, rotuloCampo } from './classes'

const SUGESTOES = 6

interface Props {
  rotulo: string
  opcoes: OpcaoVinculo[]
  selecionados: string[]
  onChange: (ids: string[]) => void
  /** Texto quando a lista de opções está vazia, dizendo onde cadastrar. */
  vazio: string
}

/**
 * O que já está ligado aparece como etiquetas removíveis; para ligar outro,
 * digita-se parte do nome e escolhe-se na lista que aparece.
 */
export function AcervoEscolhaVinculos({ rotulo, opcoes, selecionados, onChange, vazio }: Props) {
  const [termo, setTermo] = useState('')
  const id = useId()
  const nome = new Map(opcoes.map((o) => [o.id, o.rotulo]))
  const busca = termo.trim().toLowerCase()
  const sugestoes = opcoes
    .filter((o) => !selecionados.includes(o.id) && (!busca || o.rotulo.toLowerCase().includes(busca)))
    .slice(0, SUGESTOES)

  return (
    <fieldset>
      <legend className={rotuloCampo}>{rotulo}</legend>
      {selecionados.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {selecionados.map((sel) => (
            <li key={sel}>
              <button
                type="button"
                onClick={() => onChange(selecionados.filter((s) => s !== sel))}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-turquesa-100 pl-3 pr-2 text-sm font-semibold text-turquesa-900 hover:bg-turquesa-200 focus-visible:outline-2 focus-visible:outline-accent-500"
              >
                {nome.get(sel) ?? 'Registro removido'}
                <IconClose className="h-4 w-4" />
                <span className="sr-only">(tirar)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {opcoes.length === 0 ? (
        <p className="text-sm text-tinta-600">{vazio}</p>
      ) : (
        <details className="group">
          <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
            <IconPlus className="h-4 w-4" />
            Ligar {rotulo.toLowerCase()}
          </summary>
          <div className="mt-1 rounded-lg border border-tinta-900/10 bg-papel-50/60 p-2">
            <label htmlFor={id} className="sr-only">
              Procurar {rotulo.toLowerCase()} pelo nome
            </label>
            <input id={id} type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Digite parte do nome" className={campo} />
            <ul className="mt-1">
              {sugestoes.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onChange([...selecionados, o.id])}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 text-left text-sm text-tinta-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-accent-500"
                  >
                    <IconPlus className="h-4 w-4 shrink-0 text-brand-700" />
                    {o.rotulo}
                  </button>
                </li>
              ))}
              {sugestoes.length === 0 && <li className="px-2 py-3 text-sm text-tinta-600">Nada encontrado com esse nome.</li>}
            </ul>
          </div>
        </details>
      )}
    </fieldset>
  )
}
