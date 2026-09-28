import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { avisarProponentesDoResultado } from '@/lib/results/avisar-resultado'
import { montarClassificacao, type CategoriaClassificada } from '@/lib/results/classificacao'
import { guardarResultadoPreliminar } from '@/lib/results/resultado-publico'
import { publicarResultadoPreliminar } from '../publicar-preliminar.service'
import { ServiceError } from '../errors'

vi.mock('@/lib/results/classificacao', () => ({ montarClassificacao: vi.fn() }))
vi.mock('@/lib/results/avisar-resultado', () => ({ avisarProponentesDoResultado: vi.fn() }))
vi.mock('@/lib/results/resultado-publico', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/results/resultado-publico')>()),
  guardarResultadoPreliminar: vi.fn(),
}))

const mockEdital = vi.mocked(prisma.edital.findUnique)
const mockSemNota = vi.mocked(prisma.inscricao.findMany)
const mockTransacao = vi.mocked(prisma.$transaction)
const mockClassificacao = vi.mocked(montarClassificacao)
const mockCongelar = vi.mocked(guardarResultadoPreliminar)
const mockAvisar = vi.mocked(avisarProponentesDoResultado)
const mockAudit = vi.mocked(logAudit)

const CRONOGRAMA = [
  { tipo: 'custom', label: 'Publicação dos Projetos Selecionados', dataHora: '2026-09-28T00:00:00' },
  { tipo: 'custom', label: 'Período para recursos — seleção', dataHora: '2026-09-29T00:00:00', fimEm: '2026-09-30T23:59:00' },
]

const EDITAL = {
  id: 'ed-1', titulo: 'Premiação Mestres', slug: 'mestres-2026', status: 'AVALIACAO', cronograma: CRONOGRAMA,
  vagasSuplentes: null, notaMinima: 10, categoriasConfig: null, resultadoTemplate: null,
  resultadoPreliminar: null, resultadoPreliminarPublicadoEm: null,
}

function linha(numero: string, posicao: number, status: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA', nota: number) {
  return {
    inscricaoId: `id-${numero}`, numero, proponenteNome: 'Ana', posicao, notaBase: nota, notaBonus: 0, notaFinal: nota,
    cotista: false, bonusItens: [], status, finalizadas: 3, atribuidos: 3, empatado: false, semAvaliacao: false,
  }
}

function categoria(linhas: ReturnType<typeof linha>[]): CategoriaClassificada {
  return { nome: 'Mestres', vagasAmplaConcorrencia: 3, cotas: [], valorPorProjeto: 10000, linhas }
}

const entrada = { editalId: 'ed-1', userId: 'admin-1', ip: '10.0.0.1' }

