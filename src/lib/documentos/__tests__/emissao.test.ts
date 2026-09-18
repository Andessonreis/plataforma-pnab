import { describe, it, expect } from 'vitest'
import { gerarCodigo, hashConteudo, urlVerificacao } from '../emissao'

describe('gerarCodigo', () => {
  it('sai no formato PNAB-XXXX-XXXX', () => {
    expect(gerarCodigo()).toMatch(/^PNAB-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  })

  it('não usa caracteres que se confundem ao ditar ou digitar', () => {
    const amostra = Array.from({ length: 300 }, gerarCodigo).join('')
    // I/1, O/0 fora do alfabeto — o código é lido em voz alta e digitado à mão
    expect(amostra).not.toMatch(/[IO01]/)
  })

  it('não repete em sequência', () => {
    const codigos = new Set(Array.from({ length: 500 }, gerarCodigo))
    expect(codigos.size).toBe(500)
  })
})

describe('hashConteudo', () => {
  it('mesmo conteúdo dá o mesmo hash', () => {
    const dados = { edital: 'festival', linhas: [{ numero: '0001', nota: 93.33 }] }
    expect(hashConteudo(dados)).toBe(hashConteudo({ ...dados }))
  })

  it('ordem das chaves não muda o hash', () => {
    expect(hashConteudo({ a: 1, b: 2 })).toBe(hashConteudo({ b: 2, a: 1 }))
  })

  it('ordem dos itens da lista muda o hash', () => {
    // A ordem da lista é a classificação — trocar posição é outro documento.
    expect(hashConteudo([{ n: 1 }, { n: 2 }])).not.toBe(hashConteudo([{ n: 2 }, { n: 1 }]))
  })

  it('qualquer alteração de nota muda o hash', () => {
    const antes = { linhas: [{ numero: '0001', nota: 93.33 }] }
    const depois = { linhas: [{ numero: '0001', nota: 93.34 }] }
    expect(hashConteudo(antes)).not.toBe(hashConteudo(depois))
  })

  it('campo ausente e campo undefined são o mesmo documento', () => {
    expect(hashConteudo({ a: 1, b: undefined })).toBe(hashConteudo({ a: 1 }))
  })

  it('aninhamento profundo entra no hash', () => {
    const a = { c: [{ d: { e: 'x' } }] }
    const b = { c: [{ d: { e: 'y' } }] }
    expect(hashConteudo(a)).not.toBe(hashConteudo(b))
  })

  it('devolve hexadecimal de 64 caracteres', () => {
    expect(hashConteudo({ x: 1 })).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('urlVerificacao', () => {
  it('monta a URL pública com o código', () => {
    expect(urlVerificacao('PNAB-ABCD-2345')).toMatch(/\/verificar\/PNAB-ABCD-2345$/)
  })

  it('não duplica barra quando a base termina com barra', () => {
    const anterior = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://exemplo.gov.br/'
    expect(urlVerificacao('PNAB-ABCD-2345')).toBe('https://exemplo.gov.br/verificar/PNAB-ABCD-2345')
    process.env.NEXT_PUBLIC_SITE_URL = anterior
  })
})
