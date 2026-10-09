import { describe, it, expect } from 'vitest'
import { descreverFaixaEtaria, grupoDaFaixaEtaria } from '../faixa-etaria'
import { assuntoPreenchido, linkFalarComSecretaria } from '../contato-secretaria'
import { montarRelatorio, type LinhaRelatorio } from '../relatorio'

describe('faixa etária', () => {
  it('intervalo de uma faixa conhecida usa o nome dela', () => {
    expect(descreverFaixaEtaria(6, 10)).toBe('Fundamental I (6 a 10 anos)')
    expect(descreverFaixaEtaria(60, 120)).toBe('Terceira idade (60 anos ou mais)')
  })
  it('intervalo personalizado vira "Entre X e Y anos"', () => {
    expect(descreverFaixaEtaria(8, 12)).toBe('Entre 8 e 12 anos')
    expect(descreverFaixaEtaria(9, 9)).toBe('9 anos')
  })
  it('o relatório junta pedidos novos e antigos na mesma faixa', () => {
    expect(grupoDaFaixaEtaria('Fundamental I')).toBe('Fundamental I (6 a 10 anos)')
    expect(grupoDaFaixaEtaria('fundamental i (6 a 10 anos)')).toBe('Fundamental I (6 a 10 anos)')
    expect(grupoDaFaixaEtaria('6 a 10 anos')).toBe('Fundamental I (6 a 10 anos)')
    expect(grupoDaFaixaEtaria('Ensino médio')).toBe('Ensino médio (15 a 17 anos)')
    expect(grupoDaFaixaEtaria('8 a 12')).toBe('Entre 8 e 12 anos')
    expect(grupoDaFaixaEtaria('Entre 8 e 12 anos')).toBe('Entre 8 e 12 anos')
    expect(grupoDaFaixaEtaria('   ')).toBe('Não informada')
    expect(grupoDaFaixaEtaria('turma mista')).toBe('turma mista')
  })
  it('montarRelatorio agrupa pela faixa normalizada', () => {
    const linha = (faixaEtaria: string | null): LinhaRelatorio => ({
      status: 'REALIZADO', tipoVisitante: 'Unidade Escolar Municipal', faixaEtaria, quantidade: 10, turno: 'MANHA', horaInicio: '09:00',
    })
    const r = montarRelatorio([linha('Fundamental I'), linha('Fundamental I (6 a 10 anos)'), linha(null)])
    expect(r.porFaixaEtaria).toEqual([
      { chave: 'Fundamental I (6 a 10 anos)', visitas: 2, visitantes: 20 },
      { chave: 'Não informada', visitas: 1, visitantes: 10 },
    ])
  })
})

describe('Falar com a Secretaria', () => {
  it('o link leva só o marcador e o protocolo', () => {
    expect(linkFalarComSecretaria('MEM-2026-A1B2C3')).toBe('/contato?assunto=memorial-visita&protocolo=MEM-2026-A1B2C3#formulario-contato')
    expect(linkFalarComSecretaria()).toBe('/contato?assunto=memorial-visita#formulario-contato')
  })
  it('o assunto é montado no servidor e ignora o que não segue o formato', () => {
    expect(assuntoPreenchido({ assunto: 'memorial-visita', protocolo: 'MEM-2026-A1B2C3' })).toBe(
      'Agendamento de visita ao Memorial — protocolo MEM-2026-A1B2C3',
    )
    expect(assuntoPreenchido({ assunto: 'memorial-visita', protocolo: '<script>alert(1)</script>' })).toBe('Agendamento de visita ao Memorial')
    expect(assuntoPreenchido({ assunto: '<b>qualquer</b>' })).toBe('')
    expect(assuntoPreenchido({})).toBe('')
  })
})
