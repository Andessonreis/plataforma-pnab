import { describe, it, expect } from 'vitest'
import type { EditalStatus } from '@prisma/client'
import { resolverConviteEditais, type EditalVigente } from '@/app/proponente/convite-editais'

function edital(id: string, status: EditalStatus, data: string | null, valorTotal: number | null = 1000): EditalVigente {
  return {
    id,
    titulo: `Edital ${id}`,
    slug: id,
    status,
    cronograma: data ? [{ label: 'Encerramento das inscrições', dataHora: data }] : [],
    valorTotal,
  }
}

describe('resolverConviteEditais', () => {
  it('conta que já participa de editais segue com o bloco "agora"', () => {
    expect(resolverConviteEditais(1, [edital('a', 'INSCRICOES_ABERTAS', '2099-01-10T23:59:00')])).toBeNull()
  })

  it('conta só do Memorial vê os abertos, do encerramento mais próximo ao mais distante, até três', () => {
    const convite = resolverConviteEditais(0, [
      edital('longe', 'INSCRICOES_ABERTAS', '2099-03-01T23:59:00'),
      edital('perto', 'INSCRICOES_ABERTAS', '2099-01-01T23:59:00'),
      edital('sem-data', 'INSCRICOES_ABERTAS', null),
      edital('meio', 'INSCRICOES_ABERTAS', '2099-02-01T23:59:00'),
      edital('avaliando', 'AVALIACAO', '2099-01-05T00:00:00'),
    ])
    expect(convite?.situacao).toBe('abertos')
    expect(convite?.itens.map((i) => i.slug)).toEqual(['perto', 'meio', 'longe'])
    expect(convite?.itens[0].situacao).toBeNull()
  })

  it('sem aberto, os publicados vêm antes dos que estão em fases seguintes', () => {
    const convite = resolverConviteEditais(0, [
      edital('avaliando', 'AVALIACAO', '2099-01-05T00:00:00'),
      edital('publicado', 'PUBLICADO', '2099-02-01T00:00:00'),
      edital('parado', 'HABILITACAO', null, null),
    ])
    expect(convite?.situacao).toBe('proximos')
    expect(convite?.itens.map((i) => i.slug)).toEqual(['publicado', 'avaliando', 'parado'])
    expect(convite?.itens[2]).toMatchObject({ situacao: 'Em Habilitação', marco: null, valorTotal: null })
  })

  it('sem nenhum edital em andamento, o convite fica vazio', () => {
    expect(resolverConviteEditais(0, [])).toEqual({ situacao: 'nenhum', itens: [] })
  })
})
