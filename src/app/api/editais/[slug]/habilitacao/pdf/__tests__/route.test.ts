import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

describe('GET /api/editais/[slug]/habilitacao/pdf', () => {
  it('retorna 404 para edital que não é o Festival', async () => {
    const req = new NextRequest('http://localhost/api/editais/outro-edital/habilitacao/pdf')
    const res = await GET(req, { params: Promise.resolve({ slug: 'outro-edital' }) })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('NOT_FOUND')
  })

  it('retorna 200 com buffer PDF e headers corretos para o Festival', async () => {
    const req = new NextRequest('http://localhost/api/editais/festival-arte-cultura-irece-centenario-2026/habilitacao/pdf')
    const res = await GET(req, { params: Promise.resolve({ slug: 'festival-arte-cultura-irece-centenario-2026' }) })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('relacao-de-habilitados')
    const arrayBuffer = await res.arrayBuffer()
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000)
  })
})
