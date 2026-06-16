import { AUDIT_ACTIONS, logAudit } from '@server/lib/audit'
import { BadRequestError } from '@server/lib/http/errors'
import { EditalNaoEncontradoError } from '@server/modules/editais/errors/editais.errors'
import {
  contempladoRowSchema,
  type ImportContempladosError,
  type ImportContempladosResult,
} from '@shared/schemas/contemplados.schema'
import { contempladosRepository } from '../repository/contemplados.repository'

interface CsvRow {
  numero: string
  valorAprovado: string
  statusExecucao: string
  contrapartida: string
}

function parseCsv(content: string): CsvRow[] {
  const cleanContent = content.replace(/^\uFEFF/, '')

  const lines = cleanContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    throw new BadRequestError('O CSV deve conter ao menos o cabeçalho e uma linha de dados.')
  }

  const headers = lines[0].split(';').map((h) => h.trim().toLowerCase())

  const expectedHeaders = ['numero', 'valoraprovado', 'statusexecucao', 'contrapartida']
  const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new BadRequestError(
      `Cabeçalhos ausentes: ${missingHeaders.join(', ')}. Esperados: numero;valorAprovado;statusExecucao;contrapartida`,
    )
  }

  const numIdx = headers.indexOf('numero')
  const valorIdx = headers.indexOf('valoraprovado')
  const statusIdx = headers.indexOf('statusexecucao')
  const contrapartidaIdx = headers.indexOf('contrapartida')

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim())
    rows.push({
      numero: cols[numIdx] ?? '',
      valorAprovado: cols[valorIdx] ?? '',
      statusExecucao: cols[statusIdx] ?? '',
      contrapartida: cols[contrapartidaIdx] ?? '',
    })
  }

  return rows
}

export async function importContemplados(
  editalId: string,
  csvText: string,
  userId: string,
  ip?: string,
): Promise<ImportContempladosResult> {
  const edital = await contempladosRepository.findEditalById(editalId)
  if (!edital) throw new EditalNaoEncontradoError()

  const rows = parseCsv(csvText)

  const errors: ImportContempladosError[] = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNumber = i + 2

    const validation = contempladoRowSchema.safeParse(row)
    if (!validation.success) {
      const errorMessages = validation.error.errors.map((e) => e.message).join('; ')
      errors.push({ line: lineNumber, numero: row.numero || '(vazio)', error: errorMessages })
      continue
    }

    const validRow = validation.data

    const inscricao = await contempladosRepository.findInscricaoByNumero(validRow.numero, editalId)
    if (!inscricao) {
      errors.push({
        line: lineNumber,
        numero: validRow.numero,
        error: `Inscrição "${validRow.numero}" não encontrada neste edital.`,
      })
      continue
    }

    try {
      await contempladosRepository.upsertProjetoApoiado({
        inscricaoId: inscricao.id,
        valorAprovado: validRow.valorAprovado,
        statusExecucao: validRow.statusExecucao,
        contrapartida: validRow.contrapartida || null,
      })
      imported++
    } catch (dbErr) {
      errors.push({
        line: lineNumber,
        numero: validRow.numero,
        error: `Erro ao salvar: ${dbErr instanceof Error ? dbErr.message : 'Erro desconhecido'}`,
      })
    }
  }

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.IMPORTACAO_CONTEMPLADOS,
    entity: 'ProjetoApoiado',
    entityId: editalId,
    details: {
      editalTitulo: edital.titulo,
      totalLinhas: rows.length,
      importados: imported,
      erros: errors.length,
    },
    ip,
  })

  return {
    imported,
    errors,
    message: `Importação concluída: ${imported} registro(s) importado(s), ${errors.length} erro(s).`,
  }
}
