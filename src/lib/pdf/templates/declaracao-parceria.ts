import { z } from 'zod'
import { isValidCpf, isValidCnpj } from '@/lib/validators/document'
import { fillPdfTemplate, type FillField } from '../fill-template'

export const DECLARACAO_PARCERIA_TEMPLATE_KEY = 'declaracao-parceria'

// Título exato do arquivo MODELO_EDITAL que identifica esse anexo — qualquer
// edital (atual ou futuro) que cadastrar um arquivo com esse título ganha o
// formulário guiado automaticamente, sem precisar de mudança de código.
export const ANEXO_01_TITULO = 'Anexo 01 — Declaração de Parceria'

// Altura de cada espaço em branco no PDF original (Anexo 01) limita quantos
// caracteres cabem sem sobrepor o texto vizinho — o mesmo limite físico que
// já existe hoje pra quem preenche à mão. Acima disso, a UI orienta a usar o
// modelo em branco em vez de gerar um PDF com texto cortado.
export const DECLARACAO_PARCERIA_LIMITES = {
  mestreNome: 28,
  parceriaNome: 15,
  parceriaEndereco: 34,
} as const

export const declaracaoParceriaSchema = z.object({
  mestreNome: z
    .string()
    .trim()
    .min(1, 'Informe o nome da(o) mestra(e).')
    .max(DECLARACAO_PARCERIA_LIMITES.mestreNome, `Nome muito longo pro espaço do documento (máx. ${DECLARACAO_PARCERIA_LIMITES.mestreNome} caracteres) — use o modelo em branco pra esse caso.`),
  mestreCpf: z.string().refine((v) => isValidCpf(v), 'CPF da(o) mestra(e) inválido.'),
  mestreTelefone: z.string().min(8, 'Telefone da(o) mestra(e) inválido.'),
  parceriaNome: z
    .string()
    .trim()
    .min(1, 'Informe o nome da parceria.')
    .max(DECLARACAO_PARCERIA_LIMITES.parceriaNome, `Nome muito longo pro espaço do documento (máx. ${DECLARACAO_PARCERIA_LIMITES.parceriaNome} caracteres) — use o modelo em branco pra esse caso.`),
  parceriaCnpj: z.string().refine((v) => isValidCnpj(v), 'CNPJ da parceria inválido.'),
  parceriaEndereco: z
    .string()
    .trim()
    .min(1, 'Informe o endereço da parceria.')
    .max(DECLARACAO_PARCERIA_LIMITES.parceriaEndereco, `Endereço muito longo pro espaço do documento (máx. ${DECLARACAO_PARCERIA_LIMITES.parceriaEndereco} caracteres) — use o modelo em branco pra esse caso.`),
  parceriaTelefone: z.string().min(8, 'Telefone da parceria inválido.'),
})

export type DeclaracaoParceriaInput = z.infer<typeof declaracaoParceriaSchema>

// Coordenadas calibradas a partir do PDF real (novo_edital_100%/pdf/anexo-01-declaracao-parceria.pdf,
// A4, 595.3x841.9pt) via `pdftotext -bbox-layout`. Cada campo cobre exatamente
// a área do colchete original e escreve o valor no lugar — nenhuma outra
// palavra do documento é tocada.
// Altura real de cada linha no PDF original (yMax-yMin do bbox, via `pdftotext -bbox-layout`)
// — o retângulo de cobertura usa essa altura, não o tamanho da fonte do valor inserido.
const ALTURA_LINHA = 20

function buildFields(dados: DeclaracaoParceriaInput): FillField[] {
  return [
    // Item I — Mestra(e): [Nome da(o) Mestra(e), CPF [número], Telefone: [DDD+número];
    { page: 0, x: 171.9, y: 589.97, value: dados.mestreNome, size: 9, coverWidth: 130.5, coverHeight: ALTURA_LINHA },
    { page: 0, x: 328.75, y: 589.97, value: dados.mestreCpf, size: 7, coverWidth: 57, coverHeight: ALTURA_LINHA },
    { page: 0, x: 443.15, y: 589.97, value: dados.mestreTelefone, size: 9, coverWidth: 80.5, coverHeight: ALTURA_LINHA },
    // fecha o item I na linha seguinte, onde ficava "número];" — mantém o ";" original
    { page: 0, x: 108.1, y: 573.62, value: ';', size: 10, coverWidth: 52, coverHeight: ALTURA_LINHA },

    // Item II — : [Nome], CNPJ [número], Endereço: [endereço completo], Telefone: [DDD + número];
    { page: 0, x: 114.45, y: 388.07, value: dados.parceriaNome, size: 6, coverWidth: 46, coverHeight: ALTURA_LINHA },
    { page: 0, x: 193.35, y: 388.07, value: dados.parceriaCnpj, size: 5.5, coverWidth: 57, coverHeight: ALTURA_LINHA },
    { page: 0, x: 311.9, y: 388.07, value: dados.parceriaEndereco, size: 7, coverWidth: 121, coverHeight: ALTURA_LINHA },
    // "[DDD" no fim da linha do item II — sem espaço útil; só apaga, o telefone completo vai na linha de baixo
    { page: 0, x: 490.55, y: 388.07, value: '', size: 9, coverWidth: 31, coverHeight: ALTURA_LINHA },
    // "+ número];" na linha seguinte — apaga e escreve o telefone completo + ";" de fechamento
    { page: 0, x: 108.15, y: 369.47, value: `${dados.parceriaTelefone};`, size: 9, coverWidth: 63, coverHeight: ALTURA_LINHA },
  ]
}

/** Gera o Anexo 01 (Declaração de Parceria) com os campos preenchidos, a partir dos bytes do PDF oficial já publicado pela Secretaria. */
export async function gerarDeclaracaoParceria(templateBytes: Buffer | Uint8Array, dados: DeclaracaoParceriaInput): Promise<Buffer> {
  return fillPdfTemplate(templateBytes, buildFields(dados))
}
