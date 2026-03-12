import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────────────────────────

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockCreateSignedUrl = vi.fn()
const mockGetPublicUrl = vi.fn()

const mockFrom = vi.fn(() => ({
  upload: mockUpload,
  remove: mockRemove,
  createSignedUrl: mockCreateSignedUrl,
  getPublicUrl: mockGetPublicUrl,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: mockFrom,
    },
  })),
}))

// Desfaz o mock global do setup.ts para testar a implementação real
vi.unmock('@/lib/storage')

// Variáveis de ambiente necessárias para getSupabase()
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Importa depois dos mocks
const { uploadFile, deleteFile, getSignedUrl } = await import('../index')

// ─── Testes ─────────────────────────────────────────────────────────────────────

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── uploadFile ─────────────────────────────────────────────────────────────

  describe('uploadFile', () => {
    it('faz upload e retorna URL pública', async () => {
      mockUpload.mockResolvedValueOnce({ error: null })
      mockGetPublicUrl.mockReturnValueOnce({
        data: { publicUrl: 'https://storage.supabase.co/editais/edital-1.pdf' },
      })

      const buffer = Buffer.from('conteudo-pdf')
      const url = await uploadFile('editais', 'edital-1.pdf', buffer, 'application/pdf')

      expect(url).toBe('https://storage.supabase.co/editais/edital-1.pdf')
      expect(mockFrom).toHaveBeenCalledWith('editais')
      expect(mockUpload).toHaveBeenCalledWith('edital-1.pdf', buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })
    })

    it('lança erro quando upload falha', async () => {
      mockUpload.mockResolvedValueOnce({
        error: { message: 'Bucket not found' },
      })

      const buffer = Buffer.from('dados')
      await expect(
        uploadFile('inexistente', 'arquivo.pdf', buffer, 'application/pdf'),
      ).rejects.toThrow('Upload falhou: Bucket not found')
    })
  })

  // ─── deleteFile ─────────────────────────────────────────────────────────────

  describe('deleteFile', () => {
    it('remove o arquivo do bucket', async () => {
      mockRemove.mockResolvedValueOnce({ error: null })

      await deleteFile('propostas', 'doc-123.pdf')

      expect(mockFrom).toHaveBeenCalledWith('propostas')
      expect(mockRemove).toHaveBeenCalledWith(['doc-123.pdf'])
    })

    it('lança erro quando deleção falha', async () => {
      mockRemove.mockResolvedValueOnce({
        error: { message: 'Object not found' },
      })

      await expect(
        deleteFile('propostas', 'nao-existe.pdf'),
      ).rejects.toThrow('Deleção falhou: Object not found')
    })
  })

  // ─── getSignedUrl ───────────────────────────────────────────────────────────

  describe('getSignedUrl', () => {
    it('retorna URL assinada com expiração padrão (3600s)', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://storage.supabase.co/signed/propostas/doc.pdf?token=abc' },
        error: null,
      })

      const url = await getSignedUrl('propostas', 'doc.pdf')

      expect(url).toBe('https://storage.supabase.co/signed/propostas/doc.pdf?token=abc')
      expect(mockFrom).toHaveBeenCalledWith('propostas')
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('doc.pdf', 3600)
    })

    it('respeita expiração customizada', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://storage.supabase.co/signed/propostas/doc.pdf?token=xyz' },
        error: null,
      })

      const url = await getSignedUrl('propostas', 'doc.pdf', 7200)

      expect(url).toBe('https://storage.supabase.co/signed/propostas/doc.pdf?token=xyz')
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('doc.pdf', 7200)
    })

    it('lança erro quando createSignedUrl falha', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized' },
      })

      await expect(
        getSignedUrl('propostas', 'privado.pdf'),
      ).rejects.toThrow('URL assinada falhou: Unauthorized')
    })

    it('lança erro quando data é null sem error', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        getSignedUrl('propostas', 'algo.pdf'),
      ).rejects.toThrow('URL assinada falhou')
    })
  })
})
