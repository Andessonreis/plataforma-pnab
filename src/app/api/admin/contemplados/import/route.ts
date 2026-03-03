import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// ── Schema de validacao ─────────────────────────────────────────────────────

const formSchema = z.object({
  editalId: z.string().min(1, 'ID do edital e obrigatorio'),
})

const VALID_STATUS_EXECUCAO = [
  'EM_EXECUCAO',
  'CONCLUIDO',
  'CANCELADO',
  'SUSPENSO',
] as const

const rowSchema = z.object({
  numero: z.string().min(1, 'Numero da inscricao e obrigatorio'),
  valorAprovado: z.coerce.number().positive('Valor deve ser positivo'),
  statusExecucao: z.string().refine(
    (val) => VALID_STATUS_EXECUCAO.includes(val as typeof VALID_STATUS_EXECUCAO[number]),
    { message: `Status deve ser: ${VALID_STATUS_EXECUCAO.join(', ')}` },
  ),
  contrapartida: z.string().optional(),
})

// ── Funcao para parsear CSV ─────────────────────────────────────────────────

interface CsvRow {
  numero: string
  valorAprovado: string
  statusExecucao: string
  contrapartida: string
}

function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
  // Remover BOM se presente
  const cleanContent = content.replace(/^\uFEFF/, '')

  const lines = cleanContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    throw new Error('O CSV deve conter ao menos o cabecalho e uma linha de dados.')
  }

  const headers = lines[0].split(';').map((h) => h.trim().toLowerCase())

  // Validar cabecalhos esperados
  const expectedHeaders = ['numero', 'valoraprovado', 'statusexecucao', 'contrapartida']
  const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Cabecalhos ausentes: ${missingHeaders.join(', ')}. Esperados: numero;valorAprovado;statusExecucao;contrapartida`)
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

  return { headers, rows }
}

// ── POST — Importar contemplados via CSV ────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    // Verificar autenticacao e role
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Extrair FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const editalId = formData.get('editalId') as string | null

    // Validar campos do form
    const formValidation = formSchema.safeParse({ editalId })
    if (!formValidation.success) {
      const res = NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Selecione um edital.',
          fieldErrors: formValidation.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar arquivo
    if (!file || file.size === 0) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Arquivo CSV e obrigatorio.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (!file.name.endsWith('.csv')) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'O arquivo deve ser um CSV (.csv).', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Verificar se o edital existe
    const edital = await prisma.edital.findUnique({
      where: { id: formValidation.data.editalId },
    })
    if (!edital) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital nao encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Ler e parsear CSV
    const csvText = await file.text()
    let parsedCsv: ReturnType<typeof parseCsv>

    try {
      parsedCsv = parseCsv(csvText)
    } catch (parseErr) {
      const res = NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parseErr instanceof Error ? parseErr.message : 'Erro ao parsear CSV.',
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Processar cada linha
    const errors: Array<{ line: number; numero: string; error: string }> = []
    let imported = 0

    for (let i = 0; i < parsedCsv.rows.length; i++) {
      const row = parsedCsv.rows[i]
      const lineNumber = i + 2 // +2 porque linha 1 e o cabecalho, i comeca em 0

      // Validar dados da linha com Zod
      const validation = rowSchema.safeParse(row)
      if (!validation.success) {
        const errorMessages = validation.error.errors.map((e) => e.message).join('; ')
        errors.push({ line: lineNumber, numero: row.numero || '(vazio)', error: errorMessages })
        continue
      }

      const validRow = validation.data

      // Buscar inscricao pelo numero e editalId
      const inscricao = await prisma.inscricao.findFirst({
        where: {
          numero: validRow.numero,
          editalId: formValidation.data.editalId,
        },
      })

      if (!inscricao) {
        errors.push({
          line: lineNumber,
          numero: validRow.numero,
          error: `Inscricao "${validRow.numero}" nao encontrada neste edital.`,
        })
        continue
      }

      // Upsert ProjetoApoiado
      try {
        await prisma.projetoApoiado.upsert({
          where: { inscricaoId: inscricao.id },
          create: {
            inscricaoId: inscricao.id,
            valorAprovado: validRow.valorAprovado,
            statusExecucao: validRow.statusExecucao,
            contrapartida: validRow.contrapartida || null,
            publicado: true,
          },
          update: {
            valorAprovado: validRow.valorAprovado,
            statusExecucao: validRow.statusExecucao,
            contrapartida: validRow.contrapartida || null,
            publicado: true,
          },
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

    // Registrar auditoria
    await logAudit({
      userId: session.user.id,
      action: 'IMPORTACAO_CONTEMPLADOS',
      entity: 'ProjetoApoiado',
      entityId: formValidation.data.editalId,
      details: {
        editalTitulo: edital.titulo,
        totalLinhas: parsedCsv.rows.length,
        importados: imported,
        erros: errors.length,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      {
        message: `Importacao concluida: ${imported} registro(s) importado(s), ${errors.length} erro(s).`,
        imported,
        errors,
        requestId,
      },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/contemplados/import',
      status: 200,
      durationMs: Date.now() - start,
      imported,
      errors: errors.length,
    })

    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno ao processar importacao.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
