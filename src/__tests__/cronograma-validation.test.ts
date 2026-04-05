import { describe, it, expect } from 'vitest'
import type { CronogramaFormItem } from '@/types/cronograma'
import {
  validateCronogramaOrder,
  cronogramaToFormItems,
  validateCronogramaOrderServer,
} from '@/lib/utils/cronograma'

// Helper para criar item de fase com ID
function faseItem(
  fase: string,
  dataHora: string,
  id?: string,
): CronogramaFormItem {
  return {
    id: id ?? `test_${fase}`,
    tipo: 'fase',
    fase: fase as CronogramaFormItem['tipo'] extends 'fase' ? typeof fase : never,
    dataHora,
    destaque: false,
  } as CronogramaFormItem
}

// Helper para criar item custom com ID
function customItem(
  label: string,
  dataHora: string,
  id?: string,
): CronogramaFormItem {
  return {
    id: id ?? `test_custom_${label}`,
    tipo: 'custom',
    label,
    dataHora,
    destaque: false,
  } as CronogramaFormItem
}

describe('validateCronogramaOrder', () => {
  it('retorna vazio quando todas as datas estão em ordem crescente', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
      faseItem('HABILITACAO', '2025-04-20T09:00'),
      faseItem('AVALIACAO', '2025-05-01T09:00'),
      faseItem('RESULTADO_PRELIMINAR', '2025-05-15T09:00'),
      faseItem('RECURSO', '2025-05-20T09:00'),
      faseItem('RESULTADO_FINAL', '2025-06-01T09:00'),
      faseItem('ENCERRADO', '2025-06-15T09:00'),
    ]
    expect(validateCronogramaOrder(items)).toEqual([])
  })

  it('detecta INSCRICOES_ENCERRADAS antes de INSCRICOES_ABERTAS', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-05T09:00'),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-04T09:00'),
    ]
    const warnings = validateCronogramaOrder(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].fase).toBe('INSCRICOES_ENCERRADAS')
    expect(warnings[0].anteriorFase).toBe('INSCRICOES_ABERTAS')
    expect(warnings[0].message).toContain('Encerramento das Inscrições')
    expect(warnings[0].message).toContain('Início das Inscrições')
  })

  it('detecta HABILITACAO antes de INSCRICOES_ENCERRADAS', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
      faseItem('HABILITACAO', '2025-04-10T09:00'),
    ]
    const warnings = validateCronogramaOrder(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].fase).toBe('HABILITACAO')
    expect(warnings[0].anteriorFase).toBe('INSCRICOES_ENCERRADAS')
  })

  it('detecta RESULTADO_FINAL antes de RESULTADO_PRELIMINAR', () => {
    const items: CronogramaFormItem[] = [
      faseItem('RESULTADO_PRELIMINAR', '2025-06-01T09:00'),
      faseItem('RECURSO', '2025-06-10T09:00'),
      faseItem('RESULTADO_FINAL', '2025-05-20T09:00'),
    ]
    const warnings = validateCronogramaOrder(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].fase).toBe('RESULTADO_FINAL')
    expect(warnings[0].anteriorFase).toBe('RECURSO')
  })

  it('retorna vazio com apenas 1 fase com data', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
    ]
    expect(validateCronogramaOrder(items)).toEqual([])
  })

  it('ignora fases sem data preenchida', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-15T09:00'),
      faseItem('INSCRICOES_ENCERRADAS', ''),
      faseItem('HABILITACAO', '2025-04-20T09:00'),
    ]
    // HABILITACAO deve ser > INSCRICOES_ABERTAS (a encerrada é ignorada por não ter data)
    expect(validateCronogramaOrder(items)).toEqual([])
  })

  it('items custom entre fases participam da validação de ordem visual', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
      customItem('Oficina', '2025-03-15T10:00'),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
    ]
    // Oficina (mar 15) está antes de Inscrições Abertas (abr 1) na ordem visual
    const warnings = validateCronogramaOrder(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('Oficina')
  })

  it('items custom em ordem cronológica correta não geram warning', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
      customItem('Oficina', '2025-04-10T10:00'),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
    ]
    expect(validateCronogramaOrder(items)).toEqual([])
  })

  it('items custom sem data são ignorados', () => {
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
      customItem('Sem data', ''),
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
    ]
    expect(validateCronogramaOrder(items)).toEqual([])
  })

  it('detecta erro quando item é arrastado para antes de outro com data anterior (ordem visual)', () => {
    // Simula: usuário tinha ABERTAS(abr1) → ENCERRADAS(abr15) e arrastou ENCERRADAS pra cima
    const items: CronogramaFormItem[] = [
      faseItem('INSCRICOES_ENCERRADAS', '2025-04-15T18:00'),
      faseItem('INSCRICOES_ABERTAS', '2025-04-01T09:00'),
    ]
    const warnings = validateCronogramaOrder(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('Início das Inscrições')
  })

  it('cronograma vazio retorna sem erros', () => {
    expect(validateCronogramaOrder([])).toEqual([])
  })
})

