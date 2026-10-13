import { describe, it, expect } from 'vitest'
import { resumoDoDia, tarefasDeConteudo } from '../visao-dados'

const vazio = { exposicoes: {}, acervo: {}, pessoas: {}, eventos: {}, albuns: 0, fotosSemAutorizacao: 0 }

describe('tarefasDeConteudo', () => {
  it('sem nada parado não há tarefa', () => {
    expect(tarefasDeConteudo(vazio)).toEqual([])
  })

  it('revisão vem antes de publicação, com o link já filtrado', () => {
    const t = tarefasDeConteudo({ ...vazio, acervo: { APROVADO: 2 }, exposicoes: { EM_REVISAO: 1 } })
    expect(t.map((x) => x.texto)).toEqual(['1 exposição esperando revisão', '2 itens do acervo esperando publicação'])
    expect(t[0].href).toBe('/admin/memorial/exposicoes?status=EM_REVISAO')
  })

  it('eventos mantêm a aba na URL e fotos sem autorização entram por último', () => {
    const t = tarefasDeConteudo({ ...vazio, eventos: { EM_REVISAO: 3 }, fotosSemAutorizacao: 1 })
    expect(t[0].href).toBe('/admin/memorial/pessoas?aba=eventos&status=EM_REVISAO')
    expect(t[1].texto).toBe('1 foto sem autorização de uso registrada')
  })
})

describe('resumoDoDia', () => {
  it('fala dos pedidos e dos grupos de hoje', () => {
    expect(resumoDoDia(0, 0, 0)).toBe('Nenhum pedido esperando resposta. Nenhuma visita marcada para hoje.')
    expect(resumoDoDia(1, 1, 20)).toBe('1 pedido espera resposta. 1 grupo vem hoje, 20 pessoas.')
    expect(resumoDoDia(4, 2, 45)).toBe('4 pedidos esperam resposta. 2 grupos vêm hoje, 45 pessoas.')
  })
})
