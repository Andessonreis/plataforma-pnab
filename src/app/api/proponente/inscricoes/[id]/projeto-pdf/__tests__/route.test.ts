import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateProjetoCompleto } from '@/lib/pdf/projeto-completo'

// Mock do gerador de PDF
vi.mock('@/lib/pdf/projeto-completo', () => ({
  generateProjetoCompleto: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
}))
vi.mock('@/lib/pdf/dossie-completo', () => ({
  mesclarAnexosNoPdf: vi.fn().mockResolvedValue(Buffer.from('fake-dossie')),
}))

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockGerar = vi.mocked(generateProjetoCompleto)

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/proponente/inscricoes/insc-1/projeto-pdf', {
    method: 'GET',
  })
}

function makeParams(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

const baseInscricao = {
  id: 'insc-1',
  numero: 'INS-001',
  proponenteId: 'user-1',
  editalId: 'edital-1',
  status: 'ENVIADA',
  categoria: 'Música',
  campos: { nome_projeto: 'Meu Projeto' },
  submittedAt: new Date('2025-01-15T10:00:00Z'),
  createdAt: new Date('2025-01-10T10:00:00Z'),
  proponente: {
    id: 'user-1',
    nome: 'Ana',
    cpfCnpj: '12345678901',
    email: 'ana@test.com',
    tipoProponente: 'PF',
  },
  edital: {
    titulo: 'Edital PNAB 2025',
    ano: 2025,
    camposFormulario: [
      { nome: 'nome_projeto', tipo: 'texto', label: 'Nome do Projeto' },
    ],
  },
  anexos: [
    { titulo: 'Documento RG', tipo: 'DOCUMENTO', valido: true },
  ],
}

describe('GET /api/proponente/inscricoes/[id]/projeto-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('inscrição inexistente → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('não é owner nem admin → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'other-user', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('status RASCUNHO → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'RASCUNHO' } as never)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(400)
  })

  it('dados válidos → 200 + Content-Type application/pdf', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('projeto-INS-001.pdf')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('inscrição contemplada sai como projeto contemplado; as demais, como projeto completo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)

    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'CONTEMPLADA' } as never)
    await GET(makeRequest(), makeParams())
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    await GET(makeRequest(), makeParams())

    expect(mockGerar.mock.calls.map(([dados]) => dados.versao)).toEqual(['contemplado', 'completo'])
  })

  it('dossiê completo de inscrição contemplada leva o nome de projeto contemplado no arquivo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    const req = new NextRequest('http://localhost:3000/api/proponente/inscricoes/insc-1/projeto-pdf?completo=1')

    mockPrisma.inscricao.findUnique.mockResolvedValue({ ...baseInscricao, status: 'CONTEMPLADA' } as never)
    const contemplada = await GET(req, makeParams())
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)
    const outra = await GET(req, makeParams())

    expect(contemplada.headers.get('Content-Disposition')).toContain('dossie-contemplado-INS-001.pdf')
    expect(outra.headers.get('Content-Disposition')).toContain('dossie-completo-INS-001.pdf')
  })

  it('admin pode baixar PDF de outro proponente → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(baseInscricao as never)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(200)
  })
})
