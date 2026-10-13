'use client'

import type { FormatoSlide } from '@/lib/schemas/slide-destaque'

const OPCOES: { valor: FormatoSlide; titulo: string; texto: string }[] = [
  {
    valor: 'ARTE',
    titulo: 'Arte pronta',
    texto: 'Uma imagem já finalizada (com o texto dentro dela), exibida ao lado da lista de editais.',
  },
  {
    valor: 'PECA',
    titulo: 'Peça editorial',
    texto: 'Chamada, fotos e botões montados aqui, ocupando a faixa inteira — como a do Memorial.',
  },
]

/** Escolha do formato do slide, em linguagem de quem cuida da comunicação, não de sistema. */
export function SeletorFormato({ valor, onChange }: { valor: FormatoSlide; onChange: (f: FormatoSlide) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">Tipo de slide</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPCOES.map((opcao) => {
          const ativo = valor === opcao.valor
          return (
            <label
              key={opcao.valor}
              className={`flex min-h-[44px] cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500 ${
                ativo ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="formato"
                value={opcao.valor}
                checked={ativo}
                onChange={() => onChange(opcao.valor)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
              />
              <span>
                <span className="block font-semibold text-slate-900">{opcao.titulo}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{opcao.texto}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
