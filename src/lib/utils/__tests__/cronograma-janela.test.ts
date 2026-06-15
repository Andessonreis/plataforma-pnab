import { describe, it, expect } from 'vitest'
import {
  janelaAtiva,
  janelaParaAcao,
  mensagemJanela,
} from '../cronograma-janela'
import type { CronogramaItem } from '@shared/types/cronograma'

const makeJanela = (
  acao: 'RECURSO_HABILITACAO_JANELA' | 'RECURSO_RESULTADO_JANELA',
  inicio: string,
  fim?: string,
): CronogramaItem => ({
  tipo: 'custom',
  label: 'Janela teste',
  dataHora: inicio,
  ...(fim ? { fimEm: fim } : {}),
  acao,
})

describe('janelaAtiva', () => {
  const cronograma: CronogramaItem[] = [
    { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-05-08T00:00' },
    makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59'),
  ]

  it('retorna true quando agora está dentro da janela', () => {
    const now = new Date('2026-05-28T12:00:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_HABILITACAO_JANELA', now)).toBe(true)
  })

  it('retorna false antes do início da janela', () => {
    const now = new Date('2026-05-26T12:00:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_HABILITACAO_JANELA', now)).toBe(false)
  })

  it('retorna false depois do fim da janela', () => {
    const now = new Date('2026-05-30T12:00:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_HABILITACAO_JANELA', now)).toBe(false)
  })

  it('retorna false para ação sem item no cronograma', () => {
    const now = new Date('2026-05-28T12:00:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_RESULTADO_JANELA', now)).toBe(false)
  })

  it('aceita exato no início da janela', () => {
    const now = new Date('2026-05-27T00:00:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_HABILITACAO_JANELA', now)).toBe(true)
  })

  it('aceita exato no fim da janela', () => {
    const now = new Date('2026-05-29T23:59:00-03:00')
    expect(janelaAtiva(cronograma, 'RECURSO_HABILITACAO_JANELA', now)).toBe(true)
  })

  it('ignora items custom sem acao', () => {
    const items: CronogramaItem[] = [
      { tipo: 'custom', label: 'só info', dataHora: '2026-05-27T00:00', fimEm: '2026-05-29T23:59' },
    ]
    expect(janelaAtiva(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))).toBe(false)
  })

  it('ignora items fase (acao só vale em custom)', () => {
    const items: CronogramaItem[] = [
      { tipo: 'fase', fase: 'RECURSO', dataHora: '2026-05-27T00:00' },
    ]
    expect(janelaAtiva(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))).toBe(false)
  })

  it('múltiplas janelas: usa a ativa', () => {
    const items: CronogramaItem[] = [
      makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-01T00:00', '2026-05-03T23:59'),
      makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59'),
    ]
    expect(janelaAtiva(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))).toBe(true)
    expect(janelaAtiva(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-04T12:00:00-03:00'))).toBe(false)
  })

  it('aceita formato JSON string', () => {
    const json = JSON.stringify(cronograma)
    expect(janelaAtiva(json, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))).toBe(true)
  })

  it('aceita formato legado sem field tipo', () => {
    // Items legados não têm acao — sempre false
    const legacy = [{ label: 'qualquer', dataHora: '2026-05-27' }]
    expect(janelaAtiva(legacy, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))).toBe(false)
  })
})

describe('janelaParaAcao', () => {
  it('retorna info detalhada da janela ativa', () => {
    const items = [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')]
    const info = janelaParaAcao(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-28T12:00:00-03:00'))
    expect(info?.ativa).toBe(true)
    expect(info?.status).toBe('ativa')
  })

  it('status="antes" quando janela é futura', () => {
    const items = [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')]
    const info = janelaParaAcao(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-20T00:00:00-03:00'))
    expect(info?.status).toBe('antes')
    expect(info?.ativa).toBe(false)
  })

  it('status="depois" quando todas as janelas já passaram', () => {
    const items = [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')]
    const info = janelaParaAcao(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-06-15T00:00:00-03:00'))
    expect(info?.status).toBe('depois')
    expect(info?.ativa).toBe(false)
  })

  it('retorna null quando ação não existe no cronograma', () => {
    const items = [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')]
    expect(janelaParaAcao(items, 'RECURSO_RESULTADO_JANELA', new Date())).toBeNull()
  })

  it('com 2 janelas futuras, escolhe a mais próxima', () => {
    const items: CronogramaItem[] = [
      makeJanela('RECURSO_HABILITACAO_JANELA', '2026-08-01T00:00', '2026-08-03T23:59'),
      makeJanela('RECURSO_HABILITACAO_JANELA', '2026-06-01T00:00', '2026-06-03T23:59'),
    ]
    const info = janelaParaAcao(items, 'RECURSO_HABILITACAO_JANELA', new Date('2026-05-15T00:00:00-03:00'))
    expect(info?.inicio.toISOString()).toContain('2026-06-01')
  })
})

describe('mensagemJanela', () => {
  it('janela ativa com fim → "Período aberto até DD/MM"', () => {
    const info = janelaParaAcao(
      [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')],
      'RECURSO_HABILITACAO_JANELA',
      new Date('2026-05-28T12:00:00-03:00'),
    )
    expect(info).not.toBeNull()
    expect(mensagemJanela(info!)).toContain('aberto até')
    expect(mensagemJanela(info!)).toContain('29/05/2026')
  })

  it('janela futura → "Período abre em DD/MM"', () => {
    const info = janelaParaAcao(
      [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')],
      'RECURSO_HABILITACAO_JANELA',
      new Date('2026-05-20T00:00:00-03:00'),
    )
    expect(mensagemJanela(info!)).toContain('abre em')
    expect(mensagemJanela(info!)).toContain('27/05/2026')
  })

  it('janela passada → "Período encerrou em DD/MM"', () => {
    const info = janelaParaAcao(
      [makeJanela('RECURSO_HABILITACAO_JANELA', '2026-05-27T00:00', '2026-05-29T23:59')],
      'RECURSO_HABILITACAO_JANELA',
      new Date('2026-06-15T00:00:00-03:00'),
    )
    expect(mensagemJanela(info!)).toContain('encerrou em')
    expect(mensagemJanela(info!)).toContain('29/05/2026')
  })
})
