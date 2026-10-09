import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { NextRequest } from 'next/server'

vi.unmock('@/lib/storage')

let raiz: string

beforeAll(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'pnab-arquivos-'))
  process.env.UPLOAD_DIR = raiz
  process.env.AUTH_SECRET = 'segredo-de-teste'
  await fs.mkdir(path.join(raiz, 'editais'), { recursive: true })
  await fs.mkdir(path.join(raiz, 'propostas'), { recursive: true })
  await fs.writeFile(path.join(raiz, 'editais/a.pdf'), 'conteudo-publico')
  await fs.writeFile(path.join(raiz, 'propostas/b.pdf'), 'conteudo-privado')
  await fs.writeFile(path.join(raiz, 'segredo.txt'), 'fora-dos-buckets')
})

afterAll(async () => {
  await fs.rm(raiz, { recursive: true, force: true })
})

const { GET } = await import('../route')
const { getSignedUrl } = await import('@/lib/storage')

function chamar(url: string, caminho: string[]) {
  return GET(new NextRequest(`http://localhost${url}`), { params: Promise.resolve({ caminho }) })
}

describe('GET /api/arquivos', () => {
  it('serve arquivo de bucket público com o tipo pela extensão', async () => {
    const res = await chamar('/api/arquivos/editais/a.pdf', ['editais', 'a.pdf'])

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(await res.text()).toBe('conteudo-publico')
  })

  it('bucket privado sem assinatura responde 403', async () => {
    const res = await chamar('/api/arquivos/propostas/b.pdf', ['propostas', 'b.pdf'])
    expect(res.status).toBe(403)
  })

  it('bucket privado com assinatura válida serve sem cache', async () => {
    const assinada = await getSignedUrl('propostas', 'b.pdf', 60)
    const res = await chamar(assinada, ['propostas', 'b.pdf'])

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await res.text()).toBe('conteudo-privado')
  })

  it('assinatura de um arquivo não abre outro', async () => {
    await fs.writeFile(path.join(raiz, 'propostas/c.pdf'), 'outro')
    const assinada = await getSignedUrl('propostas', 'b.pdf', 60)
    const res = await chamar(assinada, ['propostas', 'c.pdf'])
    expect(res.status).toBe(403)
  })

  it('não deixa sair da pasta do bucket', async () => {
    const res = await chamar('/api/arquivos/editais/x', ['editais', '..', 'segredo.txt'])
    expect(res.status).toBe(404)
  })

  it('arquivo inexistente e bucket desconhecido respondem 404', async () => {
    expect((await chamar('/x', ['editais', 'nao-existe.pdf'])).status).toBe(404)
    expect((await chamar('/x', ['outro', 'a.pdf'])).status).toBe(404)
  })
})