describe('publicarResultadoPreliminar', () => {
  const tx = { inscricao: { update: vi.fn() }, edital: { update: vi.fn() } }
  let ordem: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    ordem = []
    mockEdital.mockResolvedValue(EDITAL as never)
    mockSemNota.mockResolvedValue([])
    mockClassificacao.mockResolvedValue([categoria([
      linha('PNAB-2026-0001', 1, 'CONTEMPLADA', 29.17),
      linha('PNAB-2026-0002', 2, 'SUPLENTE', 26.67),
      linha('PNAB-2026-0003', 3, 'NAO_CONTEMPLADA', 8),
    ])])
    mockTransacao.mockImplementation((async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)) as never)
    tx.inscricao.update.mockImplementation((async () => { ordem.push('inscricao') }) as never)
    tx.edital.update.mockImplementation((async () => { ordem.push('edital') }) as never)
    mockCongelar.mockImplementation((async () => { ordem.push('congelar') }) as never)
  })

  it('edital inexistente → NOT_FOUND', async () => {
    mockEdital.mockResolvedValue(null)

    await expect(publicarResultadoPreliminar(entrada)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it.each(['RESULTADO_FINAL', 'ENCERRADO', 'PUBLICADO'])('fora da fase de publicar (%s) → BAD_REQUEST', async (status) => {
    mockEdital.mockResolvedValue({ ...EDITAL, status } as never)

    await expect(publicarResultadoPreliminar(entrada)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockTransacao).not.toHaveBeenCalled()
  })

  it('preliminar já publicado → CONFLICT, sem gravar nada', async () => {
    mockEdital.mockResolvedValue({ ...EDITAL, resultadoPreliminarPublicadoEm: new Date() } as never)

    await expect(publicarResultadoPreliminar(entrada)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(mockTransacao).not.toHaveBeenCalled()
  })

  it('lista já congelada, mesmo sem a data de publicação → CONFLICT', async () => {
    mockEdital.mockResolvedValue({
      ...EDITAL, resultadoPreliminar: { publicadoEm: '2026-09-22T17:16:50.358Z', linhas: [] },
    } as never)

    await expect(publicarResultadoPreliminar(entrada)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('inscrição sem avaliação finalizada → BAD_REQUEST com os números, sem gravar', async () => {
    mockSemNota.mockResolvedValue([{ numero: 'PNAB-2026-0007' }, { numero: 'PNAB-2026-0009' }] as never)

    const erro = await publicarResultadoPreliminar(entrada).catch((e) => e)

    expect(erro).toBeInstanceOf(ServiceError)
    expect(erro.code).toBe('BAD_REQUEST')
    expect(erro.message).toContain('PNAB-2026-0007, PNAB-2026-0009')
    expect(mockSemNota).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        editalId: 'ed-1', status: { in: ['HABILITADA', 'EM_AVALIACAO'] }, avaliacoes: { none: { finalizada: true } },
      }),
    }))
    expect(mockTransacao).not.toHaveBeenCalled()
  })

  it('a mensagem de avaliações pendentes mostra até 10 números e conta o resto', async () => {
    mockSemNota.mockResolvedValue(Array.from({ length: 13 }, (_, i) => ({ numero: `N${i}` })) as never)

    const erro = await publicarResultadoPreliminar(entrada).catch((e) => e)

    expect(erro.message).toContain('N9')
    expect(erro.message).not.toContain('N10')
    expect(erro.message).toContain('e mais 3')
  })

  it('classificação vazia → BAD_REQUEST', async () => {
    mockClassificacao.mockResolvedValue([])

    await expect(publicarResultadoPreliminar(entrada)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('classifica com a bonificação, como a publicação oficial', async () => {
    await publicarResultadoPreliminar(entrada)

    expect(mockClassificacao).toHaveBeenCalledWith('ed-1', expect.objectContaining({ incluirBonus: true, notaMinima: 10 }))
  })

  it('grava nota, bônus, posição e situação de cada inscrição', async () => {
    await publicarResultadoPreliminar(entrada)

    expect(tx.inscricao.update).toHaveBeenCalledTimes(3)
    expect(tx.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'id-PNAB-2026-0002' },
      data: { notaFinal: 26.67, notaBonus: 0, posicao: 2, status: 'SUPLENTE' },
    })
    expect(tx.inscricao.update).toHaveBeenCalledWith({
      where: { id: 'id-PNAB-2026-0003' },
      data: { notaFinal: 8, notaBonus: 0, posicao: 3, status: 'NAO_CONTEMPLADA' },
    })
  })

  it('congela a lista depois de gravar as inscrições e antes de mudar o edital, na mesma transação', async () => {
    await publicarResultadoPreliminar(entrada)

    expect(ordem).toEqual(['inscricao', 'inscricao', 'inscricao', 'congelar', 'edital'])
    expect(mockCongelar).toHaveBeenCalledWith('ed-1', expect.any(Date), tx)
  })

  it('leva o edital ao preliminar, marca o momento da publicação e liga o cronograma', async () => {
    await publicarResultadoPreliminar(entrada)

    const [{ data }] = tx.edital.update.mock.calls[0] as [{ data: Record<string, unknown> }]
    expect(data.status).toBe('RESULTADO_PRELIMINAR')
    expect(data.resultadoPreliminarPublicadoEm).toBe(mockCongelar.mock.calls[0][1])
    expect((data.cronograma as Array<Record<string, unknown>>).map((m) => m.acao)).toEqual([
      'PUBLICACAO_RESULTADO_PRELIMINAR', 'RECURSO_RESULTADO_FINAL_JANELA',
    ])
  })

  it('devolve os totais por situação', async () => {
    const publicado = await publicarResultadoPreliminar(entrada)

    expect(publicado).toEqual({ total: 3, contempladas: 1, suplentes: 1, naoContempladas: 1, hasEmpates: false, avisos: [] })
  })

  it('não mexe em inscrição que o template deixa fora da classificação', async () => {
    mockEdital.mockResolvedValue({ ...EDITAL, resultadoTemplate: { foraDaClassificacao: ['PNAB-2026-0003'] } } as never)

    const publicado = await publicarResultadoPreliminar(entrada)

    expect(tx.inscricao.update).toHaveBeenCalledTimes(2)
    expect(tx.inscricao.update).not.toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'id-PNAB-2026-0003' } }))
    expect(publicado.total).toBe(2)
  })

  it('sem os marcos no cronograma publica mesmo assim e devolve os avisos', async () => {
    mockEdital.mockResolvedValue({ ...EDITAL, cronograma: [] } as never)

    const publicado = await publicarResultadoPreliminar(entrada)

    expect(publicado.avisos).toHaveLength(2)
    expect(tx.edital.update).toHaveBeenCalled()
  })

  it('cronograma que não é lista não é regravado', async () => {
    mockEdital.mockResolvedValue({ ...EDITAL, cronograma: null } as never)

    await publicarResultadoPreliminar(entrada)

    const [{ data }] = tx.edital.update.mock.calls[0] as [{ data: Record<string, unknown> }]
    expect(data).not.toHaveProperty('cronograma')
  })

  it('por padrão não envia e-mail, e registra isso na auditoria', async () => {
    await publicarResultadoPreliminar(entrada)

    expect(mockAvisar).not.toHaveBeenCalled()
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'admin-1', action: 'RESULTADO_PRELIMINAR_PUBLICADO', entity: 'Edital', entityId: 'ed-1', ip: '10.0.0.1',
      details: expect.objectContaining({ totalInscrições: 3, contempladas: 1, suplentes: 1, naoContempladas: 1, avisouPorEmail: false }),
    }))
  })

  it('com avisarPorEmail, avisa cada proponente classificado com o assunto de preliminar', async () => {
    await publicarResultadoPreliminar({ ...entrada, avisarPorEmail: true })

    expect(mockAvisar).toHaveBeenCalledWith({
      inscricaoIds: ['id-PNAB-2026-0001', 'id-PNAB-2026-0002', 'id-PNAB-2026-0003'],
      editalTitulo: 'Premiação Mestres', slug: 'mestres-2026', final: false,
    })
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ details: expect.objectContaining({ avisouPorEmail: true }) }))
  })

  it('falha ao gravar propaga o erro e não audita nem avisa ninguém', async () => {
    tx.inscricao.update.mockRejectedValueOnce(new Error('deadlock'))

    await expect(publicarResultadoPreliminar({ ...entrada, avisarPorEmail: true })).rejects.toThrow('deadlock')
    expect(mockAudit).not.toHaveBeenCalled()
    expect(mockAvisar).not.toHaveBeenCalled()
  })

  it('a transação tem prazo folgado para lotes grandes', async () => {
    await publicarResultadoPreliminar(entrada)

    expect(mockTransacao).toHaveBeenCalledWith(expect.any(Function), { timeout: 60_000 })
  })
})
