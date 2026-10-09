'use client'

import type { ReactNode } from 'react'
import { idDoCampo } from '@/components/formulario-dinamico/campo-com-erro'

interface Opcao {
  valor: string
  rotulo: string
  detalhe?: string
}

interface OpcoesRadioProps {
  nome: string
  legenda: string
  opcoes: readonly Opcao[]
  valor: string
  aoMudar: (valor: string) => void
  erro?: string
  dica?: string
  obrigatorio?: boolean
  /** Conteúdo extra logo abaixo das opções (ex.: idades da faixa personalizada). */
  children?: ReactNode
}

/**
 * Escolha única com botões de opção nativos, em cartões de no mínimo 48px. O id do
 * fieldset é o mesmo que o resumo de erros usa como âncora.
 */
export function OpcoesRadio({ nome, legenda, opcoes, valor, aoMudar, erro, dica, obrigatorio, children }: OpcoesRadioProps) {
  const id = idDoCampo(nome)
  const descricao = [erro && `${id}-erro`, dica && `${id}-dica`].filter(Boolean).join(' ') || undefined

  return (
    <fieldset id={id} aria-describedby={descricao} className="scroll-mt-24">
      <legend className="mb-1.5 text-sm font-medium text-slate-700">
        {legenda}
        {obrigatorio && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </legend>
      {dica && (
        <p id={`${id}-dica`} className="mb-2 text-sm text-slate-600">
          {dica}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={[
              'flex min-h-[48px] cursor-pointer items-center gap-3 border-2 px-3 py-2 text-sm text-tinta-900',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-turquesa-700',
              o.valor === valor ? 'border-turquesa-800 bg-turquesa-50' : erro ? 'border-red-600' : 'border-tinta-900/30 hover:border-tinta-900',
            ].join(' ')}
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={o.valor === valor}
              onChange={() => aoMudar(o.valor)}
              className="h-5 w-5 shrink-0 accent-turquesa-800"
            />
            <span>
              <span className="font-semibold">{o.rotulo}</span>
              {o.detalhe && <span className="block text-tinta-700">{o.detalhe}</span>}
            </span>
          </label>
        ))}
      </div>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-red-700">
          {erro}
        </p>
      )}
    </fieldset>
  )
}
