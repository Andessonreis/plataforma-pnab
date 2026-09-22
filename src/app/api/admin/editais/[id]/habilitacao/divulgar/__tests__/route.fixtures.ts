import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { temAcessoEdital } from '@/lib/edital-acesso'
import { divulgarResultadoHabilitacao } from '@/lib/services/divulgacao-habilitacao.service'

export const mockAuth = vi.mocked(auth)
export const mockLogAudit = vi.mocked(logAudit)
export const mockTemAcesso = vi.mocked(temAcessoEdital)
export const mockDivulgar = vi.mocked(divulgarResultadoHabilitacao)

export const resultado = {
  divulgadas: 2,
  habilitadas: 1,
  inabilitadas: 1,
  emails: { enfileirados: 2, falhas: 0 },
}

export const params = { params: Promise.resolve({ id: 'ed-1' }) }

export function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/admin/editais/ed-1/habilitacao/divulgar', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export function logarComo(role: string) {
  mockAuth.mockResolvedValue({ user: { id: 'u1', role } } as never)
}

/**
 * Serviço devolvendo o resultado e o usuário na equipe do edital. O arquivo de
 * teste que chama isto precisa mockar `@/lib/edital-acesso` e o serviço de
 * divulgação.
 */
export function prepararCenarioPadrao() {
  vi.resetAllMocks()
  mockLogAudit.mockResolvedValue(undefined)
  mockDivulgar.mockResolvedValue(resultado)
  mockTemAcesso.mockResolvedValue(true)
}
