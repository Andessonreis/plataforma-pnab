import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'

const servicoExposicao = vi.hoisted(() => ({
  listarAdmin: vi.fn(),
  criar: vi.fn(),
  listarPublicas: vi.fn(),
  mudarStatus: vi.fn(),
}))
vi.mock('@/lib/services/memorial-exposicao.service', () => servicoExposicao)

const colecao = await import('../exposicoes/route')
const publico = await import('../exposicoes/publico/route')
const status = await import('../exposicoes/[id]/status/route')
const upload = await import('../upload/route')

const mockAuth = vi.mocked(auth)
const semParams = { params: Promise.resolve({}) }

function sessao(role: string) {
  mockAuth.mockResolvedValue({ user: { id: 'u1', role } } as never)
}

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init)
}

beforeEach(() => vi.clearAllMocks())

describe('/api/v1/memorial/exposicoes', () => {
  it('sem sessão ou com papel fora da comunicação → 403', async () => {
    mockAuth.mockResolvedValue(null as never)
    expect((await colecao.GET(req('/api/v1/memorial/exposicoes'), semParams)).status).toBe(403)
    sessao('ATENDIMENTO')
    expect((await colecao.GET(req('/api/v1/memorial/exposicoes'), semParams)).status).toBe(403)
  })

  it('ADMIN também opera o Memorial', async () => {
    sessao('ADMIN')
    servicoExposicao.listarAdmin.mockResolvedValue({ itens: [], total: 0 })
    expect((await colecao.GET(req('/api/v1/memorial/exposicoes'), semParams)).status).toBe(200)
  })

  it('lista paginada para a comunicação, respeitando o teto de 50 por página', async () => {
    sessao('COMUNICACAO')
    servicoExposicao.listarAdmin.mockResolvedValue({ itens: [{ id: 'e1' }], total: 61 })

    const res = await colecao.GET(req('/api/v1/memorial/exposicoes?pageSize=20&page=2'), semParams)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.meta).toEqual({ page: 2, pageSize: 20, total: 61, totalPages: 4 })
    expect((await colecao.GET(req('/api/v1/memorial/exposicoes?pageSize=51'), semParams)).status).toBe(400)
  })

  it('cria com corpo validado; título curto volta com erro por campo', async () => {
    sessao('SUPER_ADMIN')
    servicoExposicao.criar.mockResolvedValue({ id: 'e1' })
    const post = (corpo: unknown) =>
      colecao.POST(req('/api/v1/memorial/exposicoes', { method: 'POST', body: JSON.stringify(corpo) }), semParams)

    expect((await post({ titulo: 'São João' })).status).toBe(201)
    const invalido = await post({ titulo: 'SJ' })
    expect(invalido.status).toBe(400)
    expect((await invalido.json()).fieldErrors.titulo).toBeDefined()
  })

  it('status aceita só valores do fluxo editorial', async () => {
    sessao('COMUNICACAO')
    servicoExposicao.mudarStatus.mockResolvedValue({ id: 'e1', status: 'EM_REVISAO' })
    const post = (corpo: unknown) =>
      status.POST(req('/api/v1/memorial/exposicoes/e1/status', { method: 'POST', body: JSON.stringify(corpo) }), {
        params: Promise.resolve({ id: 'e1' }),
      })

    expect((await post({ status: 'EM_REVISAO' })).status).toBe(200)
    expect(servicoExposicao.mudarStatus).toHaveBeenCalledWith('e1', 'EM_REVISAO', expect.objectContaining({ userId: 'u1' }))
    expect((await post({ status: 'APAGADO' })).status).toBe(400)
  })
})

describe('/api/v1/memorial/exposicoes/publico', () => {
  it('é aberto e vai com cache público', async () => {
    servicoExposicao.listarPublicas.mockResolvedValue({ itens: [], total: 0 })
    const res = await publico.GET(req('/api/v1/memorial/exposicoes/publico'), semParams)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60')
    expect(mockAuth).not.toHaveBeenCalled()
  })
})

describe('/api/v1/memorial/upload', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  function enviar(arquivo: File, pasta?: string) {
    const fd = new FormData()
    fd.append('file', arquivo)
    if (pasta) fd.append('pasta', pasta)
    return upload.POST(req('/api/v1/memorial/upload', { method: 'POST', body: fd }), semParams)
  }

  it('grava no bucket do memorial com nome gerado no servidor', async () => {
    sessao('COMUNICACAO')
    vi.mocked(uploadFile).mockResolvedValue('/api/arquivos/memorial/acervo/x.png')

    const res = await enviar(new File([PNG], '../../etc/passwd.png', { type: 'image/png' }))

    expect(res.status).toBe(201)
    const [bucket, caminho] = vi.mocked(uploadFile).mock.calls[0]
    expect(bucket).toBe('memorial')
    expect(caminho).toMatch(/^acervo\/[0-9a-f-]+\.png$/)
  })

  it('recusa SVG, pasta desconhecida e quem não é da comunicação', async () => {
    sessao('COMUNICACAO')
    expect((await enviar(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }))).status).toBe(400)
    expect((await enviar(new File([PNG], 'a.png', { type: 'image/png' }), '../editais')).status).toBe(400)
    sessao('PROPONENTE')
    expect((await enviar(new File([PNG], 'a.png', { type: 'image/png' }))).status).toBe(403)
    expect(uploadFile).not.toHaveBeenCalled()
  })
})
