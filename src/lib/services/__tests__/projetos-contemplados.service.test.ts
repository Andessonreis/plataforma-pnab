import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { descartarEmissao, registrarEmissao } from '@/lib/documentos/emissao'
import { juntarProjetos, type ProjetoDoLote } from '@/lib/pdf/dossie-completo'
import { generateProjetoCompleto } from '@/lib/pdf/projeto-completo'
import { montarClassificacao, type CategoriaClassificada } from '@/lib/results/classificacao'
import { emitirProjetosContemplados } from '../projetos-contemplados.service'
import { ServiceError } from '../errors'

vi.mock('@/lib/documentos/emissao', () => ({ registrarEmissao: vi.fn(), descartarEmissao: vi.fn() }))
vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/pdf/projeto-completo', () => ({ generateProjetoCompleto: vi.fn() }))
vi.mock('@/lib/pdf/dossie-completo', () => ({ juntarProjetos: vi.fn() }))

const mockEdital = vi.mocked(prisma.edital.findUnique)
const mockInscricoes = vi.mocked(prisma.inscricao.findMany)
const mockClassificacao = vi.mocked(montarClassificacao)
const mockRegistrar = vi.mocked(registrarEmissao)
const mockDescartar = vi.mocked(descartarEmissao)
const mockGerar = vi.mocked(generateProjetoCompleto)
const mockJuntar = vi.mocked(juntarProjetos)
const mockAudit = vi.mocked(logAudit)

const EMISSAO = {
  codigo: 'PNAB-ABCD-2345',
  emitidoEm: new Date('2026-09-25T15:00:00Z'),
  urlVerificacao: 'https://portal.exemplo/verificar/PNAB-ABCD-2345',
  hashConteudo: 'hash',
  template: 2 as const,
}

const EDITAL = {
  titulo: 'Festival de Arte e Cultura',
  ano: 2026,
  slug: 'festival',
  vagasSuplentes: 2,
  notaMinima: null,
  categoriasConfig: null,
  bonusVisivelParaAdmin: false,
  resultadoTemplate: { foraDaClassificacao: ['PNAB-2026-0046'] },
}

function linha(numero: string, status: CategoriaClassificada['linhas'][number]['status']) {
  return {
    inscricaoId: `id-${numero}`, numero, proponenteNome: 'Ana', posicao: 1,
    notaBase: 90, notaBonus: 0, notaFinal: 90, cotista: false, bonusItens: [],
    status, finalizadas: 3, atribuidos: 3, empatado: false, semAvaliacao: false,
  }
}

function inscricao(numero: string) {
  return {
    id: `id-${numero}`,
    numero,
    status: 'RESULTADO_FINAL',
    categoria: 'Música',
    campos: {},
    submittedAt: new Date('2026-08-20T13:00:00Z'),
    createdAt: new Date('2026-08-19T13:00:00Z'),
    proponente: { id: 'p-1', nome: 'Ana', cpfCnpj: '12345678901', email: 'ana@teste.com', tipoProponente: 'PF' },
    edital: { titulo: EDITAL.titulo, ano: EDITAL.ano, camposFormulario: [] },
    anexos: [{ titulo: 'CV', tipo: 'PORTFOLIO', valido: null, url: `${numero}.pdf` }],
  }
}

const entrada = { editalId: 'ed-1', incluirAnexos: false, userId: 'admin-1', role: 'ADMIN' }

