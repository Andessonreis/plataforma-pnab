import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'

/**
 * O órgão chama-se **Secretaria de Cultura e Turismo de Irecê (SECULT)** — é
 * assim que assina no Diário Oficial. "Secretaria de Arte e Cultura" chegou a
 * circular no portal inteiro (28 ocorrências em 11 arquivos, incluindo termos
 * de uso, política de privacidade, e-mails e PDF de relatório final) antes de
 * ser corrigido.
 *
 * O erro é fácil de repetir porque o edital principal se chama "Festival de
 * **Arte e Cultura** de Irecê" — o nome do evento tem as mesmas palavras em
 * ordem trocada, e quem escreve acaba misturando os dois.
 *
 * Este teste existe para falhar no `make check` antes de o nome errado chegar
 * a um documento público de novo. Nome de órgão em termos de uso e em ato
 * administrativo não é detalhe de redação.
 */

const RAIZ = path.join(process.cwd(), 'src')
const EXTENSOES = ['.ts', '.tsx']
const ARQUIVO_DESTE_TESTE = 'nome-institucional.test.ts'

// Grafias erradas do nome do órgão. "Festival de Arte e Cultura" é o nome do
// edital e continua correto — por isso o padrão exige "Secretaria"/"Secretário".
const PADROES_PROIBIDOS = [
  /Secretaria\s+(?:Municipal\s+)?de\s+Arte\s+e\s+Cultura/i,
  /Secretári[oa]\(?[oa]?\)?\s+de\s+Arte\s+e\s+Cultura/i,
]

function arquivosFonte(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const caminho = path.join(dir, entrada)
    if (statSync(caminho).isDirectory()) return arquivosFonte(caminho)
    if (!EXTENSOES.includes(path.extname(caminho))) return []
    if (entrada === ARQUIVO_DESTE_TESTE) return []
    return [caminho]
  })
}

describe('nome institucional da Secretaria', () => {
  it('não usa "Secretaria de Arte e Cultura" em nenhum lugar do código', () => {
    const encontrados: string[] = []

    for (const arquivo of arquivosFonte(RAIZ)) {
      const linhas = readFileSync(arquivo, 'utf8').split('\n')
      linhas.forEach((linha, i) => {
        if (PADROES_PROIBIDOS.some((padrao) => padrao.test(linha))) {
          encontrados.push(`${path.relative(process.cwd(), arquivo)}:${i + 1} → ${linha.trim()}`)
        }
      })
    }

    expect(
      encontrados,
      `O órgão é "Secretaria de Cultura e Turismo de Irecê". Corrija:\n${encontrados.join('\n')}`,
    ).toEqual([])
  })

  it('o padrão pega a grafia errada e deixa passar o nome do Festival', () => {
    const erra = (texto: string) => PADROES_PROIBIDOS.some((p) => p.test(texto))

    expect(erra('Secretaria de Arte e Cultura de Irecê')).toBe(true)
    expect(erra('Secretaria Municipal de Arte e Cultura')).toBe(true)
    expect(erra('Secretário(a) de Arte e Cultura')).toBe(true)

    expect(erra('Festival de Arte e Cultura de Irecê')).toBe(false)
    expect(erra('Secretaria de Cultura e Turismo de Irecê')).toBe(false)
  })
})
