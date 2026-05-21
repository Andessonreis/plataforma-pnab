import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { auth } from '@server/lib/auth'
import { uploadFile } from '@/lib/storage'
import { validateMagicBytes } from '@/lib/upload/validate'

const mockAuth = vi.mocked(auth)
const mockUploadFile = vi.mocked(uploadFile)
const mockValidateMagicBytes = vi.mocked(validateMagicBytes)

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function makeFile(opts: {
  name?: string
  type?: string
  bytes?: Uint8Array
  size?: number
}) {
  const bytes = opts.bytes ?? PNG_BYTES
  // Permite forjar tamanho maior que os bytes reais (pra testar limite)
  const blob = opts.size
    ? new Blob([new Uint8Array(opts.size)], { type: opts.type ?? 'image/png' })
    : new Blob([bytes], { type: opts.type ?? 'image/png' })
  return new File([blob], opts.name ?? 'foto.png', { type: opts.type ?? 'image/png' })
}

function makeRequest(formData: FormData) {
  return new NextRequest('http://localhost:3000/api/admin/upload-imagem', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/admin/upload-imagem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // setup.ts já faz uploadFile retornar uma URL — re-aplicamos para clareza
    mockUploadFile.mockResolvedValue('https://storage.example.com/editais/noticias/abc.png')
    mockValidateMagicBytes.mockReturnValue(true)
  })

  it('sem sessão → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(401)
  })

  it('sessão sem role ADMIN → 401', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PROPONENTE' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(401)
  })

  it('sem campo file → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/file/i)
  })

  it('pasta inválida → 400 (impede path traversal via parâmetro)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))
    fd.append('pasta', '../../etc')

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/pasta/i)
  })

  it('MIME não permitido (PDF) → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({ type: 'application/pdf', name: 'doc.pdf' }))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/JPG, PNG, WEBP/i)
  })

  it('SVG (potencial XSS) → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({ type: 'image/svg+xml', name: 'evil.svg' }))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
  })

  it('tamanho acima de 5 MB → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({ size: 6 * 1024 * 1024 }))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/5 MB/i)
  })

  it('magic bytes inválidos (executável disfarçado) → 400, não chama uploadFile', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockValidateMagicBytes.mockReturnValueOnce(false)

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(400)
    expect(mockUploadFile).not.toHaveBeenCalled()
  })

  it('PNG válido → 201, retorna URL pública', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))
    fd.append('pasta', 'noticias')

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.url).toMatch(/^https?:/)
    expect(body.requestId).toBeDefined()
    expect(mockUploadFile).toHaveBeenCalledOnce()
  })

  it('storage path usa UUID gerado pelo servidor, ignorando file.name do cliente', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append(
      'file',
      makeFile({ name: '../../../etc/passwd.png', type: 'image/png' }),
    )
    fd.append('pasta', 'noticias')

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(201)

    // Argumentos: (bucket, path, buffer, contentType)
    const [bucket, storagePath] = mockUploadFile.mock.calls[0]
    expect(bucket).toBe('editais')
    expect(storagePath).not.toContain('passwd')
    expect(storagePath).not.toContain('..')
    expect(storagePath).not.toContain('/etc/')
    expect(storagePath).toMatch(/^noticias\/[0-9a-f-]+\.png$/i)
  })

  it('pasta default é "noticias" quando não informada', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(201)

    const [, storagePath] = mockUploadFile.mock.calls[0]
    expect(storagePath).toMatch(/^noticias\//)
  })

  it('responde com header X-Request-Id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('upload do storage falha → 500', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never)
    mockUploadFile.mockRejectedValueOnce(new Error('Supabase down'))

    const fd = new FormData()
    fd.append('file', makeFile({}))

    const res = await POST(makeRequest(fd))
    expect(res.status).toBe(500)
  })
})
