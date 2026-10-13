import { describe, it, expect } from 'vitest'
import { DADOS_VAZIOS, montarPedido, validarGrupo, type DadosVisita } from '../dados-visita'
import { apenasDigitos } from '../entrada-numerica'

const preenchido: DadosVisita = {
  ...DADOS_VAZIOS,
  data: '2026-10-15',
  turno: 'MANHA',
  horaInicio: '09:00',
  horaFim: '09:45',
  tipoVisitante: 'Grupo de Turistas',
  instituicao: 'Turma da Bahia',
  quantidade: '10',
  faixaEtaria: 'adultos',
  idadeMinima: '18',
  idadeMaxima: '59',
  responsavelNome: 'Ana Souza',
  responsavelEmail: 'ana@example.com',
  responsavelTelefone: '74999990000',
}

describe('etapa do grupo', () => {
  it('pedido completo passa e vem com e-mail como preferência padrão', () => {
    expect(validarGrupo(preenchido, 20)).toEqual({})
    expect(montarPedido(preenchido, 2)).toMatchObject({ preferenciaContato: 'E-mail', idadeMinima: '18', regulamentoVersao: 2 })
  })
  it('quantidade fora de 1..teto barra com a mensagem da configuração', () => {
    expect(validarGrupo({ ...preenchido, quantidade: '0' }, 20).quantidade).toBe('Informe pelo menos 1 pessoa.')
    expect(validarGrupo({ ...preenchido, quantidade: '25' }, 20).quantidade).toBe('Cada agendamento atende até 20 pessoas.')
    expect(validarGrupo({ ...preenchido, quantidade: '25' }, 30).quantidade).toBeUndefined()
  })
  it('sem faixa escolhida o aviso fica no grupo de opções', () => {
    const erros = validarGrupo({ ...preenchido, faixaEtaria: '', idadeMinima: '', idadeMaxima: '' }, 20)
    expect(erros.faixaEtaria).toBe('Escolha a faixa etária do grupo.')
    expect(erros.idadeMinima).toBeUndefined()
  })
  it('intervalo personalizado exige início menor ou igual ao fim', () => {
    const erros = validarGrupo({ ...preenchido, faixaEtaria: 'personalizada', idadeMinima: '12', idadeMaxima: '8' }, 20)
    expect(erros.idadeMaxima).toContain('menor ou igual')
    // A comparação aparece junto com os outros erros, não só depois que eles somem.
    const comOutros = validarGrupo({ ...preenchido, responsavelNome: '', faixaEtaria: 'personalizada', idadeMinima: '12', idadeMaxima: '8' }, 20)
    expect(comOutros).toHaveProperty('responsavelNome')
    expect(comOutros.idadeMaxima).toContain('menor ou igual')
  })
  it('ano/turma não é enviado fora de escola, nem a faixa escolhida na tela', () => {
    const pedido = montarPedido({ ...preenchido, turma: '4º ano' }, 1)
    expect(pedido).not.toHaveProperty('turma')
    expect(pedido).not.toHaveProperty('faixaEtaria')
    expect(montarPedido({ ...preenchido, tipoVisitante: 'Unidade Escolar Estadual', turma: '4º ano' }, 1)).toHaveProperty('turma', '4º ano')
  })
  it('a digitação fica só com algarismos', () => {
    expect(apenasDigitos('-1e2,5')).toBe('125')
    expect(apenasDigitos('12345')).toBe('123')
  })
})
