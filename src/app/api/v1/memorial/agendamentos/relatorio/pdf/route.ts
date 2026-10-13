import { NextRequest, NextResponse } from 'next/server'
import { createContext, forbidden, handleError, logRequest } from '@/lib/api/response'
import { requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { relatorioQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { relatorioComparado } from '@/app/admin/memorial/agendamentos/relatorio/dados'
import { gerarRelatorioVisitasMemorial } from '@/lib/pdf/template-1/relatorio-visitas-memorial'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

/** PDF do relatório de visitas do período, com os mesmos números da tela e sem dado pessoal. */
export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { de, ate } = relatorioQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const pdf = await gerarRelatorioVisitasMemorial(await relatorioComparado(de, ate))

    logRequest(ctx, 'GET', '/api/v1/memorial/agendamentos/relatorio/pdf', 200)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio_visitas_memorial_${de}_${ate}.pdf"`,
        'X-Request-Id': ctx.requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return handleError(ctx, err)
  }
}
