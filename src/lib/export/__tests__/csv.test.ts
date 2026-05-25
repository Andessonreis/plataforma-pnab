import { describe, it, expect } from 'vitest'
import { toCsv } from '../csv'

const STRIP_BOM = (s: string) => s.replace(/^﻿/, '')

describe('toCsv', () => {
  it('linhas simples', () => {
    const csv = toCsv([['a', 'b', 'c'], ['1', '2', '3']])
    expect(STRIP_BOM(csv)).toBe('a,b,c\r\n1,2,3')
  })

  it('escapa células com vírgula', () => {
    const csv = toCsv([['Silva, João', 'PNAB']])
    expect(STRIP_BOM(csv)).toBe('"Silva, João",PNAB')
  })

  it('escapa células com aspas duplicando', () => {
    const csv = toCsv([['ele disse "oi"']])
    expect(STRIP_BOM(csv)).toBe('"ele disse ""oi"""')
  })

  it('escapa células com quebra de linha', () => {
    const csv = toCsv([['linha1\nlinha2']])
    expect(STRIP_BOM(csv)).toBe('"linha1\nlinha2"')
  })

  it('CSV injection — prefixa = com aspa simples', () => {
    const csv = toCsv([['=SUM(A1:A2)']])
    expect(STRIP_BOM(csv)).toBe("'=SUM(A1:A2)")
  })

  it('CSV injection — prefixa +, -, @ com aspa simples', () => {
    expect(STRIP_BOM(toCsv([['+1']]))).toBe("'+1")
    expect(STRIP_BOM(toCsv([['-cmd']]))).toBe("'-cmd")
    expect(STRIP_BOM(toCsv([['@invoke']]))).toBe("'@invoke")
  })

  it('null e undefined viram célula vazia', () => {
    const csv = toCsv([[null, undefined, '']])
    expect(STRIP_BOM(csv)).toBe(',,')
  })

  it('inclui BOM UTF-8 no início', () => {
    const csv = toCsv([['x']])
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
  })

  it('linhas separadas por CRLF', () => {
    const csv = toCsv([['a'], ['b']])
    expect(STRIP_BOM(csv)).toBe('a\r\nb')
  })
})
