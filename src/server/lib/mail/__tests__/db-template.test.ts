import { describe, expect, it } from 'vitest'
import { sanitizeBody, substitutePlaceholders } from '../db-template'

describe('substitutePlaceholders', () => {
  it('substitui {{var}} pelo valor do data', () => {
    expect(substitutePlaceholders('Olá {{nome}}!', { nome: 'Ana' })).toBe('Olá Ana!')
  })

  it('aceita espaços ao redor do nome', () => {
    expect(substitutePlaceholders('Olá {{  nome  }}!', { nome: 'Ana' })).toBe(
      'Olá Ana!',
    )
  })

  it('substitui múltiplas ocorrências da mesma var', () => {
    expect(substitutePlaceholders('{{x}} e {{x}}', { x: 'foo' })).toBe('foo e foo')
  })

  it('undefined/null viram string vazia', () => {
    expect(substitutePlaceholders('A{{x}}B{{y}}C', { x: undefined, y: null })).toBe(
      'ABC',
    )
  })

  it('chave ausente vira string vazia', () => {
    expect(substitutePlaceholders('Olá {{ausente}}!', {})).toBe('Olá !')
  })

  it('converte valores não-string para string', () => {
    expect(substitutePlaceholders('Total: {{n}}', { n: 42 })).toBe('Total: 42')
  })
})

describe('sanitizeBody', () => {
  it('preserva formatação básica', () => {
    const html = '<p>Olá <strong>mundo</strong>!</p>'
    expect(sanitizeBody(html)).toContain('<strong>mundo</strong>')
  })

  it('strip de script tag', () => {
    const html = '<p>oi</p><script>alert("xss")</script>'
    const out = sanitizeBody(html)
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('alert')
    expect(out).toContain('<p>oi</p>')
  })

  it('strip de event handlers inline (onerror, onclick)', () => {
    const html = '<a href="https://x.com" onclick="alert(1)">link</a>'
    const out = sanitizeBody(html)
    expect(out).toContain('href="https://x.com"')
    expect(out).not.toContain('onclick')
  })

  it('bloqueia iframe', () => {
    const html = '<iframe src="https://evil.com"></iframe>'
    expect(sanitizeBody(html)).not.toContain('<iframe')
  })

  it('bloqueia javascript: URL em href', () => {
    const html = '<a href="javascript:alert(1)">click</a>'
    const out = sanitizeBody(html)
    expect(out).not.toContain('javascript:')
  })

  it('permite img com src https', () => {
    const html = '<img src="https://example.com/logo.png" alt="logo" />'
    const out = sanitizeBody(html)
    expect(out).toContain('src="https://example.com/logo.png"')
  })

  it('permite inline style (necessário pra emails)', () => {
    const html = '<p style="color:#059669">verde</p>'
    expect(sanitizeBody(html)).toContain('style="color:#059669"')
  })
})
