import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { montarClassificacao } from '@/lib/results/classificacao'
import { generateListaClassificacao } from '@/lib/pdf/lista-classificacao'
import { registrarEmissao } from '@/lib/documentos/emissao'
import type { CategoriaConfig } from '@/types/categoria-config'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

function erro(status: number, error: string, message: string, requestId: string) {
  return NextResponse.json(
    { error, message, requestId },
    { status, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
  )
}

// ── GET — classificação por categoria em PDF ────────────────────────────────
// Sai do mesmo cálculo da tela (montarClassificacao). Enquanto o resultado não
// estiver consolidado, o PDF é carimbado como prévia: a bonificação e as notas
// ainda podem mudar, e um documento sem esse carimbo vira lista oficial na mão
// de quem receber.
export async function GET(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    const role = session?.user.role
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return erro(403, 'FORBIDDEN', 'Acesso negado.', requestId)
    }

    const { id: editalId } = await ctx.params

    const edital = await prisma.edital.findUnique({
      where: { id: editalId },
      select: {
        titulo: true, ano: true, slug: true,
        vagasSuplentes: true, notaMinima: true,
        categoriasConfig: true, bonusVisivelParaAdmin: true,
      },
    })
    if (!edital) return erro(404, 'NOT_FOUND', 'Edital não encontrado.', requestId)

    const mostraBonus = role === 'SUPER_ADMIN' || edital.bonusVisivelParaAdmin
    const consolidado =
      (await prisma.inscricao.count({ where: { editalId, notaFinal: { not: null } } })) > 0

    const categorias = await montarClassificacao(editalId, {
      incluirBonus: mostraBonus,
      notaMinima: edital.notaMinima != null ? Number(edital.notaMinima) : null,
      maxSuplentes: edital.vagasSuplentes,
      categoriasConfig: Array.isArray(edital.categoriasConfig)
        ? (edital.categoriasConfig as unknown as CategoriaConfig[])
        : null,
    })

    if (categorias.length === 0) {
      return erro(422, 'SEM_DADOS', 'Nenhuma inscrição avaliada para classificar ainda.', requestId)
    }

    const total = categorias.reduce((soma, c) => soma + c.linhas.length, 0)

    // O hash sai dos dados da classificação, não do PDF: reemitir o mesmo
    // conteúdo precisa dar o mesmo identificador.
    const emissao = await registrarEmissao({
      tipo: 'CLASSIFICACAO',
      titulo: `Classificação — ${edital.titulo} (${edital.ano})`,
      editalId,
      emitidoPorId: session.user.id,
      conteudo: categorias,
      metadados: {
        Categorias: categorias.length,
        Propostas: total,
        Bonificação: mostraBonus ? 'incluída na nota final' : 'não exibida',
        Situação: consolidado ? 'resultado consolidado' : 'prévia de trabalho',
      },
    })

    const buffer = await generateListaClassificacao({
      edital: { titulo: edital.titulo, ano: edital.ano },
      emissao,
      categorias: categorias.map((c) => ({
        nome: c.nome,
        vagasAmplaConcorrencia: c.vagasAmplaConcorrencia,
        cotas: c.cotas.map((cota) => ({ label: cota.label, vagas: cota.vagas })),
        valorPorProjeto: c.valorPorProjeto,
        linhas: c.linhas.map((l) => ({
          posicao: l.posicao,
          numero: l.numero,
          proponente: l.proponenteNome,
          notaBase: l.notaBase,
          notaBonus: l.notaBonus,
          notaFinal: l.notaFinal,
          cotista: l.cotista,
          status: l.status,
          semAvaliacao: l.semAvaliacao,
        })),
      })),
      consolidado,
      mostraBonus,
      geradoEm: new Date(),
    })

    await logAudit({
      userId: session.user.id,
      action: 'EXPORTACAO_CLASSIFICACAO_PDF',
      entity: 'Edital',
      entityId: editalId,
      details: { total, categorias: categorias.length, consolidado, comBonus: mostraBonus, codigo: emissao?.codigo ?? null },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const data = new Date().toISOString().slice(0, 10)
    const nome = `classificacao${consolidado ? '' : '-previa'}_${edital.slug}_${data}.pdf`

    console.log({ requestId, method: 'GET', path: `/api/admin/editais/${editalId}/classificacao`, status: 200, durationMs: Date.now() - start })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nome}"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return erro(500, 'INTERNAL_ERROR', 'Erro ao gerar o PDF.', requestId)
  }
}
