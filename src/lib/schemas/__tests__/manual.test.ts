import { describe, it, expect } from 'vitest'
import { listagemManuaisSchema, manualSchema } from '@/lib/schemas/manual'

const valido = {
  titulo: 'Guia de inscrição',
  categoria: 'Inscrição',
  versao: '2.1',
  publicado: true,
  url: '/api/arquivos/manuais/guia-de-inscricao-1a2b3c4d.pdf',
}

describe('manualSchema', () => {
  it('aceita um manual completo', () => {
    expect(manualSchema.safeParse(valido).success).toBe(true)
  })

  it('versão vazia vira null e publicado tem padrão true', () => {
    const r = manualSchema.parse({ ...valido, versao: '', publicado: undefined })
    expect(r.versao).toBeNull()
    expect(r.publicado).toBe(true)
  })

  it('apara espaços do título e da categoria', () => {
    const r = manualSchema.parse({ ...valido, titulo: '  Guia  ', categoria: ' Geral ' })
    expect(r).toMatchObject({ titulo: 'Guia', categoria: 'Geral' })
  })

  it.each([
    ['vazia', ''],
    ['de outro bucket', '/api/arquivos/editais/edital.pdf'],
    ['externa com o mesmo caminho', 'https://exemplo.com/api/arquivos/manuais/x.pdf'],
    ['protocolo relativo', '//exemplo.com/api/arquivos/manuais/x.pdf'],
    ['com subida de pasta', '/api/arquivos/manuais/../propostas/x.pdf'],
    ['com query', '/api/arquivos/manuais/x.pdf?exp=1'],
    ['só o prefixo', '/api/arquivos/manuais/'],
  ])('rejeita URL %s', (_caso, url) => {
    const r = manualSchema.safeParse({ ...valido, url })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].path).toEqual(['url'])
  })

  it('rejeita título curto e categoria ausente', () => {
    const r = manualSchema.safeParse({ ...valido, titulo: 'ab', categoria: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['categoria', 'titulo'])
  })
})

describe('listagemManuaisSchema', () => {
  it('usa padrões e limita pageSize a 50', () => {
    expect(listagemManuaisSchema.parse({})).toEqual({ page: 1, pageSize: 20, status: undefined })
    expect(listagemManuaisSchema.safeParse({ pageSize: '51' }).success).toBe(false)
  })

  it('ignora status desconhecido em vez de falhar', () => {
    expect(listagemManuaisSchema.parse({ status: 'qualquer' }).status).toBeUndefined()
    expect(listagemManuaisSchema.parse({ status: 'oculto' }).status).toBe('oculto')
  })
})
