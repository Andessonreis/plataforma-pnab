import { describe, it, expect, vi } from 'vitest'

// Desfaz o mock global do setup.ts para testar a implementação real
vi.unmock('@shared/upload/validate')

const { validateMagicBytes, sanitizeFilename } = await import('../validate')

// ─── validateMagicBytes ─────────────────────────────────────────────────────────

describe('validateMagicBytes', () => {
  it('PDF: aceita magic bytes %PDF', () => {
    // %PDF = 0x25 0x50 0x44 0x46
    const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    expect(validateMagicBytes(buffer, 'application/pdf')).toBe(true)
  })

  it('PNG: aceita magic bytes PNG', () => {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(validateMagicBytes(buffer, 'image/png')).toBe(true)
  })

  it('JPEG: aceita magic bytes FF D8 FF', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    expect(validateMagicBytes(buffer, 'image/jpeg')).toBe(true)
  })

  it('WEBP: aceita magic bytes RIFF', () => {
    // RIFF header (52 49 46 46) — bytes 0-3 de qualquer arquivo RIFF, incluindo WEBP
    const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
    expect(validateMagicBytes(buffer, 'image/webp')).toBe(true)
  })

  it('WEBP: rejeita PNG declarado como WEBP', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(validateMagicBytes(pngBuffer, 'image/webp')).toBe(false)
  })

  it('XLSX: aceita magic bytes PK (ZIP header)', () => {
    // PK ZIP: 50 4B 03 04
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    expect(validateMagicBytes(buffer, mime)).toBe(true)
  })

  it('rejeita executável disfarçado de PDF', () => {
    // MZ header (Windows EXE) com mime declarado como PDF
    const buffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00])
    expect(validateMagicBytes(buffer, 'application/pdf')).toBe(false)
  })

  it('rejeita MIME type não mapeado', () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00])
    expect(validateMagicBytes(buffer, 'application/octet-stream')).toBe(false)
  })

  it('rejeita buffer menor que a assinatura esperada', () => {
    // Buffer com apenas 2 bytes, mas PDF precisa de 4
    const buffer = Buffer.from([0x25, 0x50])
    expect(validateMagicBytes(buffer, 'application/pdf')).toBe(false)
  })

  it('rejeita buffer vazio', () => {
    const buffer = Buffer.alloc(0)
    expect(validateMagicBytes(buffer, 'application/pdf')).toBe(false)
  })
})

// ─── sanitizeFilename ───────────────────────────────────────────────────────────

describe('sanitizeFilename', () => {
  it('remove path traversal (../)', () => {
    // ../  → barra removida, depois .. removido
    // ../../etc/passwd → barras removidas → "....etcpasswd" → ".." removido → "etcpasswd"
    const result = sanitizeFilename('../../etc/passwd')
    expect(result).not.toContain('..')
    expect(result).not.toContain('/')
  })

  it('remove barras (/ e \\)', () => {
    const result = sanitizeFilename('path/to\\file.pdf')
    expect(result).not.toContain('/')
    expect(result).not.toContain('\\')
  })

  it('remove caracteres perigosos (<>:"|?*)', () => {
    const result = sanitizeFilename('file<name>:"test"|data?.pdf')
    expect(result).not.toMatch(/[<>:"|?*]/)
  })

  it('substitui espaços por underscore', () => {
    expect(sanitizeFilename('meu arquivo final.pdf')).toBe('meu_arquivo_final.pdf')
  })

  it('remove pontos iniciais (hidden files)', () => {
    // ".hidden" → barras removidas (noop) → ".." removido (noop) → chars perigosos (noop)
    // → espaços (noop) → "^\.+" remove leading dot → "hidden"
    expect(sanitizeFilename('.hidden')).toBe('hidden')
  })

  it('remove sequências de pontos duplos (..)', () => {
    // "...triplo" → ".." removido → ".triplo" → leading dot removido → "triplo"
    expect(sanitizeFilename('...triplo')).toBe('triplo')
  })

  it('limita o nome a 200 caracteres', () => {
    const longName = 'a'.repeat(300)
    const result = sanitizeFilename(longName)
    expect(result.length).toBeLessThanOrEqual(200)
  })

  it('retorna "arquivo" para input vazio', () => {
    expect(sanitizeFilename('')).toBe('arquivo')
  })

  it('retorna "arquivo" quando todos os caracteres são removidos', () => {
    // "..." → ".." removido → "." → leading dot removido → "" → "arquivo"
    expect(sanitizeFilename('...')).toBe('arquivo')
  })

  it('preserva caracteres alfanuméricos normais', () => {
    expect(sanitizeFilename('documento_2025.pdf')).toBe('documento_2025.pdf')
  })

  it('preserva hifens', () => {
    expect(sanitizeFilename('edital-pnab-2025.pdf')).toBe('edital-pnab-2025.pdf')
  })

  // Casos que quebravam upload no Supabase Storage (key inválido)
  it('remove acentos comuns do português', () => {
    expect(sanitizeFilename('Portifólio.pdf')).toBe('Portifolio.pdf')
    expect(sanitizeFilename('Associação.pdf')).toBe('Associacao.pdf')
    expect(sanitizeFilename('Iêda.pdf')).toBe('Ieda.pdf')
    expect(sanitizeFilename('São_João.pdf')).toBe('Sao_Joao.pdf')
  })

  it('substitui parênteses, vírgulas e outros símbolos por _', () => {
    expect(sanitizeFilename('arquivo(1).pdf')).toBe('arquivo_1_.pdf')
    expect(sanitizeFilename('plano,versão,final.pdf')).toBe('plano_versao_final.pdf')
  })

  it('lida com o nome real que falhou em produção', () => {
    const original = 'Portifólio_Cultural_da_Associação_de_Moradores_do_Bairro_Iêda_Dourado-compactado.pdf'
    const result = sanitizeFilename(original)
    // Não deve conter caracteres não-ASCII-seguros
    expect(result).toMatch(/^[a-zA-Z0-9._-]+$/)
    expect(result).toContain('Portifolio')
    expect(result).toContain('Associacao')
    expect(result).toContain('Ieda')
  })
})