describe('cronogramaToFormItems', () => {
  it('gera IDs únicos para cada item', () => {
    const raw = [
      { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2025-04-01T09:00', destaque: false },
      { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2025-04-15T18:00', destaque: true },
      { tipo: 'custom', label: 'Oficina', dataHora: '2025-03-15T10:00', destaque: false },
    ]
    const items = cronogramaToFormItems(raw)
    expect(items).toHaveLength(3)

    const ids = items.map((i) => i.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(3)
  })

  it('preserva todos os campos dos items', () => {
    const raw = [
      { tipo: 'fase', fase: 'HABILITACAO', dataHora: '2025-05-01T09:00', destaque: true },
      { tipo: 'custom', label: 'Etapa Extra', dataHora: '2025-06-01T09:00', destaque: false },
    ]
    const items = cronogramaToFormItems(raw)

    const faseItem = items[0]
    expect(faseItem.tipo).toBe('fase')
    if (faseItem.tipo === 'fase') {
      expect(faseItem.fase).toBe('HABILITACAO')
    }
    expect(faseItem.dataHora).toBe('2025-05-01T09:00')
    expect(faseItem.destaque).toBe(true)
    expect(faseItem.id).toBeTruthy()

    const customItem = items[1]
    expect(customItem.tipo).toBe('custom')
    if (customItem.tipo === 'custom') {
      expect(customItem.label).toBe('Etapa Extra')
    }
    expect(customItem.dataHora).toBe('2025-06-01T09:00')
    expect(customItem.destaque).toBe(false)
    expect(customItem.id).toBeTruthy()
  })

  it('converte dados legados (sem campo tipo)', () => {
    const raw = [
      { label: 'Início das Inscrições', dataHora: '2025-04-01T09:00', destaque: false },
      { label: 'Encerramento das Inscrições', dataHora: '2025-04-15T18:00', destaque: true },
    ]
    const items = cronogramaToFormItems(raw)
    expect(items).toHaveLength(2)

    // Devem ter sido convertidos para formato novo com tipo
    expect(items[0].tipo).toBe('fase')
    if (items[0].tipo === 'fase') {
      expect(items[0].fase).toBe('INSCRICOES_ABERTAS')
    }
    expect(items[0].id).toBeTruthy()

    expect(items[1].tipo).toBe('fase')
    if (items[1].tipo === 'fase') {
      expect(items[1].fase).toBe('INSCRICOES_ENCERRADAS')
    }
  })

  it('retorna array vazio para input null/undefined/vazio', () => {
    expect(cronogramaToFormItems(null)).toEqual([])
    expect(cronogramaToFormItems(undefined)).toEqual([])
    expect(cronogramaToFormItems([])).toEqual([])
  })
})

describe('validateCronogramaOrderServer', () => {
  it('retorna erro quando fases estão fora de ordem', () => {
    const items = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS' as const, dataHora: '2025-04-05T09:00', destaque: false },
      { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS' as const, dataHora: '2025-04-04T09:00', destaque: false },
    ]
    const errors = validateCronogramaOrderServer(items)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Encerramento das Inscrições')
    expect(errors[0]).toContain('Início das Inscrições')
  })

  it('retorna vazio quando cronograma está correto', () => {
    const items = [
      { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS' as const, dataHora: '2025-04-01T09:00', destaque: false },
      { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS' as const, dataHora: '2025-04-15T18:00', destaque: false },
    ]
    expect(validateCronogramaOrderServer(items)).toEqual([])
  })
})
