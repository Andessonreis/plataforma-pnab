'use client'

/** Identificação do ato: o que a página pública cita como fonte da mudança. */
export interface CamposRetificacao {
  numero: string
  publicadoEm: string
  resumo: string
  diarioOficialUrl: string
}

interface Props {
  valores: CamposRetificacao
  onChange: (campo: keyof CamposRetificacao, valor: string) => void
}

const CAMPO = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'
const ROTULO = 'block text-xs font-semibold text-slate-700'

/**
 * O cabeçalho do ato — número, data do Diário e o texto que vai na faixa.
 *
 * O resumo não é anotação interna: é exatamente a frase que o cidadão lê no
 * topo do edital. Por isso o campo pede a linguagem da Secretaria, e não um
 * código ou uma abreviação de uso do backoffice.
 */
export function RetificacaoCampos({ valores, onChange }: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={ROTULO}>
          Número no Diário Oficial
          <input
            value={valores.numero}
            onChange={(e) => onChange('numero', e.target.value)}
            placeholder="01"
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Data da publicação
          <input
            type="date"
            value={valores.publicadoEm}
            onChange={(e) => onChange('publicadoEm', e.target.value)}
            className={CAMPO}
          />
        </label>
      </div>

      <label className={ROTULO}>
        O que muda (texto que o cidadão lê na faixa)
        <textarea
          value={valores.resumo}
          onChange={(e) => onChange('resumo', e.target.value)}
          rows={2}
          placeholder="Prazo de inscrição prorrogado até 2 de setembro de 2026."
          className={`${CAMPO} resize-none`}
        />
      </label>

      <label className={ROTULO}>
        Link do Diário Oficial (opcional)
        <input
          value={valores.diarioOficialUrl}
          onChange={(e) => onChange('diarioOficialUrl', e.target.value)}
          placeholder="https://..."
          className={CAMPO}
        />
      </label>
    </>
  )
}
