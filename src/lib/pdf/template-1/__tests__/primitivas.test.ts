import { describe, it, expect } from 'vitest'
import {
  documentoDeProva, lerPdf, protocolo, EMISSAO, TITULO,
} from './primitivas.fixtures'

/**
 * Prova das primitivas da versão 1: paginação, rodapé e metadados do arquivo.
 *
 * O que se verifica aqui é o que o layout anterior errava — folha fantasma no
 * fim do documento, numeração começando em 2 e tabela que perdia o cabeçalho
 * depois da quebra.
 */

const LINHA_EMISSAO = `Emissão nº ${EMISSAO.codigo} · confira em ${EMISSAO.urlVerificacao}`

describe('paginação', () => {
  it('90 linhas ocupam três folhas', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, EMISSAO))

    expect(paginas).toHaveLength(3)
  })

  it('a última folha traz a última linha da tabela, não sai em branco', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, EMISSAO))

    expect(paginas[2]).toContain(protocolo(90))
  })

  // A quebra mora na fronteira: é aí que o rodapé desenhado com a margem ativa
  // abria a folha fantasma. Varre as vizinhanças do fim da primeira folha.
  it.each([0, 1, 28, 29, 30, 31, 32])('com %i linhas, a última folha tem conteúdo', async (total) => {
    const { paginas } = await lerPdf(await documentoDeProva(total, EMISSAO))
    const ultima = paginas[paginas.length - 1]

    expect(ultima).toContain('Documento de prova gerado apenas')
    if (total > 0) expect(paginas.join('\n')).toContain(protocolo(total))
  })

  it('tabela vazia cabe numa folha só e imprime a linha de ausência', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(0, EMISSAO))

    expect(paginas).toHaveLength(1)
    expect(paginas[0]).toContain('Nenhum registro encontrado.')
  })

  it('o cabeçalho da tabela se repete em todas as folhas', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, EMISSAO))

    paginas.forEach((pagina) => expect(pagina).toContain('Protocolo'))
  })
})

describe('rodapé', () => {
  it('numera a primeira folha como Pág. 1 e segue na ordem', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, EMISSAO))

    paginas.forEach((pagina, i) => expect(pagina).toContain(`Pág. ${i + 1}`))
    expect(paginas[0]).not.toContain('Pág. 2')
  })

  it('com emissão, repete o código e a URL de verificação em todas as folhas', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, EMISSAO))

    paginas.forEach((pagina) => expect(pagina).toContain(LINHA_EMISSAO))
  })

  it('sem emissão, o documento sai com a linha de geração e sem código', async () => {
    const { paginas } = await lerPdf(await documentoDeProva(90, null))

    expect(paginas).toHaveLength(3)
    paginas.forEach((pagina) => {
      expect(pagina).toContain('Portal PNAB Irecê — Documento gerado em 21/09/2026 às 14:32')
      expect(pagina).not.toContain('Emissão nº')
    })
  })
})

describe('metadados do arquivo', () => {
  it.each([
    ['com emissão', EMISSAO],
    ['sem emissão', null],
  ])('%s, o título do PDF é o título do documento', async (_caso, emissao) => {
    const { titulo } = await lerPdf(await documentoDeProva(3, emissao))

    expect(titulo).toBe(TITULO)
  })
})
