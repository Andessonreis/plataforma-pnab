import { describe, expect, it } from 'vitest'
import { proximoPasso } from '../proximo-passo'

const CRONOGRAMA = [
  { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-10-20T23:59:00' },
  { tipo: 'custom', label: 'Recursos — habilitação', acao: 'RECURSO_HABILITACAO_JANELA', dataHora: '2026-10-25T00:00:00', fimEm: '2026-10-27T23:59:00' },
  { tipo: 'custom', label: 'Recursos — seleção', acao: 'RECURSO_RESULTADO_JANELA', dataHora: '2026-10-05T00:00:00', fimEm: '2026-10-10T23:59:00' },
]
const AGORA = new Date('2026-10-09T12:00:00-03:00')
const base = { id: 'i1', editalStatus: 'INSCRICOES_ABERTAS' as const, cronograma: CRONOGRAMA, fasesRecorridas: [], agora: AGORA }

describe('proximoPasso', () => {
  it('rascunho com inscrições abertas leva ao formulário, com o prazo do cronograma', () => {
    const passo = proximoPasso({ ...base, status: 'RASCUNHO' })
    expect(passo).toMatchObject({ rotulo: 'Continuar inscrição', href: '/proponente/inscricoes/i1/editar', urgente: true })
    expect(passo.aviso).toBe('Envie até 20/10/2026, 23:59')
  })

  it('rascunho de edital fechado não oferece continuar', () => {
    const passo = proximoPasso({ ...base, status: 'RASCUNHO', editalStatus: 'HABILITACAO' })
    expect(passo.href).toBe('/proponente/inscricoes/i1')
    expect(passo.urgente).toBe(false)
    expect(passo.aviso).toMatch(/não pode mais ser enviado/)
  })

  it('recurso com janela aberta vira a ação principal, com o fim do prazo', () => {
    const passo = proximoPasso({ ...base, status: 'RESULTADO_PRELIMINAR', editalStatus: 'RESULTADO_PRELIMINAR' })
    expect(passo).toMatchObject({ rotulo: 'Enviar recurso', href: '/proponente/inscricoes/i1#interpor-recurso', urgente: true })
    expect(passo.aviso).toBe('Prazo até 10/10/2026, 23:59')
  })

  it('janela de recurso futura avisa a data e não oferece o envio', () => {
    const passo = proximoPasso({ ...base, status: 'INABILITADA', editalStatus: 'HABILITACAO' })
    expect(passo).toMatchObject({ rotulo: 'Ver resultado', urgente: false, aviso: 'Recurso a partir de 25/10/2026' })
  })

  it('recurso já enviado na fase não é oferecido de novo', () => {
    const passo = proximoPasso({ ...base, status: 'RESULTADO_PRELIMINAR', fasesRecorridas: ['RESULTADO_PRELIMINAR'] })
    expect(passo).toMatchObject({ rotulo: 'Ver resultado', urgente: false, aviso: 'Recurso enviado. Aguarde a decisão.' })
  })

  it('contemplada não recorre e só leva ao resultado', () => {
    expect(proximoPasso({ ...base, status: 'CONTEMPLADA' })).toMatchObject({ rotulo: 'Ver resultado', urgente: false, aviso: null })
  })

  it('em análise só acompanha', () => {
    expect(proximoPasso({ ...base, status: 'ENVIADA' })).toMatchObject({ rotulo: 'Acompanhar', aviso: null })
  })
})
