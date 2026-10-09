import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { AUDIT_ACTIONS } from '@/lib/audit'

// O mock global de prisma (src/__tests__/setup.ts) não tem os modelos de questionário;
// os testes desta pasta penduram os dois no mesmo objeto.
export const db = {
  questionario: {
    findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(),
    create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  },
  questionarioResposta: {
    findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(),
  },
}
Object.assign(prisma, db)

// Idem para as ações de auditoria, que o mock global lista só em parte.
for (const acao of ['CRIADO', 'ATUALIZADO', 'PUBLICADO', 'EXCLUIDO', 'RESPOSTA_ENVIADA']) {
  Object.assign(AUDIT_ACTIONS, { [`QUESTIONARIO_${acao}`]: `QUESTIONARIO_${acao}` })
}

export function logarComo(role: string | null) {
  vi.mocked(auth).mockResolvedValue((role ? { user: { id: 'u1', role } } : null) as never)
}

export function req(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

export const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })

export const camposV1 = [
  { nome: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
  { nome: 'turno', label: 'Turno', tipo: 'select', opcoes: ['Manhã', 'Tarde'] },
]

export const corpoValido = {
  slug: 'pesquisa-visita',
  titulo: 'Pesquisa de visita',
  finalidade: 'memorial-pesquisa-visitante',
  campos: camposV1,
}

export const questionarioPublicado = {
  id: 'q1',
  slug: 'pesquisa-visita',
  status: 'PUBLICADO',
  campos: camposV1,
  versao: 2,
  exigeLogin: false,
  mensagemSucesso: 'Obrigado!',
}
