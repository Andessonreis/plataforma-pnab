import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse antes de importar o middleware
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({ type: 'next' })),
      redirect: vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
    },
  }
})

// Mock auth como wrapper que chama o callback
vi.mock('@/lib/auth', () => ({
  auth: vi.fn((handler: (req: unknown) => unknown) => handler),
}))

import { NextResponse } from 'next/server'

// Tipos para o teste
interface MockRequest {
  nextUrl: { pathname: string }
  url: string
  auth: { user?: { role?: string } } | null
}

// Importa o middleware default
// O middleware exporta auth(callback), e nosso mock retorna o callback direto
let middlewareFn: (req: MockRequest) => unknown

beforeEach(async () => {
  vi.clearAllMocks()
  // Re-import para pegar a versão mockada
  const mod = await import('../../middleware')
  middlewareFn = mod.default as unknown as (req: MockRequest) => unknown
})

function makeReq(pathname: string, session: MockRequest['auth'] = null): MockRequest {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    auth: session,
  }
}

describe('middleware RBAC', () => {
  it('/admin sem sessão → redirect /login', () => {
    middlewareFn(makeReq('/admin'))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    )
  })

  it('/admin com PROPONENTE → redirect /', () => {
    middlewareFn(makeReq('/admin', { user: { role: 'PROPONENTE' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/admin com ADMIN → permite', () => {
    middlewareFn(makeReq('/admin', { user: { role: 'ADMIN' } }))
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('/admin com HABILITADOR → permite', () => {
    middlewareFn(makeReq('/admin', { user: { role: 'HABILITADOR' } }))
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('/proponente sem sessão → redirect /login', () => {
    middlewareFn(makeReq('/proponente'))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    )
  })

  it('/proponente com ADMIN → redirect / (bug 1 fix)', () => {
    middlewareFn(makeReq('/proponente', { user: { role: 'ADMIN' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/proponente com AVALIADOR → redirect /', () => {
    middlewareFn(makeReq('/proponente', { user: { role: 'AVALIADOR' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/proponente com HABILITADOR → redirect /', () => {
    middlewareFn(makeReq('/proponente', { user: { role: 'HABILITADOR' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/proponente com ATENDIMENTO → redirect /', () => {
    middlewareFn(makeReq('/proponente', { user: { role: 'ATENDIMENTO' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/proponente com PROPONENTE → permite', () => {
    middlewareFn(makeReq('/proponente', { user: { role: 'PROPONENTE' } }))
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('/avaliador sem sessão → redirect /login', () => {
    middlewareFn(makeReq('/avaliador'))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    )
  })

  it('/avaliador com PROPONENTE → redirect /', () => {
    middlewareFn(makeReq('/avaliador', { user: { role: 'PROPONENTE' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' }),
    )
  })

  it('/avaliador com AVALIADOR → permite', () => {
    middlewareFn(makeReq('/avaliador', { user: { role: 'AVALIADOR' } }))
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('/admin com AVALIADOR → redirect /avaliador', () => {
    middlewareFn(makeReq('/admin', { user: { role: 'AVALIADOR' } }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/avaliador' }),
    )
  })

  it('rotas públicas (/, /editais) → permite sem sessão', () => {
    middlewareFn(makeReq('/'))
    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()

    vi.clearAllMocks()
    middlewareFn(makeReq('/editais'))
    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })
})
