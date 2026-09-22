import fs from 'fs'
import path from 'path'
import { describe, it, expect, vi } from 'vitest'

/**
 * O modelo é o que as duas versões de layout compartilham, e a versão 1 e a
 * versão 2 desenham com o PDFKit por conta própria: se um módulo do modelo
 * puxar o PDFKit (direto ou por um helper de desenho), o conteúdo deixa de ser
 * neutro e passa a depender do layout. O mock faz qualquer carga do PDFKit
 * durante o import explodir, inclusive a transitiva.
 */
vi.mock('pdfkit', () => {
  throw new Error('o modelo não pode carregar o PDFKit')
})

const PASTA = path.join(process.cwd(), 'src/lib/pdf/modelo')

const MODULOS = fs
  .readdirSync(PASTA)
  .filter((nome) => nome.endsWith('.ts'))
  .map((nome) => path.join(PASTA, nome))

describe('módulos do modelo', () => {
  it('existe ao menos um módulo para conferir', () => {
    expect(MODULOS.length).toBeGreaterThan(0)
  })

  it.each(MODULOS.map((arquivo) => [path.basename(arquivo), arquivo]))(
    '%s carrega sem o PDFKit',
    async (_nome, arquivo) => {
      await expect(import(/* @vite-ignore */ arquivo)).resolves.toBeDefined()
    },
  )
})
