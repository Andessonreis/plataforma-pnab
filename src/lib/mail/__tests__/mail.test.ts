import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../index'

describe('renderTemplate', () => {
  it('comprovante_inscricao — contém número e edital', () => {
    const html = renderTemplate('comprovante_inscricao', {
      numero: 'INS-001',
      edital: 'Edital PNAB 2025',
      url: 'http://localhost:3000/inscricoes/1',
    })
    expect(html).toContain('INS-001')
    expect(html).toContain('Edital PNAB 2025')
  })

  it('resultado_preliminar — contém link', () => {
    const html = renderTemplate('resultado_preliminar', {
      edital: 'Edital X',
      url: 'http://localhost:3000/resultados',
    })
    expect(html).toContain('http://localhost:3000/resultados')
    expect(html).toContain('Resultado Preliminar')
  })

  it('resultado_final — contém link', () => {
    const html = renderTemplate('resultado_final', {
      edital: 'Edital X',
      url: 'http://localhost:3000/resultados',
    })
    expect(html).toContain('http://localhost:3000/resultados')
    expect(html).toContain('Resultado Final')
  })

  it('habilitacao — HABILITADA contém "HABILITADA"', () => {
    const html = renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'HABILITADA',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('HABILITADA')
  })

  it('habilitacao — INABILITADA contém motivo', () => {
    const html = renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'INABILITADA',
      motivo: 'Documentação incompleta',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('INABILITADA')
    expect(html).toContain('Documentação incompleta')
  })

  it('habilitacao — INABILITADA contém aviso de recurso', () => {
    const html = renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'INABILITADA',
      motivo: 'Faltou doc',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('recurso')
  })

  it('recuperacao_senha — contém link de reset', () => {
    const html = renderTemplate('recuperacao_senha', {
      nome: 'Carlos',
      resetUrl: 'http://localhost:3000/reset?token=abc123',
    })
    expect(html).toContain('http://localhost:3000/reset?token=abc123')
    expect(html).toContain('Redefinir minha senha')
  })

  it('recurso_submetido — contém fase', () => {
    const html = renderTemplate('recurso_submetido', {
      edital: 'Edital X',
      fase: 'Habilitação',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('Habilitação')
  })

  it('recurso_decidido — contém decisão', () => {
    const html = renderTemplate('recurso_decidido', {
      edital: 'Edital X',
      decisao: 'DEFERIDO',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('DEFERIDO')
  })

  it('template desconhecido → fallback JSON', () => {
    const html = renderTemplate('inexistente' as never, { foo: 'bar' })
    expect(html).toContain('"foo"')
    expect(html).toContain('"bar"')
  })
})
