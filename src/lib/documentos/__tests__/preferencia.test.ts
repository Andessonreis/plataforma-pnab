import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { templatePreferido, TIPOS_COM_TEMPLATE } from '../preferencia'

vi.mock('@/lib/db', () => ({ prisma: { documentoEmitido: { findFirst: vi.fn() } } }))

const findFirst = vi.mocked(prisma.documentoEmitido.findFirst)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TIPOS_COM_TEMPLATE', () => {
  it('cobre os cinco documentos que existem nas duas versões', () => {
    expect([...TIPOS_COM_TEMPLATE]).toEqual([
      'LISTA_INSCRICOES', 'LISTA_AGENTES', 'CLASSIFICACAO', 'RELATORIO_FINAL', 'RELATORIO_RECURSOS',
    ])
  })
})

describe('templatePreferido', () => {
  it('usa a última emissão da pessoa naquele edital', async () => {
    findFirst.mockResolvedValueOnce({ template: 1 } as never)

    await expect(templatePreferido('user-1', 'ed-1')).resolves.toBe(1)

    expect(findFirst).toHaveBeenCalledTimes(1)
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        emitidoPorId: 'user-1',
        tipo: { in: [...TIPOS_COM_TEMPLATE] },
        editalId: 'ed-1',
      },
      orderBy: { emitidoEm: 'desc' },
      select: { template: true },
    })
  })

  it('sem histórico no edital, cai na última emissão de qualquer edital', async () => {
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ template: 1 } as never)

    await expect(templatePreferido('user-1', 'ed-1')).resolves.toBe(1)

    expect(findFirst).toHaveBeenCalledTimes(2)
    expect(findFirst.mock.calls[1][0]).toMatchObject({
      where: { emitidoPorId: 'user-1' },
    })
    expect(findFirst.mock.calls[1][0]?.where).not.toHaveProperty('editalId')
  })

  it('sem edital, consulta direto o histórico geral', async () => {
    findFirst.mockResolvedValueOnce({ template: 1 } as never)

    await expect(templatePreferido('user-1', null)).resolves.toBe(1)

    expect(findFirst).toHaveBeenCalledTimes(1)
    expect(findFirst.mock.calls[0][0]?.where).not.toHaveProperty('editalId')
  })

  it('sem emissão alguma, devolve o padrão do sistema', async () => {
    findFirst.mockResolvedValue(null)

    await expect(templatePreferido('user-1', 'ed-1')).resolves.toBe(2)
  })

  it('valor inválido gravado no banco não vira preferência', async () => {
    findFirst.mockResolvedValueOnce({ template: 7 } as never).mockResolvedValueOnce(null)

    await expect(templatePreferido('user-1', 'ed-1')).resolves.toBe(2)
  })

  it('falha de banco não propaga e não expõe dado da consulta', async () => {
    const erroLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    findFirst.mockRejectedValue(new Error('conexão perdida'))

    await expect(templatePreferido('user-1', 'ed-1')).resolves.toBe(2)

    expect(erroLog).toHaveBeenCalledWith({ escopo: 'templatePreferido', erro: 'conexão perdida' })
    erroLog.mockRestore()
  })
})
