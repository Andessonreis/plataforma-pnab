import { describe, it, expect } from 'vitest'
import type { CampoAgente } from '@/lib/agentes/campos'
import { LARGURA_UTIL } from '@/lib/pdf/documento-oficial/tema'
import { agenteDeTeste, listaAgentesDeTeste } from '@/lib/pdf/__tests__/apoio-pdf'
import { montarColunas, montarListaAgentes } from '../lista-agentes'
import type { ListaAgentesData } from '../tipos'

/** Dois agentes, um ativo e outro inativo, com os campos que mais variam de célula. */
function dados(parcial: Partial<ListaAgentesData> = {}): ListaAgentesData {
  return listaAgentesDeTeste({
    campos: ['nome', 'cpfCnpj', 'situacao'],
    agentes: [agenteDeTeste(), agenteDeTeste({ nome: 'João Souza', ativo: false })],
    ...parcial,
  })
}

describe('montarColunas', () => {
  it('a coluna de ordem vem primeiro, seguida dos campos pedidos na mesma ordem', () => {
    const campos: CampoAgente[] = ['email', 'nome']

    expect(montarColunas(campos).map((c) => c.label)).toEqual(['Nº', 'E-mail', 'Nome'])
  })

  it.each([
    [['nome']],
    [['nome', 'email', 'telefone']],
    [['nome', 'email', 'telefone', 'cpfCnpj', 'tipo', 'perfil', 'cidade', 'situacao', 'inscricoes', 'cadastradoEm']],
  ] as Array<[CampoAgente[]]>)('fecha na largura útil com %j, a sobra vai para a última coluna', (campos) => {
    const colunas = montarColunas(campos)
    const soma = colunas.reduce((total, coluna) => total + coluna.width, 0)

    expect(soma).toBeCloseTo(LARGURA_UTIL, 6)
    expect(colunas[0].width).toBe(24)
  })

  it('o campo de maior peso ganha a coluna mais larga', () => {
    const [, nome, situacao] = montarColunas(['nome', 'situacao'])

    expect(nome.width).toBeGreaterThan(situacao.width)
  })

  it('sem campos sobra só a coluna de ordem', () => {
    expect(montarColunas([]).map((c) => c.label)).toEqual(['Nº'])
  })

  it('cada chamada devolve colunas novas, sem compartilhar estado', () => {
    montarColunas(['nome'])[0].width = 999

    expect(montarColunas(['nome'])[0].width).toBe(24)
  })
})

describe('montarListaAgentes', () => {
  it('título padrão e rótulo do cromo vêm do módulo de títulos', () => {
    const modelo = montarListaAgentes(dados())

    expect(modelo.titulo).toBe('Agentes Culturais Cadastrados')
    expect(modelo.rotulo).toBe('Agentes culturais')
  })

  it('título informado na geração tem precedência', () => {
    expect(montarListaAgentes(dados({ titulo: 'Agentes do edital' })).titulo).toBe('Agentes do edital')
  })

  it('a ficha traz os filtros aplicados e o total de cadastros', () => {
    expect(montarListaAgentes(dados()).ficha).toEqual([
      { label: 'Perfil', value: 'Proponente' },
      { label: 'Total de cadastros', value: '2' },
    ])
  })

  it('numera as linhas e mascara o CPF/CNPJ', () => {
    const { linhas } = montarListaAgentes(dados())

    expect(linhas).toEqual([
      ['1', 'Maria da Silva', '123.***.***-01', 'Ativo'],
      ['2', 'João Souza', '123.***.***-01', 'Inativo'],
    ])
  })

  it('cada linha tem uma célula por coluna', () => {
    const modelo = montarListaAgentes(dados({ campos: ['nome', 'email', 'telefone', 'cidade'] }))

    expect(modelo.linhas.every((linha) => linha.length === modelo.colunas.length)).toBe(true)
  })

  it('sem agentes não há linhas, mas o texto de "nada consta" existe', () => {
    const modelo = montarListaAgentes(dados({ agentes: [] }))

    expect(modelo.linhas).toEqual([])
    expect(modelo.semRegistros).toBe('Nenhum cadastro encontrado para os filtros aplicados.')
    expect(modelo.textoTotal).toBe('Total: 0 cadastro(s)')
    expect(modelo.ficha.at(-1)).toEqual({ label: 'Total de cadastros', value: '0' })
  })

  it('os dois avisos alertam que o documento é interno e tem dado pessoal', () => {
    const modelo = montarListaAgentes(dados())

    for (const aviso of [modelo.avisoAbertura, modelo.avisoLegal]) {
      expect(aviso).toContain('Documento interno de trabalho')
      expect(aviso).toContain('LGPD')
    }
  })

  it('o protocolo repete o título e registra a quantidade e o uso interno', () => {
    expect(montarListaAgentes(dados({ titulo: 'Agentes do edital' })).protocolo).toEqual([
      { rotulo: 'Documento', valor: 'Agentes do edital' },
      { rotulo: 'Registros', valor: '2' },
      { rotulo: 'Uso', valor: 'Interno — contém dados pessoais' },
    ])
  })
})
