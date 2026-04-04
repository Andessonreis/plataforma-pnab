import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, PUT } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockLogAudit = vi.mocked(logAudit)

const validEditalBody = {
  titulo: 'Edital de Fomento Cultural 2025',
  ano: 2025,
  resumo: 'Resumo do edital',
  categorias: ['Música', 'Dança'],
  cronograma: [],
  camposFormulario: [],
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/editais', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makePutRequest(body: Record<string, unknown>, id?: string) {
  const url = id
    ? `http://localhost:3000/api/admin/editais?id=${id}`
    : 'http://localhost:3000/api/admin/editais'
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/editais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem sessão → 403', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makePostRequest(validEditalBody))

    expect(res.status).toBe(403)
  })

  it('título curto → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await POST(makePostRequest({ ...validEditalBody, titulo: 'AB' }))

    expect(res.status).toBe(400)
  })

  it('válido → 201, slug gerado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-de-fomento-cultural-2025-2025',
      status: 'RASCUNHO',
    } as never)

    const res = await POST(makePostRequest(validEditalBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBeDefined()
  })

  it('slug duplicado → slug com sufixo', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    // Simula slug já existente
    mockPrisma.edital.findUnique.mockResolvedValue({ id: 'existing' } as never)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-de-fomento-cultural-2025-2025-abc123',
      status: 'RASCUNHO',
    } as never)

    const res = await POST(makePostRequest(validEditalBody))

    expect(res.status).toBe(201)
    const body = await res.json()
    // Slug deve ter sufixo quando duplicado
    expect(body.slug).toContain('edital-de-fomento-cultural')
  })

  it('com criteriosAvaliacao no POST salva corretamente', async () => {
    const criterios = [
      { criterio: 'Critério 1', peso: 10, notaMax: 10, bloco: 'Bloco 1', descricao: 'Descrição do critério' },
      { criterio: 'Critério 2', peso: 5, notaMax: 5, bloco: 'Bloco 1' },
      { criterio: 'Critério 3', peso: 3, notaMax: 3, bloco: 'Bloco 2' },
    ]
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
      status: 'RASCUNHO',
    } as never)

    const res = await POST(makePostRequest({ ...validEditalBody, criteriosAvaliacao: criterios }))

    expect(res.status).toBe(201)
    expect(mockPrisma.edital.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        criteriosAvaliacao: criterios,
      }),
    })
  })

  it('sem criteriosAvaliacao salva null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
      status: 'RASCUNHO',
    } as never)

    await POST(makePostRequest(validEditalBody))

    expect(mockPrisma.edital.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        criteriosAvaliacao: null,
      }),
    })
  })

  it('com vagasContemplados salva corretamente (GAP 4)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
      status: 'RASCUNHO',
    } as never)

    await POST(makePostRequest({ ...validEditalBody, vagasContemplados: 5, vagasSuplentes: 3 }))

    expect(mockPrisma.edital.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vagasContemplados: 5,
        vagasSuplentes: 3,
      }),
    })
  })
})

describe('PUT /api/admin/editais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('sem id → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const res = await PUT(makePutRequest(validEditalBody))

    expect(res.status).toBe(400)
  })

  it('edital não encontrado → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)

    const res = await PUT(makePutRequest(validEditalBody, 'ed-999'))

    expect(res.status).toBe(404)
  })

  it('atualiza dados + slug', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: 'Titulo Antigo',
      slug: 'titulo-antigo-2025',
    } as never)
    mockPrisma.edital.findFirst.mockResolvedValue(null)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-de-fomento-cultural-2025-2025',
    } as never)

    const res = await PUT(makePutRequest(validEditalBody, 'ed-1'))

    expect(res.status).toBe(200)
    expect(mockPrisma.edital.update).toHaveBeenCalled()
  })

  it('com vagasSuplentes salva corretamente (GAP 4)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, vagasContemplados: 10, vagasSuplentes: 5 }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        vagasContemplados: 10,
        vagasSuplentes: 5,
      }),
    })
  })

  it('com criteriosAvaliacao customizados salva corretamente', async () => {
    const criteriosCustom = [
      { criterio: 'Critério A', peso: 10, notaMax: 10, bloco: 'Bloco 1' },
      { criterio: 'Critério B', peso: 5, notaMax: 5, descricao: 'Desc B', bloco: 'Bloco 2' },
    ]
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, criteriosAvaliacao: criteriosCustom }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        criteriosAvaliacao: criteriosCustom,
      }),
    })
  })

  it('criteriosAvaliacao null limpa critérios customizados', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, criteriosAvaliacao: null }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        criteriosAvaliacao: null,
      }),
    })
  })

  it('criteriosAvaliacao com critério inválido (sem nome) → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    const criteriosInvalidos = [
      { criterio: '', peso: 10, notaMax: 10 }, // criterio vazio
    ]

    const res = await PUT(makePutRequest({ ...validEditalBody, criteriosAvaliacao: criteriosInvalidos }, 'ed-1'))

    expect(res.status).toBe(400)
  })

  it('com tiposAnexo salva corretamente', async () => {
    const tiposAnexo = [
      { tipo: 'CERTIFICADO', label: 'Certificado PNCV', obrigatorio: true },
      { tipo: 'PLANO_TRABALHO', label: 'Plano de Trabalho', obrigatorio: false },
    ]
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, tiposAnexo }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        tiposAnexo,
      }),
    })
  })

  it('com notaMinima salva corretamente', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, notaMinima: 3.0 }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        notaMinima: 3.0,
      }),
    })
  })

  it('com desempate salva corretamente', async () => {
    const desempate = [
      { descricao: 'Maior nota no Bloco 1', tipo: 'bloco', ref: 'Bloco 1', direcao: 'desc' },
      { descricao: 'Maior nota no Bloco 2', tipo: 'bloco', ref: 'Bloco 2', direcao: 'desc' },
    ]
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, desempate }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        desempate,
      }),
    })
  })

  it('tiposAnexo null limpa tipos customizados', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)

    await PUT(makePutRequest({ ...validEditalBody, tiposAnexo: null, notaMinima: null, desempate: null }, 'ed-1'))

    expect(mockPrisma.edital.update).toHaveBeenCalledWith({
      where: { id: 'ed-1' },
      data: expect.objectContaining({
        tiposAnexo: null,
        notaMinima: null,
        desempate: null,
      }),
    })
  })

  it('audit log registrado em POST e PUT', async () => {
    // POST
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue(null)
    mockPrisma.edital.create.mockResolvedValue({
      id: 'new-id',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
      status: 'RASCUNHO',
    } as never)

    await POST(makePostRequest(validEditalBody))
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EDITAL_CRIADO' }),
    )

    // PUT
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockPrisma.edital.findUnique.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockPrisma.edital.update.mockResolvedValue({
      id: 'ed-1',
      titulo: validEditalBody.titulo,
      slug: 'edital-2025',
    } as never)
    mockLogAudit.mockResolvedValue(undefined)

    await PUT(makePutRequest(validEditalBody, 'ed-1'))
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EDITAL_ATUALIZADO' }),
    )
  })
})
