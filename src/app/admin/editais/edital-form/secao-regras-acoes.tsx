'use client'

import { Textarea } from '@/components/ui'
import { useEditalForm } from './edital-form-context'
import { TEMPLATE_REGRAS, TEMPLATE_ACOES } from './constants'

export function SecaoRegrasAcoes() {
  const { regrasElegibilidade, setRegrasElegibilidade, acoesAfirmativas, setAcoesAfirmativas } = useEditalForm()

  return (
    <div className="space-y-5 sm:space-y-6">
      <Textarea
        label="Regras de Elegibilidade"
        rows={5}
        value={regrasElegibilidade}
        onChange={(e) => setRegrasElegibilidade(e.target.value)}
        placeholder="Liste os requisitos para participação neste edital (um por linha)"
        headerAction={
          <button
            type="button"
            onClick={() => setRegrasElegibilidade(TEMPLATE_REGRAS)}
            className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline shrink-0"
          >
            Usar modelo padrão
          </button>
        }
      />

      <Textarea
        label="Ações Afirmativas"
        rows={5}
        value={acoesAfirmativas}
        onChange={(e) => setAcoesAfirmativas(e.target.value)}
        placeholder="Liste as ações afirmativas previstas neste edital (uma por linha)"
        headerAction={
          <button
            type="button"
            onClick={() => setAcoesAfirmativas(TEMPLATE_ACOES)}
            className="text-xs text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline shrink-0"
          >
            Usar modelo padrão
          </button>
        }
      />
    </div>
  )
}
