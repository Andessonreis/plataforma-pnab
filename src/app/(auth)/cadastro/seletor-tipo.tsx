'use client'

import { ROTULOS_TIPO, type TipoProponente } from './tipos'

interface SeletorTipoProps {
  valor: TipoProponente
  aoEscolher: (tipo: TipoProponente) => void
}

/**
 * Escolha da natureza do proponente.
 *
 * São botões de rádio de verdade, e não `<button aria-pressed>`: escolher um
 * entre quatro é exatamente o que o rádio descreve, e com ele o grupo ganha
 * navegação por setas e é anunciado como "1 de 4" sem nenhum ARIA à mão.
 *
 * O selecionado tem anel de cor E marca de seleção — depender só do tom de
 * fundo deixaria a escolha invisível para quem não distingue as duas cores.
 */
export function SeletorTipo({ valor, aoEscolher }: SeletorTipoProps) {
  const opcoes = Object.entries(ROTULOS_TIPO) as [TipoProponente, string][]

  return (
    <fieldset data-tour="cadastro-tipo-proponente">
      <legend className="mb-2 block font-medium text-tinta-800">Tipo de proponente</legend>
      <div className="grid grid-cols-2 gap-2.5">
        {opcoes.map(([tipo, rotulo]) => {
          const selecionado = valor === tipo
          return (
            <label
              key={tipo}
              className={[
                'flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3',
                'text-sm transition-colors focus-within:outline focus-within:outline-2',
                'focus-within:outline-offset-2 focus-within:outline-brand-600',
                selecionado
                  ? 'border-brand-600 bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-600'
                  : 'border-tinta-900/15 text-tinta-700 hover:border-tinta-900/30 hover:bg-papel-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="tipo-proponente"
                value={tipo}
                checked={selecionado}
                onChange={() => aoEscolher(tipo)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selecionado ? 'border-[5px] border-brand-600' : 'border-tinta-900/30',
                ].join(' ')}
              />
              {rotulo}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
