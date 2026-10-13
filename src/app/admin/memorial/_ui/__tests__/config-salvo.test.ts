import { describe, it, expect } from 'vitest'
import { textoSalvo } from '../config-salvo'

const salvoEm = new Date('2026-10-09T13:00:00Z')
const depois = (min: number) => new Date(salvoEm.getTime() + min * 60_000)

describe('confirmação de salvamento', () => {
  it('fala "agora há pouco" nos primeiros minutos', () => {
    expect(textoSalvo(salvoEm, depois(0))).toBe('Salvo agora há pouco')
    expect(textoSalvo(salvoEm, depois(1))).toBe('Salvo agora há pouco')
  })

  it('conta os minutos dentro da primeira hora', () => {
    expect(textoSalvo(salvoEm, depois(12))).toBe('Salvo há 12 minutos')
  })

  it('mostra a hora de Irecê depois disso', () => {
    expect(textoSalvo(salvoEm, depois(90))).toBe('Salvo às 10:00')
  })
})
