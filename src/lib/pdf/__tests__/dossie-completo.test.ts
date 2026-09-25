import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { downloadFile } from '@/lib/storage'
import { juntarProjetos, mesclarAnexosNoPdf, type ProjetoDoLote } from '../dossie-completo'

// Anexo com URL "link:" simula vídeo externo: fora do storage, sem arquivo a baixar.
vi.mock('@/lib/storage', () => ({
  downloadFile: vi.fn(),
  extractStoragePath: (_bucket: string, url: string) => (url.startsWith('link:') ? null : url),
}))

const mockDownload = vi.mocked(downloadFile)

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function pdfComPaginas(paginas: number): Promise<Buffer> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < paginas; i++) doc.addPage([200, 200])
  return Buffer.from(await doc.save())
}

async function paginasDe(pdf: Buffer): Promise<number> {
  return (await PDFDocument.load(pdf)).getPageCount()
}

async function* deLista(projetos: ProjetoDoLote[]): AsyncGenerator<ProjetoDoLote> {
  for (const projeto of projetos) yield projeto
}

describe('juntarProjetos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sem anexos: soma só as páginas de dados e não toca no storage', async () => {
    const lote = deLista([
      { pdf: await pdfComPaginas(1), anexos: [{ titulo: 'CV', url: 'cv.pdf' }] },
      { pdf: await pdfComPaginas(2), anexos: [{ titulo: 'Foto', url: 'foto.png' }] },
    ])

    const resultado = await juntarProjetos(lote, false)

    expect(await paginasDe(resultado)).toBe(3)
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('com anexos: cada projeto vem seguido de PDFs e imagens dos seus anexos', async () => {
    mockDownload.mockImplementation(async (_bucket, path) => {
      if (path === 'cv.pdf') return pdfComPaginas(3)
      if (path === 'foto.png') return PNG_1X1
      throw new Error(`inesperado: ${path}`)
    })
    const lote = deLista([
      { pdf: await pdfComPaginas(1), anexos: [{ titulo: 'CV', url: 'cv.pdf' }, { titulo: 'Foto', url: 'foto.png' }] },
      { pdf: await pdfComPaginas(2), anexos: [] },
    ])

    const resultado = await juntarProjetos(lote, true)

    // 1 de dados + 3 do PDF + 1 da imagem, depois as 2 de dados do segundo projeto.
    expect(await paginasDe(resultado)).toBe(7)
    expect(mockDownload.mock.calls.map(([, path]) => path)).toEqual(['cv.pdf', 'foto.png'])
  })

  it('pula link externo, anexo que não baixa e PDF ilegível, sem perder os demais', async () => {
    mockDownload.mockImplementation(async (_bucket, path) => {
      if (path === 'sumiu.pdf') throw new Error('não encontrado')
      if (path === 'corrompido.pdf') return Buffer.from('isto não é um pdf')
      return PNG_1X1
    })
    const lote = deLista([{
      pdf: await pdfComPaginas(1),
      anexos: [
        { titulo: 'Vídeo', url: 'link:https://youtu.be/x' },
        { titulo: 'Sumiu', url: 'sumiu.pdf' },
        { titulo: 'Corrompido', url: 'corrompido.pdf' },
        { titulo: 'Foto', url: 'foto.png' },
      ],
    }])

    const resultado = await juntarProjetos(lote, true)

    expect(await paginasDe(resultado)).toBe(2)
  })

  it('imagem corrompida não derruba o lote: os demais anexos e projetos seguem', async () => {
    mockDownload.mockImplementation(async (_bucket, path) => {
      if (path === 'truncada.jpg') return Buffer.from('\xff\xd8\xff\xe0 truncada')
      return PNG_1X1
    })
    const lote = deLista([
      { pdf: await pdfComPaginas(1), anexos: [{ titulo: 'Truncada', url: 'truncada.jpg' }, { titulo: 'Foto', url: 'foto.png' }] },
      { pdf: await pdfComPaginas(1), anexos: [{ titulo: 'Outra', url: 'outra.png' }] },
    ])

    const resultado = await juntarProjetos(lote, true)

    // Dados + foto do primeiro projeto, dados + foto do segundo.
    expect(await paginasDe(resultado)).toBe(4)
  })

  it('consome os projetos um a um, sem gerar o seguinte antes de terminar o atual', async () => {
    const ordem: string[] = []
    async function* lote(): AsyncGenerator<ProjetoDoLote> {
      for (const nome of ['a', 'b']) {
        ordem.push(`gera ${nome}`)
        yield { pdf: await pdfComPaginas(1), anexos: [{ titulo: nome, url: `${nome}.png` }] }
      }
    }
    mockDownload.mockImplementation(async (_bucket, path) => {
      ordem.push(`baixa ${path}`)
      return PNG_1X1
    })

    await juntarProjetos(lote(), true)

    expect(ordem).toEqual(['gera a', 'baixa a.png', 'gera b', 'baixa b.png'])
  })
})

describe('mesclarAnexosNoPdf', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mantém o dossiê individual: dados primeiro, anexos depois', async () => {
    mockDownload.mockResolvedValue(await pdfComPaginas(2))

    const resultado = await mesclarAnexosNoPdf(await pdfComPaginas(1), [{ titulo: 'CV', url: 'cv.pdf' }])

    expect(await paginasDe(resultado)).toBe(3)
  })
})
