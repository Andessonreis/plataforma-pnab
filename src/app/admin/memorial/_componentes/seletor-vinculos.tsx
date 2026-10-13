'use client'

import { useId, useState } from 'react'

export interface OpcaoVinculo {
  id: string
  rotulo: string
}

interface SeletorVinculosProps {
  legenda: string
  opcoes: OpcaoVinculo[]
  selecionados: string[]
  onChange: (ids: string[]) => void
  /** Registro em edição, que não deve aparecer como opção de si mesmo. */
  excluirId?: string
}

/**
 * Marca as relações de um conteúdo com outros (pessoa ↔ evento ↔ foto ↔ exposição).
 * Lista com filtro por texto: com dezenas de fotos, rolar sem filtrar não funciona.
 */
export function SeletorVinculos({ legenda, opcoes, selecionados, onChange, excluirId }: SeletorVinculosProps) {
  const [filtro, setFiltro] = useState('')
  const idFiltro = useId()
  const termo = filtro.trim().toLowerCase()
  const visiveis = opcoes.filter(
    (o) => o.id !== excluirId && (!termo || o.rotulo.toLowerCase().includes(termo) || selecionados.includes(o.id)),
  )

  function alternar(id: string) {
    onChange(selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id])
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">
        {legenda} <span className="font-normal text-slate-500">({selecionados.length} marcados)</span>
      </legend>
      {opcoes.length === 0 ? (
        <p className="text-sm text-slate-500">Nada cadastrado ainda.</p>
      ) : (
        <>
          <label htmlFor={idFiltro} className="sr-only">
            Filtrar {legenda.toLowerCase()}
          </label>
          <input
            id={idFiltro}
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar pelo nome"
            className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {visiveis.map((o) => (
              <li key={o.id}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded px-2 text-sm text-slate-800 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(o.id)}
                    onChange={() => alternar(o.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
                  />
                  {o.rotulo}
                </label>
              </li>
            ))}
            {visiveis.length === 0 && <li className="px-2 py-3 text-sm text-slate-500">Nenhum nome com “{filtro}”.</li>}
          </ul>
        </>
      )}
    </fieldset>
  )
}
