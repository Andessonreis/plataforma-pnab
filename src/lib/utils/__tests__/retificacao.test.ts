import { describe, it, expect } from 'vitest'
import {
  aplicarRetificacao,
  marcosEditaveis,
  parseRetificacoes,
  removerRetificacao,
  retificacaoVigente,
  retificacoesOrdenadas,
  reverterRetificacao,
} from '../retificacao'
import { parseCronograma } from '../cronograma'
import type { CronogramaItem } from '@/types/cronograma'

// Recorte do Festival de Arte e Cultura: encerramento de inscrições, a
// publicação que vem logo depois e a janela de recursos com fim explícito.
const CRONOGRAMA: CronogramaItem[] = [
  { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-08-01T00:00:00' },
  { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-08-27T23:59:00' },
  { tipo: 'custom', label: 'Publicação dos Inscritos', dataHora: '2026-08-28T00:00:00' },
  {
    tipo: 'custom',
    label: 'Período para recursos — inscrições',
    dataHora: '2026-08-31T00:00:00',
    fimEm: '2026-09-02T23:59:00',
    acao: 'RECURSO_EDITAL_JANELA',
  },
]

describe('aplicarRetificacao', () => {
  it('grava a data nova e guarda a anterior no marco alterado', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
    ])

    expect(novo[1].dataHora).toBe('2026-09-02T23:59:00')
    expect(novo[1].retificado).toEqual({
      dataHoraAnterior: '2026-08-27T23:59:00',
      retificacaoNumero: '01',
    })
  })

  it('não toca nos marcos fora da retificação', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
    ])

    expect(novo[0]).toEqual(CRONOGRAMA[0])
    expect(novo[2]).toEqual(CRONOGRAMA[2])
    expect(novo[3]).toEqual(CRONOGRAMA[3])
  })

  it('guarda também o fim anterior quando o marco é um período', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 3, dataHora: '2026-09-06T00:00:00', fimEm: '2026-09-08T23:59:00' },
    ])

    expect(novo[3]).toMatchObject({
      dataHora: '2026-09-06T00:00:00',
      fimEm: '2026-09-08T23:59:00',
      acao: 'RECURSO_EDITAL_JANELA',
      retificado: {
        dataHoraAnterior: '2026-08-31T00:00:00',
        fimEmAnterior: '2026-09-02T23:59:00',
        retificacaoNumero: '01',
      },
    })
  })

  it('ignora marco cuja data nova é igual à atual — não risca data por nada', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-08-27T23:59:00' },
    ])

    expect(novo[1].retificado).toBeUndefined()
  })

  it('segunda retificação sobre o mesmo marco guarda o valor imediatamente anterior', () => {
    const primeira = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
    ])
    const segunda = aplicarRetificacao(primeira, '02', [
      { indice: 1, dataHora: '2026-09-10T23:59:00' },
    ])

    expect(segunda[1].retificado).toEqual({
      dataHoraAnterior: '2026-09-02T23:59:00',
      retificacaoNumero: '02',
    })
  })
})

describe('reverterRetificacao', () => {
  it('devolve o cronograma ao estado exato de antes do ato', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
      { indice: 3, dataHora: '2026-09-06T00:00:00', fimEm: '2026-09-08T23:59:00' },
    ])

    expect(reverterRetificacao(novo, '01')).toEqual(CRONOGRAMA)
  })

  it('desfaz só os marcos do ato informado', () => {
    const primeira = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
    ])
    const segunda = aplicarRetificacao(primeira, '02', [
      { indice: 2, dataHora: '2026-09-03T00:00:00' },
    ])

    const revertida = reverterRetificacao(segunda, '02')
    expect(revertida[2].dataHora).toBe('2026-08-28T00:00:00')
    expect(revertida[1].dataHora).toBe('2026-09-02T23:59:00')
    expect(revertida[1].retificado?.retificacaoNumero).toBe('01')
  })

  it('número inexistente não altera nada', () => {
    expect(reverterRetificacao(CRONOGRAMA, '99')).toEqual(CRONOGRAMA)
  })
})

describe('parseRetificacoes', () => {
  const valida = {
    numero: '01',
    publicadoEm: '2026-08-28',
    resumo: 'Prazo prorrogado até 2 de setembro.',
    registradoEm: '2026-08-28T10:00:00.000Z',
  }

  it('aceita array, string JSON e descarta o resto', () => {
    expect(parseRetificacoes([valida])).toHaveLength(1)
    expect(parseRetificacoes(JSON.stringify([valida]))).toHaveLength(1)
    expect(parseRetificacoes(null)).toEqual([])
    expect(parseRetificacoes('não é json')).toEqual([])
    expect(parseRetificacoes([{ numero: '01' }])).toEqual([])
  })

  it('vigente e ordenadas usam a data do Diário, não a ordem de gravação', () => {
    const antiga = { ...valida, numero: '01', publicadoEm: '2026-08-28' }
    const nova = { ...valida, numero: '02', publicadoEm: '2026-09-05' }

    expect(retificacaoVigente([antiga, nova])?.numero).toBe('02')
    expect(retificacaoVigente([nova, antiga])?.numero).toBe('02')
    expect(retificacoesOrdenadas([antiga, nova]).map((r) => r.numero)).toEqual(['02', '01'])
    expect(retificacaoVigente([])).toBeNull()
  })

  it('removerRetificacao tira só o número pedido', () => {
    const outra = { ...valida, numero: '02' }
    expect(removerRetificacao([valida, outra], '01').map((r) => r.numero)).toEqual(['02'])
  })
})

describe('marcosEditaveis', () => {
  it('usa os mesmos índices que aplicarRetificacao', () => {
    const marcos = marcosEditaveis(CRONOGRAMA)
    const alvo = marcos.find((m) => m.label === 'Publicação dos Inscritos')

    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: alvo!.indice, dataHora: '2026-09-03T00:00:00' },
    ])

    expect(novo[alvo!.indice]).toMatchObject({ label: 'Publicação dos Inscritos' })
    expect(novo[alvo!.indice].dataHora).toBe('2026-09-03T00:00:00')
  })

  it('traduz fase em rótulo legível e sinaliza marco já retificado', () => {
    const retificado = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
    ])
    const marcos = marcosEditaveis(retificado)

    expect(marcos[1].label).not.toBe('INSCRICOES_ENCERRADAS')
    expect(marcos[1].retificadoPor).toBe('01')
    expect(marcos[0].retificadoPor).toBeUndefined()
  })
})

describe('integração com o cronograma público', () => {
  it('parseCronograma leva o carimbo até a página — é o que desenha o risco', () => {
    const novo = aplicarRetificacao(CRONOGRAMA, '01', [
      { indice: 1, dataHora: '2026-09-02T23:59:00' },
      { indice: 3, dataHora: '2026-09-06T00:00:00', fimEm: '2026-09-08T23:59:00' },
    ])
    const exibicao = parseCronograma(novo)

    expect(exibicao[1].retificado?.dataHoraAnterior).toBe('2026-08-27T23:59:00')
    expect(exibicao[3].retificado?.fimEmAnterior).toBe('2026-09-02T23:59:00')
    expect(exibicao[0].retificado).toBeUndefined()
  })
})