describe('emitirProjetosContemplados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEdital.mockResolvedValue(EDITAL as never)
    mockClassificacao.mockResolvedValue([
      { nome: 'Música', vagasAmplaConcorrencia: 2, cotas: [], valorPorProjeto: null, linhas: [
        linha('PNAB-2026-0001', 'CONTEMPLADA'),
        linha('PNAB-2026-0002', 'SUPLENTE'),
        linha('PNAB-2026-0003', 'CONTEMPLADA'),
        linha('PNAB-2026-0004', 'NAO_CONTEMPLADA'),
      ] },
      { nome: 'Teatro', vagasAmplaConcorrencia: 1, cotas: [], valorPorProjeto: null, linhas: [
        linha('PNAB-2026-0046', 'CONTEMPLADA'),
        linha('PNAB-2026-0010', 'CONTEMPLADA'),
      ] },
    ])
    mockInscricoes.mockResolvedValue(
      ['PNAB-2026-0010', 'PNAB-2026-0003', 'PNAB-2026-0001'].map(inscricao) as never,
    )
    mockRegistrar.mockResolvedValue(EMISSAO)
    mockGerar.mockResolvedValue(Buffer.from('pdf-projeto'))
    mockJuntar.mockImplementation(async (projetos: AsyncIterable<ProjetoDoLote>) => {
      for await (const projeto of projetos) void projeto
      return Buffer.from('lote')
    })
  })

  it('leva só os contemplados, sem quem ficou fora da classificação, na ordem da classificação', async () => {
    await emitirProjetosContemplados(entrada)

    expect(mockInscricoes).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['id-PNAB-2026-0001', 'id-PNAB-2026-0003', 'id-PNAB-2026-0010'] } },
    }))
    // O banco devolveu fora de ordem; o PDF segue a ordem da classificação.
    expect(mockGerar.mock.calls.map(([dados]) => dados.numero)).toEqual([
      'PNAB-2026-0001', 'PNAB-2026-0003', 'PNAB-2026-0010',
    ])
  })

  it('cada projeto leva o código do lote e a situação gravada na inscrição', async () => {
    await emitirProjetosContemplados(entrada)

    expect(mockGerar).toHaveBeenCalledTimes(3)
    for (const [dados] of mockGerar.mock.calls) {
      expect(dados.emissao).toBe(EMISSAO)
      expect(dados.status).toBe('RESULTADO_FINAL')
    }
  })

  it('sem anexos: nome de projetos e o modo repassado à mescla', async () => {
    const res = await emitirProjetosContemplados(entrada)

    expect(mockJuntar).toHaveBeenCalledWith(expect.anything(), false)
    expect(res.filename).toMatch(/^projetos-contemplados_festival_\d{4}-\d{2}-\d{2}\.pdf$/)
    expect(res.total).toBe(3)
    expect(res.buffer.toString()).toBe('lote')
  })

  it('com anexos: nome de dossiês e os anexos de cada inscrição vão para a mescla', async () => {
    let recebidos: ProjetoDoLote[] = []
    mockJuntar.mockImplementation(async (projetos: AsyncIterable<ProjetoDoLote>) => {
      recebidos = []
      for await (const projeto of projetos) recebidos.push(projeto)
      return Buffer.from('lote')
    })

    const res = await emitirProjetosContemplados({ ...entrada, incluirAnexos: true })

    expect(mockJuntar).toHaveBeenCalledWith(expect.anything(), true)
    expect(res.filename).toMatch(/^dossies-contemplados_festival_/)
    expect(recebidos.map((p) => p.anexos[0].url)).toEqual([
      'PNAB-2026-0001.pdf', 'PNAB-2026-0003.pdf', 'PNAB-2026-0010.pdf',
    ])
  })

  it('registra a emissão com só números de protocolo no conteúdo e os totais na verificação', async () => {
    await emitirProjetosContemplados(entrada)

    expect(mockRegistrar).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'PROJETOS_CONTEMPLADOS',
      titulo: 'Projetos completos dos contemplados — Festival de Arte e Cultura (2026)',
      editalId: 'ed-1',
      emitidoPorId: 'admin-1',
      conteudo: expect.objectContaining({ projetos: ['PNAB-2026-0001', 'PNAB-2026-0003', 'PNAB-2026-0010'] }),
      metadados: { Contemplados: 3, Anexos: 'não incluídos' },
    }))
  })

  it('audita a exportação com o código da emissão', async () => {
    await emitirProjetosContemplados({ ...entrada, incluirAnexos: true, ip: '10.0.0.1' })

    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'admin-1',
      action: 'EXPORTACAO_PROJETOS_CONTEMPLADOS',
      entityId: 'ed-1',
      details: expect.objectContaining({ contemplados: 3, comAnexos: true, codigoEmissao: 'PNAB-ABCD-2345' }),
      ip: '10.0.0.1',
    }))
  })

  it.each([
    ['ADMIN', false, false],
    ['ADMIN', true, true],
    ['SUPER_ADMIN', false, true],
  ])('papel %s com painel de bônus liberado=%s → bonificação na nota=%s', async (role, liberado, esperado) => {
    mockEdital.mockResolvedValue({ ...EDITAL, bonusVisivelParaAdmin: liberado } as never)

    await emitirProjetosContemplados({ ...entrada, role })

    expect(mockClassificacao).toHaveBeenCalledWith('ed-1', expect.objectContaining({ incluirBonus: esperado }))
  })

  it('edital inexistente → NOT_FOUND, sem registrar emissão', async () => {
    mockEdital.mockResolvedValue(null)

    await expect(emitirProjetosContemplados(entrada)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(mockRegistrar).not.toHaveBeenCalled()
  })

  it('nenhum contemplado → BAD_REQUEST, sem registrar emissão', async () => {
    mockClassificacao.mockResolvedValue([])

    const erro = await emitirProjetosContemplados(entrada).catch((e) => e)

    expect(erro).toBeInstanceOf(ServiceError)
    expect(erro).toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('Nenhum projeto contemplado') })
    expect(mockRegistrar).not.toHaveBeenCalled()
    expect(mockJuntar).not.toHaveBeenCalled()
  })

  it('falha ao gerar descarta a emissão e propaga o erro, sem auditar exportação', async () => {
    mockJuntar.mockRejectedValue(new Error('storage fora do ar'))

    await expect(emitirProjetosContemplados(entrada)).rejects.toThrow('storage fora do ar')

    expect(mockDescartar).toHaveBeenCalledWith('PNAB-ABCD-2345')
    expect(mockAudit).not.toHaveBeenCalled()
  })

  it('registro de emissão que falhou não impede o PDF (sai sem código)', async () => {
    mockRegistrar.mockResolvedValue(null)

    const res = await emitirProjetosContemplados(entrada)

    expect(res.emissao).toBeNull()
    expect(mockGerar.mock.calls.every(([dados]) => dados.emissao === null)).toBe(true)
    expect(mockDescartar).not.toHaveBeenCalled()
  })
})
