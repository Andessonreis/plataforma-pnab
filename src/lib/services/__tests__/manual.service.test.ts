import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from '@/lib/audit'

const db = vi.hoisted(() => ({
  manual: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/lib/db', () => ({ prisma: db }))

const storage = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  extractStoragePath: vi.fn((bucket: string, url: string) => {
    const prefixo = `/api/arquivos/${bucket}/`
    return url.startsWith(prefixo) ? url.slice(prefixo.length) : null
  }),
}))
vi.mock('@/lib/storage', () => storage)
// A assinatura de bytes faz parte da regra testada aqui; o setup global a substitui.
vi.unmock('@/lib/upload/validate')

const servico = await import('../manual.service')

const autor = { userId: 'u1', role: 'COMUNICACAO' as const, ip: '10.0.0.1' }
const entrada = { titulo: 'Guia', categoria: 'Inscrição', versao: null, publicado: true, url: '/api/arquivos/manuais/novo.pdf' }
const atual = { id: 'm1', ...entrada, url: '/api/arquivos/manuais/antigo.pdf', createdAt: new Date() }

const PDF = Buffer.from('%PDF-1.7\n')
const OLE2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

beforeEach(() => {
  vi.clearAllMocks()
  db.manual.count.mockResolvedValue(0)
})

describe('manual.service', () => {
  it('lista filtrando pela situação e paginando', async () => {
    db.manual.findMany.mockResolvedValue([atual])
    db.manual.count.mockResolvedValue(21)

    const r = await servico.listarAdmin({ page: 2, pageSize: 20, status: 'oculto' })

    expect(r).toEqual({ itens: [atual], total: 21 })
    expect(db.manual.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { publicado: false }, skip: 20, take: 20 }))
  })

  it('cria e audita', async () => {
    db.manual.create.mockResolvedValue({ id: 'm2', ...entrada })
    await servico.criar(entrada, autor)
    expect(db.manual.create).toHaveBeenCalledWith({ data: entrada })
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MANUAL_CRIADO', entityId: 'm2', ip: '10.0.0.1' }))
  })

  it('ao trocar o arquivo, apaga o antigo', async () => {
    db.manual.findUnique.mockResolvedValue(atual)
    db.manual.update.mockResolvedValue({ ...atual, ...entrada })

    await servico.atualizar('m1', entrada, autor)

    expect(storage.deleteFile).toHaveBeenCalledWith('manuais', 'antigo.pdf')
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MANUAL_ATUALIZADO' }))
  })

  it('mantém o arquivo quando outro manual ainda aponta para ele', async () => {
    db.manual.findUnique.mockResolvedValue(atual)
    db.manual.count.mockResolvedValue(1)

    await servico.excluir('m1', autor)

    expect(db.manual.delete).toHaveBeenCalledWith({ where: { id: 'm1' } })
    expect(storage.deleteFile).not.toHaveBeenCalled()
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'MANUAL_EXCLUIDO' }))
  })

  it('falha ao apagar o arquivo não impede a exclusão', async () => {
    db.manual.findUnique.mockResolvedValue(atual)
    storage.deleteFile.mockRejectedValue(new Error('EACCES'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(servico.excluir('m1', autor)).resolves.toBeUndefined()
    expect(logAudit).toHaveBeenCalled()
  })

  it('registro inexistente vira NOT_FOUND', async () => {
    db.manual.findUnique.mockResolvedValue(null)
    await expect(servico.atualizar('x', entrada, autor)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(servico.excluir('x', autor)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  describe('enviarArquivo', () => {
    it('grava com nome sem acento e sufixo aleatório', async () => {
      storage.uploadFile.mockImplementation(async (b: string, c: string) => `/api/arquivos/${b}/${c}`)

      const url = await servico.enviarArquivo(new File([PDF], 'Manual de Prestação.PDF'))

      expect(url).toMatch(/^\/api\/arquivos\/manuais\/manual-de-prestacao-[0-9a-f]{8}\.pdf$/)
      expect(storage.uploadFile).toHaveBeenCalledWith('manuais', expect.any(String), expect.any(Buffer), 'application/pdf')
    })

    it('aceita DOC legado pela assinatura OLE2', async () => {
      storage.uploadFile.mockResolvedValue('/api/arquivos/manuais/x.doc')
      await expect(servico.enviarArquivo(new File([OLE2], 'modelo.doc'))).resolves.toBeTruthy()
    })

    it.each([
      ['extensão fora da lista', new File([PDF], 'foto.png')],
      ['conteúdo que não bate com a extensão', new File([PDF], 'planilha.xlsx')],
      ['arquivo vazio', new File([], 'vazio.pdf')],
      ['arquivo acima do limite', new File([PDF, Buffer.alloc(20 * 1024 * 1024)], 'grande.pdf')],
    ])('recusa %s', async (_caso, file) => {
      await expect(servico.enviarArquivo(file)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(storage.uploadFile).not.toHaveBeenCalled()
    })
  })
})
