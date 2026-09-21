import { describe, it, expect } from 'vitest'
import { descreverContagem, descreverDivulgacao, pluralizar } from '../divulgar-resultado-texto'

const resultado = {
  divulgadas: 10,
  habilitadas: 8,
  inabilitadas: 2,
  emails: { enfileirados: 10, falhas: 0 },
}

describe('pluralizar', () => {
  it('usa o singular só para um', () => {
    expect(pluralizar(1, 'inscrição', 'inscrições')).toBe('1 inscrição')
    expect(pluralizar(0, 'inscrição', 'inscrições')).toBe('0 inscrições')
    expect(pluralizar(2, 'inscrição', 'inscrições')).toBe('2 inscrições')
  })
})

describe('descreverContagem', () => {
  it('cita os dois lados quando ambos têm inscrição', () => {
    expect(descreverContagem(8, 2)).toBe('8 habilitadas e 2 inabilitadas')
  })

  it('cita só o lado que tem inscrição', () => {
    expect(descreverContagem(1, 0)).toBe('1 habilitada')
    expect(descreverContagem(0, 1)).toBe('1 inabilitada')
  })

  it('sem nenhuma, diz "Nenhuma"', () => {
    expect(descreverContagem(0, 0)).toBe('Nenhuma')
  })
})

describe('descreverDivulgacao', () => {
  it('com e-mails na fila, informa quantos entraram', () => {
    expect(descreverDivulgacao(resultado, true)).toEqual({
      type: 'success',
      text: 'Resultado divulgado: 10 inscrições (8 habilitadas e 2 inabilitadas). 10 e-mails entraram na fila de envio.',
    })
  })

  it('com envio desmarcado, avisa que nenhum e-mail saiu', () => {
    const feedback = descreverDivulgacao({ ...resultado, emails: { enfileirados: 0, falhas: 0 } }, false)

    expect(feedback.type).toBe('success')
    expect(feedback.text).toContain('Nenhum e-mail foi enviado.')
  })

  it('com falha no envio, destaca como erro e diz que o resultado já está divulgado', () => {
    const feedback = descreverDivulgacao({ ...resultado, emails: { enfileirados: 9, falhas: 1 } }, true)

    expect(feedback.type).toBe('error')
    expect(feedback.text).toContain('1 e-mail não entrou na fila de envio.')
    expect(feedback.text).toContain('O resultado já está divulgado')
  })
})
