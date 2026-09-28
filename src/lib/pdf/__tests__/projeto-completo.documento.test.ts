import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateProjetoCompleto, type ProjetoCompletoData } from '../projeto-completo'
import { addInfoBlock, addCompactSection } from '../layout-helpers'
import { criarDocumentoOficial } from '../documento-oficial'
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

vi.mock('../documento-oficial', async (importOriginal) => {
  const original = await importOriginal<typeof import('../documento-oficial')>()
  return { ...original, criarDocumentoOficial: vi.fn(original.criarDocumentoOficial) }
})

const spyBloco = vi.mocked(addInfoBlock)
const spySecao = vi.mocked(addCompactSection)
const spyDocumento = vi.mocked(criarDocumentoOficial)

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

  it('imprime RG e data de nascimento quando informados, logo depois do CPF', async () => {
    await generateProjetoCompleto(projeto({
      proponente: {
        nome: 'Cleriston Kerley Dourado', cpfCnpj: '00326220585', email: 'k@teste.com', tipoProponente: 'PF',
        rg: '1234567890 SSP/BA', dataNascimento: '05/03/1985',
      },
    }))

    const rotulos = linhasImpressas().map((l) => l.label)
    expect(linhasImpressas()).toContainEqual({ label: 'RG', value: '1234567890 SSP/BA' })
    expect(linhasImpressas()).toContainEqual({ label: 'Data de nascimento', value: '05/03/1985' })
    expect(rotulos.indexOf('RG')).toBe(rotulos.indexOf('CPF/CNPJ') + 1)
  })

  it('imprime nome, CPF, RG e nascimento do responsável, depois dos dados do cadastro', async () => {
    await generateProjetoCompleto(projeto({
      proponente: {
        nome: 'Associação Cultural', cpfCnpj: '12345678000199', email: 'a@teste.com', tipoProponente: 'PJ',
        responsavel: { nome: 'Naftali Felix Gomes', cpf: '07705886545', rg: '14.929.551-08 SSP/BA', dataNascimento: '06/09/1997' },
      },
    }))

    const linhas = linhasImpressas()
    expect(linhas).toContainEqual({ label: 'Responsável', value: 'Naftali Felix Gomes' })
    expect(linhas).toContainEqual({ label: 'CPF do responsável', value: '077.058.865-45' })
    expect(linhas).toContainEqual({ label: 'RG do responsável', value: '14.929.551-08 SSP/BA' })
    expect(linhas).toContainEqual({ label: 'Nasc. do responsável', value: '06/09/1997' })
    const rotulos = linhas.map((l) => l.label)
    expect(rotulos.indexOf('Responsável')).toBe(rotulos.indexOf('CPF/CNPJ') + 1)
    expect(rotulos.indexOf('Nasc. do responsável')).toBeLessThan(rotulos.indexOf('E-mail'))
  })

  it('omite do responsável o que não foi informado e não imprime o bloco sem responsável', async () => {
    await generateProjetoCompleto(projeto({
      proponente: {
        nome: 'Grupo', cpfCnpj: '10763778583', email: 'g@teste.com', tipoProponente: 'PF',
        responsavel: { nome: 'Fulano de Tal', cpf: '00374125589' },
      },
    }))
    const rotulos = linhasImpressas().map((l) => l.label)
    expect(rotulos).toContain('CPF do responsável')
    expect(rotulos).not.toContain('RG do responsável')
    expect(rotulos).not.toContain('Nasc. do responsável')

    vi.clearAllMocks()
    await generateProjetoCompleto(projeto())
    expect(linhasImpressas().map((l) => l.label)).not.toContain('Responsável')
  })

  it('todo rótulo da ficha cabe numa linha (até 22 caracteres)', async () => {
    await generateProjetoCompleto(projeto({
      proponente: {
        nome: 'Entidade', cpfCnpj: '12345678000199', email: 'e@teste.com', tipoProponente: 'PJ',
        rg: '1', dataNascimento: '01/01/1980',
        responsavel: { nome: 'Fulano', cpf: '00374125589', rg: '2', dataNascimento: '02/02/1970' },
      },
    }))

    expect(Math.max(...linhasImpressas().map((l) => l.label.length))).toBeLessThanOrEqual(22)
  })

  it('não imprime RG nem data de nascimento quando não informados', async () => {
    await generateProjetoCompleto(projeto())

    const rotulos = linhasImpressas().map((l) => l.label)
    expect(rotulos).not.toContain('RG')
    expect(rotulos).not.toContain('Data de nascimento')
  })

  it('chama de projeto completo por padrão e de projeto contemplado na versão do contemplado', async () => {
    await generateProjetoCompleto(projeto())
    await generateProjetoCompleto(projeto({ versao: 'contemplado' }))

    expect(spyDocumento.mock.calls.map(([opcoes]) => opcoes.titulo)).toEqual(['Projeto Completo', 'Projeto Contemplado'])
    expect(spyDocumento.mock.calls.map(([opcoes]) => opcoes.rotulo)).toEqual(['Projeto completo', 'Projeto contemplado'])
  })

  it('não desenha o quadro de anexos, mesmo com anexos na inscrição', async () => {
    await generateProjetoCompleto(projeto())

    expect(spySecao.mock.calls.map(([, titulo]) => titulo)).not.toContain('Anexos')
    const rotulos = linhasImpressas().map((l) => l.label)
    expect(rotulos).not.toContain('CV')
    expect(rotulos).not.toContain('CNH')
  })
})
