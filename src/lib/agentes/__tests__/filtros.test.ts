import { describe, it, expect } from 'vitest'
import {
  camposDeFiltros,
  descreverFiltros,
  filtrosAgentesSchema,
  queryParaFiltros,
  whereDeFiltros,
} from '../filtros'
import { CAMPOS_PADRAO } from '../campos'

function filtros(query: string) {
  return filtrosAgentesSchema.parse(queryParaFiltros(new URLSearchParams(query)))
}

describe('queryParaFiltros', () => {
  it('junta parâmetro repetido do formulário em lista', () => {
    expect(queryParaFiltros(new URLSearchParams('perfis=ADMIN&perfis=AVALIADOR'))).toEqual({
      perfis: 'ADMIN,AVALIADOR',
    })
  })

  it('mantém lista separada por vírgula da exportação', () => {
    expect(queryParaFiltros(new URLSearchParams('perfis=ADMIN,AVALIADOR'))).toEqual({
      perfis: 'ADMIN,AVALIADOR',
    })
  })

  it('descarta valor vazio (select "todos" do formulário)', () => {
    expect(queryParaFiltros(new URLSearchParams('busca=&cidade=Irecê'))).toEqual({
      cidade: 'Irecê',
    })
  })
})

describe('filtrosAgentesSchema', () => {
  it('sem perfil informado, a lista é a dos agentes culturais', () => {
    expect(filtros('').perfis).toEqual(['PROPONENTE'])
  })

  it('aceita recorte por outros perfis', () => {
    expect(filtros('perfis=AVALIADOR&perfis=HABILITADOR').perfis).toEqual([
      'AVALIADOR',
      'HABILITADOR',
    ])
  })

  it('rejeita perfil inexistente', () => {
    expect(() => filtros('perfis=INVENTADO')).toThrow()
  })

  it('rejeita campo de exportação inexistente', () => {
    expect(() => filtros('campos=nome,inventado')).toThrow()
  })

  it('sem campos escolhidos, exporta a seleção padrão', () => {
    expect(camposDeFiltros(filtros(''))).toEqual(CAMPOS_PADRAO)
  })
})

describe('whereDeFiltros', () => {
  it('filtra pelos perfis pedidos', () => {
    expect(whereDeFiltros(filtros('perfis=AVALIADOR')).role).toEqual({ in: ['AVALIADOR'] })
  })

  it('natureza não informada não restringe o tipo', () => {
    expect(whereDeFiltros(filtros('')).tipoProponente).toBeUndefined()
  })

  it('situação vira o booleano de ativo', () => {
    expect(whereDeFiltros(filtros('situacao=inativos')).ativo).toBe(false)
    expect(whereDeFiltros(filtros('situacao=ativos')).ativo).toBe(true)
    expect(whereDeFiltros(filtros('situacao=todos')).ativo).toBeUndefined()
  })

  it('recorta quem tem e quem não tem inscrição', () => {
    expect(whereDeFiltros(filtros('inscricao=com')).inscricoes).toEqual({ some: {} })
    expect(whereDeFiltros(filtros('inscricao=sem')).inscricoes).toEqual({ none: {} })
  })

  it('busca por documento ignora a formatação digitada', () => {
    const where = whereDeFiltros(filtros('busca=123.456.789-01'))
    expect(where.OR).toContainEqual({ cpfCnpj: { contains: '12345678901' } })
  })

  it('intervalo de cadastro cobre o dia final inteiro', () => {
    const where = whereDeFiltros(filtros('cadastradoDe=2026-09-01&cadastradoAte=2026-09-08'))
    const createdAt = where.createdAt as { gte: Date; lte: Date }
    expect(createdAt.gte.toISOString()).toBe('2026-09-01T03:00:00.000Z')
    expect(createdAt.lte.toISOString()).toBe('2026-09-09T02:59:59.999Z')
  })
})

describe('descreverFiltros', () => {
  it('descreve o recorte padrão em português', () => {
    expect(descreverFiltros(filtros(''))).toEqual([
      { label: 'Perfil de acesso', value: 'Proponente' },
      { label: 'Natureza', value: 'Todas' },
      { label: 'Situação do cadastro', value: 'Todas' },
    ])
  })

  it('inclui só os filtros realmente aplicados', () => {
    const descricao = descreverFiltros(filtros('tipos=PF&inscricao=com&cidade=Irecê'))
    expect(descricao).toContainEqual({ label: 'Natureza', value: 'Pessoa física' })
    expect(descricao).toContainEqual({ label: 'Inscrições', value: 'Somente com inscrição' })
    expect(descricao).toContainEqual({ label: 'Cidade', value: 'Irecê' })
    expect(descricao.some((d) => d.label === 'Busca')).toBe(false)
  })
})
