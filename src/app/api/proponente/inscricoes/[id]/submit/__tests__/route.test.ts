import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enqueueEmail } from '@/lib/queue'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockEnqueueEmail = vi.mocked(enqueueEmail)
const mockLogAudit = vi.mocked(logAudit)

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/proponente/inscricoes/insc-1/submit', {
    method: 'POST',
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  proponenteId: 'user-1',
  editalId: 'edital-1',
  status: 'RASCUNHO',
  categoria: 'Música',
  campos: { nome_projeto: 'Meu Projeto' },
  edital: {
    id: 'edital-1',
    titulo: 'Edital PNAB 2025',
    status: 'INSCRICOES_ABERTAS',
    categorias: ['Música', 'Dança'],
    camposFormulario: [{ nome: 'nome_projeto', tipo: 'texto', obrigatorio: true, label: 'Nome do Projeto' }],
  },
  anexos: [{ id: 'a1', nome: 'doc.pdf' }],
  proponente: { email: 'ana@test.com', nome: 'Ana' },
  numero: 'INS-001',
}

describe('POST /api/proponente/inscricoes/[id]/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.inscricao.update.mockResolvedValue({ numero: 'INS-001', submittedAt: new Date() } as never)
    mockLogAudit.mockResolvedValue(undefined)
    mockEnqueueEmail.mockResolvedValue(undefined as never)
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('role !== PROPONENTE → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('inscrição de outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('status !== RASCUNHO → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'ENVIADA' } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('edital não INSCRICOES_ABERTAS → 403 (GAP 2)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      edital: { ...baseInscricao.edital, status: 'INSCRICOES_ENCERRADAS' },
    } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toContain('prazo')
  })

  it('sem categoria quando obrigatório → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      categoria: null,
    } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(400)
  })

  it('campo obrigatório faltando → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      campos: {},
    } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.camposFaltando).toContain('Nome do Projeto')
  })

  it('sem anexos → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      ...baseInscricao,
      anexos: [],
    } as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(400)
  })

  it('submissão válida → 200, status ENVIADA', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await POST(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    expect(mockPrisma.inscricao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'insc-1' },
        data: expect.objectContaining({ status: 'ENVIADA' }),
      }),
    )
  })

  it('email de confirmação enfileirado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await POST(makeRequest(), makeParams())

    expect(mockEnqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@test.com',
        template: 'comprovante_inscricao',
      }),
    )
  })

  it('audit log registrado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    await POST(makeRequest(), makeParams())

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'INSCRICAO_ENVIADA',
        entity: 'Inscricao',
        entityId: 'insc-1',
      }),
    )
  })
})
