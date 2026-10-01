import { describe, it, expect } from 'vitest'
import { textoParaPdf } from '../texto-winansi'

describe('textoParaPdf', () => {
  it('mantém acentos, aspas tipográficas, travessão e marcador', () => {
    const texto = 'Ação “Sertão” — ç ñ € • 50%'
    expect(textoParaPdf(texto)).toBe(texto)
  })

  it('troca tabulação por espaço sem deixar espaço duplo nem no fim da linha', () => {
    expect(textoParaPdf('1.\tRealizar\n•\t01 trailer\nExecução\t')).toBe('1. Realizar\n• 01 trailer\nExecução')
  })

  it('remove emoji e caracteres invisíveis fora do WinAnsi', () => {
    expect(textoParaPdf('Eu ❤ Irecê')).toBe('Eu Irecê')
    expect(textoParaPdf('* ⁠O curupira')).toBe('* O curupira')
    expect(textoParaPdf('✅ Meta 1️⃣')).toBe(' Meta 1')
  })

  it('normaliza quebra de linha do Windows', () => {
    expect(textoParaPdf('a\r\nb\rc')).toBe('a\nb\nc')
  })
})
