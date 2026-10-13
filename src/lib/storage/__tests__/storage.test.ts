import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Desfaz o mock global do setup.ts para testar a implementação real
vi.unmock('@/lib/storage')

let raiz: string

beforeAll(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'pnab-storage-'))
  process.env.UPLOAD_DIR = raiz
  process.env.AUTH_SECRET = 'segredo-de-teste'
})

afterAll(async () => {
  await fs.rm(raiz, { recursive: true, force: true })
})

const { uploadFile, deleteFile, downloadFile, extractStoragePath, getSignedUrl } = await import('../index')
const { assinaturaValida } = await import('../assinatura')

describe('storage em disco', () => {
  it('grava o arquivo e devolve a URL relativa servida por /api/arquivos', async () => {
    const url = await uploadFile('editais', 'edital-1/edital final.pdf', Buffer.from('pdf'), 'application/pdf')

    expect(url).toBe('/api/arquivos/editais/edital-1/edital%20final.pdf')
    expect(await fs.readFile(path.join(raiz, 'editais/edital-1/edital final.pdf'), 'utf8')).toBe('pdf')
  })

  it('upsert=false falha quando o arquivo já existe', async () => {
    await uploadFile('manuais', 'a.pdf', Buffer.from('1'), 'application/pdf')
    await expect(uploadFile('manuais', 'a.pdf', Buffer.from('2'), 'application/pdf', false)).rejects.toThrow(
      'Upload falhou',
    )
  })

  it('aceita Blob', async () => {
    await uploadFile('manuais', 'blob.txt', new Blob(['oi']), 'text/plain')
    expect((await downloadFile('manuais', 'blob.txt')).toString()).toBe('oi')
  })

  it.each(['../fora.pdf', '/absoluto.pdf', 'a/../../fora.pdf'])('rejeita caminho que escapa da pasta: %s', async (caminho) => {
    await expect(uploadFile('editais', caminho, Buffer.from('x'), 'application/pdf')).rejects.toThrow(
      'Caminho de arquivo inválido',
    )
  })

  it('rejeita bucket desconhecido', async () => {
    await expect(uploadFile('inexistente', 'a.pdf', Buffer.from('x'), 'application/pdf')).rejects.toThrow(
      'Bucket desconhecido',
    )
  })

  it('deleteFile remove o arquivo e é idempotente', async () => {
    await uploadFile('propostas', 'doc.pdf', Buffer.from('x'), 'application/pdf')
    await deleteFile('propostas', 'doc.pdf')
    await expect(downloadFile('propostas', 'doc.pdf')).rejects.toThrow('Download falhou')
    await expect(deleteFile('propostas', 'doc.pdf')).resolves.toBeUndefined()
  })

  describe('extractStoragePath', () => {
    it('devolve o caminho decodificado do bucket certo', () => {
      expect(extractStoragePath('editais', '/api/arquivos/editais/edital-1/edital%20final.pdf')).toBe(
        'edital-1/edital final.pdf',
      )
    })

    it('ignora query string e host', () => {
      expect(extractStoragePath('propostas', 'https://x.br/api/arquivos/propostas/a/b.pdf?exp=1&sig=2')).toBe('a/b.pdf')
    })

    it('devolve null para outro bucket ou link externo', () => {
      expect(extractStoragePath('editais', '/api/arquivos/manuais/a.pdf')).toBeNull()
      expect(extractStoragePath('propostas', 'https://youtu.be/abc')).toBeNull()
    })
  })

  describe('getSignedUrl', () => {
    it('gera URL com assinatura válida e expiração', async () => {
      const url = new URL(await getSignedUrl('propostas', 'inscricoes/1/a.pdf', 600), 'http://x')
      const exp = Number(url.searchParams.get('exp'))

      expect(url.pathname).toBe('/api/arquivos/propostas/inscricoes/1/a.pdf')
      expect(assinaturaValida('propostas', 'inscricoes/1/a.pdf', exp, url.searchParams.get('sig') ?? '')).toBe(true)
    })

    it('assinatura não vale para outro caminho nem depois de expirar', async () => {
      const url = new URL(await getSignedUrl('propostas', 'a.pdf', 600), 'http://x')
      const exp = Number(url.searchParams.get('exp'))
      const sig = url.searchParams.get('sig') ?? ''

      expect(assinaturaValida('propostas', 'outro.pdf', exp, sig)).toBe(false)
      expect(assinaturaValida('propostas', 'a.pdf', Math.floor(Date.now() / 1000) - 1, sig)).toBe(false)
    })
  })
})
