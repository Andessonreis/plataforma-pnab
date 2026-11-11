import { describe, expect, it } from 'vitest'
import { isImagemManual, problemaDoArquivoManual } from '../regras'

describe('regras dos manuais — imagens', () => {
  it.each(['marca.png', 'logo.JPG', 'regua.jpeg', 'arte.webp'])('aceita %s', (nome) => {
    expect(problemaDoArquivoManual({ name: nome, size: 1000 })).toBeUndefined()
    expect(isImagemManual(nome)).toBe(true)
  })

  it('recusa SVG por poder carregar script', () => {
    expect(problemaDoArquivoManual({ name: 'logo.svg', size: 1000 })).toMatch(/Formato não aceito/)
  })

  it('reconhece imagem pela URL do arquivo e não confunde PDF', () => {
    expect(isImagemManual('/api/arquivos/manuais/marca-1a2b3c4d.png')).toBe(true)
    expect(isImagemManual('/api/arquivos/manuais/guia-1a2b3c4d.pdf')).toBe(false)
  })
})
