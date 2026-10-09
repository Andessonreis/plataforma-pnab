'use client'

import { useEffect, useState } from 'react'
import { useCampos, useSalvar } from '../_componentes/use-envio'

/**
 * Estado de um formulário de cadastro do Memorial que sabe se há alterações
 * não salvas: a referência é atualizada a cada gravação bem-sucedida.
 */
export function useAcervoEdicao<T extends object>(colecao: string, id: string | undefined, paginaEdicao: string, inicial: T) {
  const envio = useSalvar(colecao, id, paginaEdicao)
  const campos = useCampos(inicial)
  const [salvo, setSalvo] = useState(inicial)
  const { recado } = envio
  const { valores } = campos

  useEffect(() => {
    if (recado?.tom === 'sucesso') setSalvo(valores)
    // só a confirmação do servidor marca os valores como gravados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recado])

  const alteracoesPendentes = JSON.stringify(valores) !== JSON.stringify(salvo)
  return { ...envio, ...campos, alteracoesPendentes }
}
