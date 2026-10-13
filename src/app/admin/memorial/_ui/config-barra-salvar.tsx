'use client'

import { useEffect, useState } from 'react'
import { IconCheckSimple } from '@/components/ui'
import { botaoPrimario } from './classes'
import type { Recado } from '../_componentes/use-envio'
import { textoSalvo } from './config-salvo'

/**
 * Acompanha se o que está na tela já foi salvo. Compara com a última versão
 * gravada; a confirmação de sucesso do envio vira a nova referência.
 */
export function useEstadoSalvo(valores: unknown, recado: Recado) {
  const atual = JSON.stringify(valores)
  const [gravado, setGravado] = useState(atual)
  const [salvoEm, setSalvoEm] = useState<Date | null>(null)

  useEffect(() => {
    if (recado?.tom !== 'sucesso') return
    setGravado(atual)
    setSalvoEm(new Date())
    // Só a chegada de um recado novo marca o salvamento; digitar depois não.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recado])

  return { pendente: atual !== gravado, salvoEm }
}

interface Props {
  rotulo: string
  enviando: boolean
  pendente: boolean
  salvoEm: Date | null
  erro?: string
}

/** Botão de salvar da seção e, ao lado, se há mudança por salvar ou quando foi salvo. */
export function BarraSalvar({ rotulo, enviando, pendente, salvoEm, erro }: Props) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-2 border-t border-tinta-900/10 pt-4 sm:flex-row sm:items-center sm:gap-4">
      <button type="submit" disabled={enviando} className={`${botaoPrimario} w-full sm:w-auto`}>
        {enviando ? 'Salvando…' : rotulo}
      </button>
      <p role="status" className="text-sm">
        {erro ? (
          <span className="font-medium text-red-700">{erro}</span>
        ) : pendente ? (
          <span className="font-medium text-accent-900">Há alterações ainda não salvas</span>
        ) : salvoEm ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-oliva-800">
            <IconCheckSimple className="h-4 w-4" />
            {textoSalvo(salvoEm, agora)}
          </span>
        ) : (
          <span className="text-tinta-600">Nada alterado</span>
        )}
      </p>
    </div>
  )
}

/**
 * Barra de salvar já ligada ao estado do formulário. No celular fica presa ao pé
 * da tela: textos longos não podem esconder o botão lá no fim.
 */
export function RodapeSalvar({ valores, recado, enviando, rotulo, sobreCartao }: {
  valores: unknown
  recado: Recado
  enviando: boolean
  rotulo: string
  /** Dentro de um cartão branco, o fundo preso ao pé acompanha o cartão. */
  sobreCartao?: boolean
}) {
  const { pendente, salvoEm } = useEstadoSalvo(valores, recado)
  return (
    <div className={`sticky bottom-0 z-10 -mx-4 px-4 pb-4 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 ${sobreCartao ? 'bg-white' : 'bg-papel-50'}`}>
      <BarraSalvar rotulo={rotulo} enviando={enviando} pendente={pendente} salvoEm={salvoEm} erro={recado?.tom === 'erro' ? recado.texto : undefined} />
    </div>
  )
}
