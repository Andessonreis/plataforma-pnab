import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateProjetoCompleto, type ProjetoCompletoData } from '../projeto-completo'
import { addInfoBlock, addCompactSection } from '../layout-helpers'
import { EMISSAO_TESTE, lerPdf } from './apoio-pdf'

// O PDFKit comprime o conteúdo e embute as fontes em subconjunto, então o texto
// não é legível no binário. As chamadas de layout são espiadas: o que o gerador
// manda desenhar é o que vai para o papel.
vi.mock('../layout-helpers', async (importOriginal) => {
  const original = await importOriginal<typeof import('../layout-helpers')>()
  return {
    ...original,
    addInfoBlock: vi.fn(original.addInfoBlock),
    addCompactSection: vi.fn(original.addCompactSection),
  }
})

const spyBloco = vi.mocked(addInfoBlock)
const spySecao = vi.mocked(addCompactSection)

function projeto(parcial: Partial<ProjetoCompletoData> = {}): ProjetoCompletoData {
  return {
    numero: 'PNAB-2026-0139',
    status: 'RESULTADO_FINAL',
    proponente: { nome: 'Cleriston Kerley Dourado', cpfCnpj: '00326220585', email: 'k@teste.com', tipoProponente: 'PF' },
    edital: { titulo: 'Festival de Arte e Cultura', ano: 2026 },
    categoria: 'Arte Visual',
    campos: { nome_projeto: 'Exposição' },
    camposFormulario: [],
    anexos: [
      { titulo: 'CV', tipo: 'PORTFOLIO', valido: null },
      { titulo: 'CNH', tipo: 'DOCUMENTO_PESSOAL', valido: null },
    ],
    submittedAt: new Date('2026-08-20T13:00:00Z'),
    emissao: EMISSAO_TESTE,
    ...parcial,
  }
}

function linhasImpressas(): { label: string; value: string }[] {
  return spyBloco.mock.calls.flatMap(([, linhas]) => linhas)
}

describe('generateProjetoCompleto — conteúdo do documento', () => {
  beforeEach(() => vi.clearAllMocks())

  it('imprime o CPF completo do proponente, sem máscara', async () => {
    const pdf = await generateProjetoCompleto(projeto())

    expect((await lerPdf(pdf)).assinatura).toBe('%PDF-')
    expect(linhasImpressas()).toContainEqual({ label: 'CPF/CNPJ', value: '003.262.205-85' })
  })

  it('imprime o CNPJ completo quando o proponente é pessoa jurídica', async () => {
    await generateProjetoCompleto(projeto({
      proponente: { nome: 'Associação Cultural', cpfCnpj: '12345678000199', email: 'a@teste.com', tipoProponente: 'PJ' },
    }))

    expect(linhasImpressas()).toContainEqual({ label: 'CPF/CNPJ', value: '12.345.678/0001-99' })
  })

  it('não desenha o quadro de anexos, mesmo com anexos na inscrição', async () => {
    await generateProjetoCompleto(projeto())

    expect(spySecao.mock.calls.map(([, titulo]) => titulo)).not.toContain('Anexos')
    const rotulos = linhasImpressas().map((l) => l.label)
    expect(rotulos).not.toContain('CV')
    expect(rotulos).not.toContain('CNH')
  })
})
