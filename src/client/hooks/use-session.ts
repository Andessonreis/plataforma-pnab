'use client'

import { useCallback, useEffect, useState } from 'react'
import { autenticacaoClient } from '@client/api/autenticacao.client'
import type { SessaoDTO } from '@shared/dtos/autenticacao.dto'

export type UseSessionResult = {
  sessao: SessaoDTO | null
  usuario: SessaoDTO['usuario'] | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

/**
 * Hook que expõe a sessão atual do usuário do lado cliente.
 *
 * Faz fetch em GET /api/v1/autenticacao/sessoes/sessao/atual no mount.
 * Não faz refetch automático — chame `refresh()` se precisar revalidar
 * (ex.: depois de uma ação que muda o perfil do usuário).
 */
export function useSession(): UseSessionResult {
  const [sessao, setSessao] = useState<SessaoDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSessao = useCallback(async () => {
    setLoading(true)
    try {
      const result = await autenticacaoClient.sessaoAtual()
      setSessao(result)
    } catch {
      setSessao(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSessao()
  }, [fetchSessao])

  const logout = useCallback(async () => {
    await autenticacaoClient.logout()
    setSessao(null)
  }, [])

  return {
    sessao,
    usuario: sessao?.usuario ?? null,
    loading,
    refresh: fetchSessao,
    logout,
  }
}
