import { describe, it, expect } from 'vitest'
import {
  validateAnexoFile,
  describeValidationError,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '../anexo-config'

function makeFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(Math.min(size, 1024))], { type })
  // O Blob real não tem o tamanho passado — sobrescrevemos via Object.defineProperty
  // pra simular arquivos grandes sem alocar memória de verdade.
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateAnexoFile', () => {
  it('aceita PDF dentro do limite', () => {
    const file = makeFile('docs.pdf', 5 * 1024 * 1024, 'application/pdf')
    expect(validateAnexoFile(file)).toBeNull()
  })

  it('aceita PNG dentro do limite', () => {
    const file = makeFile('foto.png', 1024, 'image/png')
    expect(validateAnexoFile(file)).toBeNull()
  })

  it('aceita JPEG dentro do limite', () => {
    const file = makeFile('foto.jpg', 1024, 'image/jpeg')
    expect(validateAnexoFile(file)).toBeNull()
  })

  it('rejeita arquivo no limite + 1 byte', () => {
    const file = makeFile('grande.pdf', MAX_FILE_SIZE_BYTES + 1, 'application/pdf')
    const err = validateAnexoFile(file)
    expect(err).not.toBeNull()
    expect(err?.kind).toBe('size')
  })

  it('aceita arquivo exatamente no limite', () => {
    const file = makeFile('limite.pdf', MAX_FILE_SIZE_BYTES, 'application/pdf')
    expect(validateAnexoFile(file)).toBeNull()
  })

  it('rejeita docx (extensão e MIME ambos inválidos)', () => {
    const file = makeFile('texto.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const err = validateAnexoFile(file)
    expect(err).not.toBeNull()
    expect(['mime', 'extension']).toContain(err?.kind)
  })

  it('rejeita arquivo com MIME inválido mas extensão válida (caso raro)', () => {
    // Browser exótico que envia MIME errado pra .pdf — extensão aceita,
    // mas MIME não bate. Backend pega via magic bytes (defesa em profundidade).
    const file = makeFile('docs.pdf', 100, 'application/octet-stream')
    expect(validateAnexoFile(file)).toBeNull()
  })

  it('rejeita exe por extensão (mesmo sem MIME)', () => {
    const file = makeFile('virus.exe', 100, '')
    const err = validateAnexoFile(file)
    expect(err?.kind).toBe('extension')
  })

  it('aceita PDF mesmo sem MIME se a extensão for válida', () => {
    const file = makeFile('docs.pdf', 100, '')
    expect(validateAnexoFile(file)).toBeNull()
  })
})

describe('describeValidationError', () => {
  it('mensagem de tamanho cita limite e MB do arquivo', () => {
    const msg = describeValidationError({ kind: 'size', filename: 'big.pdf', sizeMb: 15.7 })
    expect(msg).toContain('big.pdf')
    expect(msg).toContain(`${MAX_FILE_SIZE_MB}MB`)
    expect(msg).toContain('15.7MB')
    expect(msg).toContain('Reduza')
  })

  it('mensagem de mime lista os formatos aceitos', () => {
    const msg = describeValidationError({ kind: 'mime', filename: 't.docx', mime: 'application/x' })
    expect(msg).toContain('t.docx')
    expect(msg).toContain('PDF, PNG ou JPEG')
  })

  it('mensagem de extensão cita a extensão problemática', () => {
    const msg = describeValidationError({ kind: 'extension', filename: 'v.exe', ext: '.exe' })
    expect(msg).toContain('v.exe')
    expect(msg).toContain('.exe')
  })
})
