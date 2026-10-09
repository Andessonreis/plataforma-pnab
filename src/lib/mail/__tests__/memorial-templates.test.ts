import { describe, expect, it } from 'vitest'
import { renderTemplate } from '../index'
import { TEMPLATE_META } from '../placeholders'

const visita = {
  protocolo: 'MEM-2026-A1B2C3',
  data: 'quinta-feira, 15 de outubro de 2026',
  horario: '09:00 às 09:45',
  instituicao: 'Escola Municipal Rui Barbosa',
  quantidade: 18,
}

describe('templates do agendamento do Memorial', () => {
  it('pedido recebido deixa claro que ainda não está confirmado', async () => {
    const { html, subject } = await renderTemplate('memorial_solicitacao_recebida', {
      ...visita,
      nome: 'Ana Souza',
      aviso: 'Sua visita ainda NÃO está confirmada.',
      contatoEmail: 'memorial@example.com',
    })
    expect(subject).toContain('MEM-2026-A1B2C3')
    expect(html).toContain('NÃO está confirmada')
    expect(html).toContain('Escola Municipal Rui Barbosa')
    expect(html).toContain('memorial@example.com')
  })

  it('pedido recebido oferece a página Falar com a Secretaria com o protocolo', async () => {
    const { html } = await renderTemplate('memorial_solicitacao_recebida', {
      ...visita,
      nome: 'Ana Souza',
      aviso: 'Sua visita ainda NÃO está confirmada.',
      contatoUrl: 'https://portal.exemplo/contato?assunto=memorial-visita&protocolo=MEM-2026-A1B2C3',
    })
    expect(html).toContain('Falar com a Secretaria')
    expect(html).toContain('protocolo=MEM-2026-A1B2C3')
    expect(html).toContain('09:00 às 09:45')
  })

  it('confirmada e remarcada mudam título e assunto', async () => {
    const confirmada = await renderTemplate('memorial_visita_confirmada', { ...visita, nome: 'Ana' })
    const remarcada = await renderTemplate('memorial_visita_confirmada', { ...visita, nome: 'Ana', remarcada: true })
    expect(confirmada.subject).toContain('confirmada')
    expect(confirmada.html).toContain('Visita confirmada')
    expect(remarcada.subject).toContain('remarcada')
    expect(remarcada.html).toContain('Visita remarcada')
  })

  it('recusa e cancelamento trazem o motivo', async () => {
    const recusada = await renderTemplate('memorial_visita_recusada', {
      ...visita,
      nome: 'Ana',
      situacao: 'RECUSADA',
      motivo: 'Memorial fechado para manutenção',
    })
    expect(recusada.html).toContain('Memorial fechado para manutenção')
    expect(recusada.subject).toContain('não atendido')

    const cancelada = await renderTemplate('memorial_visita_recusada', { ...visita, nome: 'Ana', situacao: 'CANCELADA', motivo: 'x' })
    expect(cancelada.subject).toContain('cancelada')
  })

  it('alerta da equipe leva o link do painel', async () => {
    const { html, text } = await renderTemplate('memorial_nova_solicitacao', {
      ...visita,
      nomeDestinatario: 'Equipe',
      tipoVisitante: 'Unidade Escolar Municipal',
      url: 'http://localhost:3000/admin/memorial/agendamentos/abc',
    })
    expect(html).toContain('http://localhost:3000/admin/memorial/agendamentos/abc')
    expect(text).toContain('MEM-2026-A1B2C3')
  })

  it('catálogo de placeholders cobre os quatro templates', () => {
    for (const t of ['memorial_solicitacao_recebida', 'memorial_visita_confirmada', 'memorial_visita_recusada', 'memorial_nova_solicitacao'] as const) {
      expect(TEMPLATE_META[t].placeholders.length).toBeGreaterThan(0)
    }
  })
})
