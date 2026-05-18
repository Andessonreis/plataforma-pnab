import { describe, expect, it } from 'vitest'
import { defaultSubjectFor, renderTemplate } from '../index'

describe('renderTemplate', () => {
  it('comprovante_inscricao — html contém número e edital', async () => {
    const { html, text } = await renderTemplate('comprovante_inscricao', {
      numero: 'INS-001',
      edital: 'Edital PNAB 2025',
      url: 'http://localhost:3000/inscricoes/1',
    })
    expect(html).toContain('INS-001')
    expect(html).toContain('Edital PNAB 2025')
    expect(html).toContain('http://localhost:3000/inscricoes/1')
    expect(text).toContain('INS-001')
  })

  it('resultado_preliminar — contém heading e link', async () => {
    const { html } = await renderTemplate('resultado_preliminar', {
      edital: 'Edital X',
      url: 'http://localhost:3000/resultados',
    })
    expect(html).toContain('Resultado preliminar publicado')
    expect(html).toContain('http://localhost:3000/resultados')
  })

  it('resultado_final — contém heading e link', async () => {
    const { html } = await renderTemplate('resultado_final', {
      edital: 'Edital X',
      url: 'http://localhost:3000/resultados',
    })
    expect(html).toContain('Resultado final publicado')
    expect(html).toContain('http://localhost:3000/resultados')
  })

  it('habilitacao — HABILITADA contém status', async () => {
    const { html } = await renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'HABILITADA',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('HABILITADA')
  })

  it('habilitacao — INABILITADA contém motivo', async () => {
    const { html } = await renderTemplate('habilitacao', {
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

  it('habilitacao — INABILITADA contém aviso de recurso', async () => {
    const { html } = await renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'INABILITADA',
      motivo: 'Faltou doc',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('recurso')
  })

  it('habilitacao — normaliza resultado case-insensitive (habilitada minúsculo)', async () => {
    const { html } = await renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      // Caller passou minúsculo — não pode virar INABILITADA por engano.
      resultado: 'habilitada' as 'HABILITADA',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('HABILITADA')
    // Bloco amarelo de inabilitação NÃO deve aparecer.
    expect(html).not.toContain('Motivo da inabilitação')
  })

  it('habilitacao — valor inesperado não mostra bloco amarelo nem classifica como INABILITADA', async () => {
    const { html } = await renderTemplate('habilitacao', {
      nome: 'Ana',
      numero: 'INS-001',
      edital: 'Edital X',
      resultado: 'EM_ANALISE' as 'HABILITADA',
      motivo: 'qualquer coisa',
      url: 'http://localhost:3000',
    })
    expect(html).not.toContain('Motivo da inabilitação')
    expect(html).toContain('EM_ANALISE')
  })

  it('recuperacao_senha — contém link de reset', async () => {
    const { html } = await renderTemplate('recuperacao_senha', {
      nome: 'Carlos',
      resetUrl: 'http://localhost:3000/reset?token=abc123',
    })
    expect(html).toContain('http://localhost:3000/reset?token=abc123')
    expect(html).toContain('Redefinir minha senha')
  })

  it('recurso_submetido — contém fase', async () => {
    const { html } = await renderTemplate('recurso_submetido', {
      edital: 'Edital X',
      fase: 'Habilitação',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('Habilitação')
  })

  it('recurso_decidido — contém decisão', async () => {
    const { html } = await renderTemplate('recurso_decidido', {
      edital: 'Edital X',
      decisao: 'DEFERIDO',
      url: 'http://localhost:3000',
    })
    expect(html).toContain('DEFERIDO')
  })

  it('protocolo_atendimento — contém protocolo', async () => {
    const { html } = await renderTemplate('protocolo_atendimento', {
      protocolo: 'PROT-123',
    })
    expect(html).toContain('PROT-123')
  })

  it('notificacao_prazo — contém mensagem', async () => {
    const { html } = await renderTemplate('notificacao_prazo', {
      mensagem: 'Sua inscrição vence amanhã',
      url: 'http://localhost:3000/proponente',
    })
    expect(html).toContain('vence amanhã')
  })

  it('notificacao_generica — corpo HTML é preservado', async () => {
    const { html } = await renderTemplate('notificacao_generica', {
      titulo: 'Comunicado importante',
      corpo: '<p>Atenção</p><strong>negrito</strong>',
      link: 'http://localhost:3000',
      ctaLabel: 'Acessar',
    })
    expect(html).toContain('Comunicado importante')
    expect(html).toContain('negrito')
    expect(html).toContain('Acessar')
  })

  it('template desconhecido → lança erro', async () => {
    await expect(
      renderTemplate(
        'inexistente' as never,
        {} as never,
      ),
    ).rejects.toThrow(/desconhecido/i)
  })
})

describe('defaultSubjectFor', () => {
  it('comprovante_inscricao — usa número e edital', () => {
    const subject = defaultSubjectFor('comprovante_inscricao', {
      numero: 'INS-001',
      edital: 'Edital PNAB 2025',
      url: 'http://x',
    })
    expect(subject).toContain('INS-001')
    expect(subject).toContain('Edital PNAB 2025')
  })

  it('recuperacao_senha — assunto fixo', () => {
    const subject = defaultSubjectFor('recuperacao_senha', {
      nome: 'Ana',
      resetUrl: 'http://x',
    })
    expect(subject).toMatch(/Recupera[cç][aã]o de Senha/i)
  })
})
