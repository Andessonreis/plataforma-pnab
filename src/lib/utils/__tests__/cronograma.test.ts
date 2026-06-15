import { describe, it, expect } from 'vitest'
import {
  isFaseCompleted,
  isFaseCurrent,
  parseCronograma,
  getCronogramaItemStatus,
} from '../cronograma'
import type { CronogramaDisplayItem } from '@shared/types/cronograma'

describe('isFaseCompleted', () => {
  it('fase anterior ao status atual → true', () => {
    expect(isFaseCompleted('PUBLICADO', 'INSCRICOES_ABERTAS')).toBe(true)
    expect(isFaseCompleted('INSCRICOES_ABERTAS', 'HABILITACAO')).toBe(true)
    expect(isFaseCompleted('AVALIACAO', 'RESULTADO_FINAL')).toBe(true)
  })

  it('fase igual ao status atual → false (em andamento, não concluída)', () => {
    expect(isFaseCompleted('INSCRICOES_ABERTAS', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCompleted('HABILITACAO', 'HABILITACAO')).toBe(false)
    expect(isFaseCompleted('AVALIACAO', 'AVALIACAO')).toBe(false)
  })

  it('ENCERRADO é terminal — concluído quando edital está ENCERRADO', () => {
    expect(isFaseCompleted('ENCERRADO', 'ENCERRADO')).toBe(true)
  })

  it('fase posterior ao status atual → false', () => {
    expect(isFaseCompleted('RESULTADO_FINAL', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCompleted('ENCERRADO', 'HABILITACAO')).toBe(false)
  })

  it('status desconhecido → false', () => {
    expect(isFaseCompleted('INVALIDO' as never, 'PUBLICADO')).toBe(false)
    expect(isFaseCompleted('PUBLICADO', 'INVALIDO' as never)).toBe(false)
  })
})

describe('isFaseCurrent', () => {
  it('fase igual ao status atual → true', () => {
    expect(isFaseCurrent('INSCRICOES_ABERTAS', 'INSCRICOES_ABERTAS')).toBe(true)
    expect(isFaseCurrent('HABILITACAO', 'HABILITACAO')).toBe(true)
    expect(isFaseCurrent('AVALIACAO', 'AVALIACAO')).toBe(true)
    expect(isFaseCurrent('RECURSO', 'RECURSO')).toBe(true)
  })

  it('ENCERRADO nunca é "em andamento" — é estado terminal', () => {
    expect(isFaseCurrent('ENCERRADO', 'ENCERRADO')).toBe(false)
  })

  it('fase diferente do status atual → false', () => {
    expect(isFaseCurrent('PUBLICADO', 'INSCRICOES_ABERTAS')).toBe(false)
    expect(isFaseCurrent('RESULTADO_FINAL', 'HABILITACAO')).toBe(false)
  })

  it('status desconhecido → false', () => {
    expect(isFaseCurrent('INVALIDO' as never, 'PUBLICADO')).toBe(false)
  })
})

describe('parseCronograma', () => {
  it('item com tipo "fase" recebe a fase declarada', () => {
    const result = parseCronograma([
      { tipo: 'fase', fase: 'HABILITACAO', dataHora: '23/05/2026 00:00' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.fase).toBe('HABILITACAO')
  })

  it('item custom NÃO recebe fase por fuzzy match no label — bug do "Prazo para recurso da habilitação"', () => {
    // O label contém a palavra "habilitação", mas o admin marcou como custom.
    // Antes do fix, isso casava com o pattern 'habilitacao' e o item era tratado
    // como a fase HABILITACAO, ficando "Em andamento" junto com a fase real.
    const result = parseCronograma([
      { tipo: 'fase', fase: 'HABILITACAO', dataHora: '23/05/2026 00:00' },
      {
        tipo: 'custom',
        label: 'Prazo para recurso da habilitação',
        dataHora: '27/05/2026 00:00',
        fimEm: '29/05/2026 23:59',
      },
    ])
    expect(result).toHaveLength(2)
    expect(result[0]?.fase).toBe('HABILITACAO')
    expect(result[1]?.fase).toBeUndefined()
    expect(result[1]?.label).toBe('Prazo para recurso da habilitação')
    expect(result[1]?.fimEm).toBe('29/05/2026 23:59')
  })

  it('item custom com label sem keyword de fase também não recebe fase', () => {
    const result = parseCronograma([
      { tipo: 'custom', label: 'Convocação de suplente (SH)', dataHora: '30/06/2026 09:00' },
    ])
    expect(result[0]?.fase).toBeUndefined()
  })

  it('outros labels custom com keywords ambíguas — sem fase inferida', () => {
    const result = parseCronograma([
      { tipo: 'custom', label: 'Prazo para recurso da avaliação', dataHora: '09/06/2026 00:00' },
      { tipo: 'custom', label: 'Publicação dos habilitados após recursos', dataHora: '01/06/2026 09:00' },
    ])
    expect(result[0]?.fase).toBeUndefined()
    expect(result[1]?.fase).toBeUndefined()
  })

  it('formato legado (sem campo tipo) — fuzzy match preserva comportamento', () => {
    const result = parseCronograma([
      { label: 'Início da Habilitação', dataHora: '23/05/2026 00:00' },
    ])
    expect(result[0]?.fase).toBe('HABILITACAO')
  })

  it('filtra item PUBLICADO do banco — a data real vem de publishedAt', () => {
    const result = parseCronograma([
      { tipo: 'fase', fase: 'PUBLICADO', dataHora: '10/04/2026 07:56' },
      { tipo: 'fase', fase: 'HABILITACAO', dataHora: '23/05/2026 00:00' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.fase).toBe('HABILITACAO')
  })
})

describe('getCronogramaItemStatus', () => {
  // Cronograma do edital real que motivou o fix (Cultura Viva Irecê 2026).
  // Reproduz a situação: status HABILITACAO no banco, mas o próximo marco
  // (Publicação da lista de inscritos) já começou — fase deve aparecer "past".
  const items: CronogramaDisplayItem[] = [
    { label: 'Inscrições abertas', dataHora: '2026-05-08T00:00', fase: 'INSCRICOES_ABERTAS' },
    { label: 'Inscrições encerradas', dataHora: '2026-05-22T23:59', fase: 'INSCRICOES_ENCERRADAS' },
    { label: 'Habilitação', dataHora: '2026-05-23T00:00', fase: 'HABILITACAO' },
    { label: 'Publicação da lista de inscritos', dataHora: '2026-05-25T09:00' },
    { label: 'Recurso da habilitação', dataHora: '2026-05-27T00:00', fimEm: '2026-05-29T23:59' },
    { label: 'Avaliação', dataHora: '2026-06-02T00:00', fase: 'AVALIACAO' },
    { label: 'Encerramento', dataHora: '2026-07-08T23:59', fase: 'ENCERRADO' },
  ]

  // Helper: 25/05/2026 às 12h BRT (= 15h UTC). Já passou da Publicação (09:00).
  const now = new Date('2026-05-25T15:00:00Z')

  it('items anteriores ao marco atual → past', () => {
    expect(getCronogramaItemStatus(items, 0, now)).toBe('past')
    expect(getCronogramaItemStatus(items, 1, now)).toBe('past')
  })

  it('fase Habilitação fica past porque o próximo marco (Publicação) já começou', () => {
    expect(getCronogramaItemStatus(items, 2, now)).toBe('past')
  })

  it('item custom é current entre sua data e a do próximo item', () => {
    expect(getCronogramaItemStatus(items, 3, now)).toBe('current')
  })

  it('item com fimEm — antes da data', () => {
    const t = new Date('2026-05-26T15:00:00Z')
    expect(getCronogramaItemStatus(items, 4, t)).toBe('future')
  })

  it('item com fimEm — dentro da janela', () => {
    const t = new Date('2026-05-28T12:00:00Z')
    expect(getCronogramaItemStatus(items, 4, t)).toBe('current')
  })

  it('item com fimEm — depois do fim', () => {
    const t = new Date('2026-05-30T12:00:00Z')
    expect(getCronogramaItemStatus(items, 4, t)).toBe('past')
  })

  it('items futuros → future', () => {
    expect(getCronogramaItemStatus(items, 5, now)).toBe('future')
    expect(getCronogramaItemStatus(items, 6, now)).toBe('future')
  })

  it('último item (ENCERRADO) — past assim que a data passa, nunca fica current indefinidamente', () => {
    const apos = new Date('2026-07-09T03:00:00Z')
    expect(getCronogramaItemStatus(items, 6, apos)).toBe('past')
  })

  it('item sem fimEm vira current entre sua data e o próximo item', () => {
    const tHabilitacao = new Date('2026-05-23T12:00:00Z')
    expect(getCronogramaItemStatus(items, 2, tHabilitacao)).toBe('current')
  })

  it('dataHora inválida → future (defensivo)', () => {
    const bad: CronogramaDisplayItem[] = [{ label: 'X', dataHora: 'inválido' }]
    expect(getCronogramaItemStatus(bad, 0, now)).toBe('future')
  })

  it('index fora do range → future', () => {
    expect(getCronogramaItemStatus(items, 99, now)).toBe('future')
  })
})
