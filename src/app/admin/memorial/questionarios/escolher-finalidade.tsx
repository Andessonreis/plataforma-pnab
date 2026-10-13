'use client'

import { useState } from 'react'
import { CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { FINALIDADES, FINALIDADE_OUTRA, codigoFinalidade } from './finalidades'

interface Props {
  valor: string
  erro?: string
  onChange: (valor: string) => void
}

const opcao =
  'flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-tinta-900/15 bg-white p-3 hover:bg-papel-50 ' +
  'has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50 has-[:checked]:ring-1 has-[:checked]:ring-accent-500 ' +
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500'

/** "Para que serve": usos conhecidos em palavras da equipe, e um campo livre para qualquer outro. */
export function EscolherFinalidade({ valor, erro, onChange }: Props) {
  const conhecida = FINALIDADES.some((f) => f.valor === valor)
  const [outra, setOutra] = useState(!conhecida && valor !== '')
  const [textoOutra, setTextoOutra] = useState(conhecida ? '' : valor.replace(/-/g, ' '))
  const marcada = outra ? FINALIDADE_OUTRA : valor

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-tinta-900">
        Para que serve <span className="font-normal text-tinta-600">(obrigatório)</span>
      </legend>
      <div className="grid gap-2">
        {FINALIDADES.map((f) => (
          <label key={f.valor} className={opcao}>
            <input type="radio" name="finalidade" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" checked={marcada === f.valor}
              onChange={() => { setOutra(false); onChange(f.valor) }} />
            <span>
              <span className="block text-sm font-semibold text-tinta-900">{f.rotulo}</span>
              <span className="mt-0.5 block text-xs leading-snug text-tinta-600">{f.explicacao}</span>
            </span>
          </label>
        ))}
        <label className={opcao}>
          <input type="radio" name="finalidade" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" checked={marcada === FINALIDADE_OUTRA}
            onChange={() => { setOutra(true); onChange(codigoFinalidade(textoOutra)) }} />
          <span>
            <span className="block text-sm font-semibold text-tinta-900">Outro uso</span>
            <span className="mt-0.5 block text-xs leading-snug text-tinta-600">Inscrição em oficina, enquete, cadastro</span>
          </span>
        </label>
      </div>
      {outra && (
        <CampoTexto
          className="mt-3"
          rotulo="Descreva o uso em poucas palavras"
          placeholder="Ex.: inscrição na oficina de fotografia"
          value={textoOutra}
          onChange={(e) => { setTextoOutra(e.target.value); onChange(codigoFinalidade(e.target.value)) }}
        />
      )}
      {erro && <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">{erro}</p>}
    </fieldset>
  )
}
