import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { uploadFile } from '@/lib/storage'
import { validateMagicBytes } from '@/lib/upload/validate'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockUpload = vi.mocked(uploadFile)
const mockValidate = vi.mocked(validateMagicBytes)

function makeFormReq(form: FormData, id = 'insc-1') {
  return new NextRequest(`http://localhost:3000/api/proponente/inscricoes/${id}/recurso/anexos`, {
    method: 'POST',
    body: form,
  })
}

function params(id = 'insc-1') {
  return { params: Promise.resolve({ id }) }
}

function makePdfFile(name = 'evidencia.pdf', size = 100) {
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' })
}

describe('POST /api/proponente/inscricoes/[id]/recurso/anexos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidate.mockReturnValue(true)
    mockUpload.mockResolvedValue('https://storage.example.com/evidencia.pdf')
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(401)
  })

  it('role diferente de PROPONENTE → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(401)
  })

  it('inscrição não encontrada → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue(null)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(404)
  })

  it('outro proponente → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-A', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'user-B', status: 'INABILITADA',
    } as never)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(403)
  })

  it('status não permite recurso (RASCUNHO) → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'RASCUNHO',
    } as never)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(403)
  })

  it('sem campo file → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'INABILITADA',
    } as never)
    const form = new FormData()
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(400)
  })

  it('mime não permitido (XLSX) → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'INABILITADA',
    } as never)
    const form = new FormData()
    const xlsx = new File([new Uint8Array(10)], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    form.append('file', xlsx)
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(400)
  })

  it('arquivo > 10MB → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'INABILITADA',
    } as never)
    const form = new FormData()
    form.append('file', makePdfFile('grande.pdf', 11 * 1024 * 1024))
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(400)
  })

  it('magic bytes inválidos → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'INABILITADA',
    } as never)
    mockValidate.mockReturnValue(false)
    const form = new FormData()
    form.append('file', makePdfFile())
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('não corresponde ao tipo declarado')
  })

  it('PDF válido, status INABILITADA → 200 com URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
    mockPrisma.inscricao.findUnique.mockResolvedValue({
      id: 'insc-1', proponenteId: 'u1', status: 'INABILITADA',
    } as never)
    const form = new FormData()
    form.append('file', makePdfFile('evidencia.pdf'))
    const res = await POST(makeFormReq(form), params())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://storage.example.com/evidencia.pdf')
    expect(mockUpload).toHaveBeenCalledOnce()
    // storagePath com prefixo recursos/
    const callArgs = mockUpload.mock.calls[0]
    expect(callArgs[0]).toBe('propostas')
    expect(callArgs[1]).toContain('recursos/insc-1/')
  })

  it('cada status de recurso válido permite upload', async () => {
    const statusValidos = ['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE']
    for (const status of statusValidos) {
      vi.clearAllMocks()
      mockValidate.mockReturnValue(true)
      mockUpload.mockResolvedValue(`https://storage.example.com/${status}.pdf`)
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)
      mockPrisma.inscricao.findUnique.mockResolvedValue({
        id: 'insc-1', proponenteId: 'u1', status,
      } as never)
      const form = new FormData()
      form.append('file', makePdfFile())
      const res = await POST(makeFormReq(form), params())
      expect(res.status, `status ${status}`).toBe(200)
    }
  })
})
