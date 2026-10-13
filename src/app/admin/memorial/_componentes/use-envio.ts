'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type Recado = { tom: 'sucesso' | 'erro'; texto: string } | null

/**
 * Envio JSON para a API do Memorial com o tratamento que todo formulário do painel
 * repete: estado de carregamento, erros por campo (VALIDATION_ERROR) e recado geral.
 * Devolve o `data` do envelope em caso de sucesso, ou `null`.
 */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [recado, setRecado] = useState<Recado>(null)

  async function enviar<T = { id: string }>(
    url: string,
    metodo: 'POST' | 'PUT' | 'DELETE',
    corpo?: unknown,
    sucesso?: string,
  ): Promise<T | null> {
    setEnviando(true)
    setErros({})
    setRecado(null)
    try {
      const res = await fetch(url, {
        method: metodo,
        headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.fieldErrors) setErros(json.fieldErrors)
        setRecado({ tom: 'erro', texto: json.message || 'Não foi possível salvar. Tente de novo.' })
        return null
      }
      if (sucesso) setRecado({ tom: 'sucesso', texto: sucesso })
      return json.data as T
    } catch {
      setRecado({ tom: 'erro', texto: 'Sem conexão com o servidor. Verifique a internet e tente de novo.' })
      return null
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, erros, recado, enviar }
}

/**
 * Salvar de formulário de cadastro: cria (POST na coleção e abre a página de edição)
 * ou atualiza (PUT no registro e recarrega os dados da página).
 */
export function useSalvar(colecao: string, id: string | undefined, paginaEdicao: string) {
  const router = useRouter()
  const envio = useEnvio()

  async function salvar(corpo: unknown) {
    const data = await envio.enviar(
      id ? `${colecao}/${id}` : colecao,
      id ? 'PUT' : 'POST',
      corpo,
      id ? 'Alterações salvas.' : undefined,
    )
    if (!data) return
    if (id) router.refresh()
    else router.push(`${paginaEdicao}/${data.id}`)
  }

  return { ...envio, salvar }
}

/** Estado de formulário com um setter por campo. */
export function useCampos<T extends object>(inicial: T) {
  const [valores, setValores] = useState(inicial)
  function definir<K extends keyof T>(campo: K, valor: T[K]) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
  }
  /** Liga um campo de texto a um <Input>/<Textarea>. */
  function texto<K extends keyof T>(campo: K) {
    return {
      value: (valores[campo] as string | null) ?? '',
      onChange: (e: { target: { value: string } }) => definir(campo, e.target.value as T[K]),
    }
  }
  return { valores, definir, texto }
}
