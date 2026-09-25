import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { montarClassificacao } from '@/lib/results/classificacao'
import { bonusVisivelPara, opcoesDaClassificacao } from '@/lib/results/classificacao-opcoes'
import { generateListaClassificacao, type SituacaoClassificacao } from '@/lib/pdf/lista-classificacao'
import { gerarListaClassificacaoV1 } from '@/lib/pdf/template-1/lista-classificacao'
import { TEXTOS_POR_SITUACAO } from '@/lib/pdf/modelo/lista-classificacao'
import type { ListaClassificacaoData } from '@/lib/pdf/modelo/tipos'
import { resultadoDefinitivo } from '@/lib/edital/fase'
import { resolverTemplateResultado } from '@/lib/edital/template-resultado'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import type { TemplatePdf } from '@/lib/documentos/template'
import { MENSAGEM_TEMPLATE_INVALIDO, templateDaUrl } from '@/lib/documentos/template-query'
import { tituloRegistro } from '@/lib/documentos/titulos'
import { parseItensBonus } from '@/types/bonus-config'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

const PREFIXO_DO_ARQUIVO: Record<SituacaoClassificacao, string> = {
  PREVIA: 'classificacao-previa',
  CONSOLIDADA: 'classificacao',
  FINAL: 'resultado-final',
}

const GERADORES: Record<TemplatePdf, (dados: ListaClassificacaoData) => Promise<Buffer>> = {
  1: gerarListaClassificacaoV1,
  2: generateListaClassificacao,
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
// de quem receber. `?template=1|2` escolhe o layout; sem ele vale a última
// versão que quem emite usou naquele edital.
export async function GET(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    const role = session?.user.role
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return erro(403, 'FORBIDDEN', 'Acesso negado.', requestId)
    }

    const query = templateDaUrl(req.url)
    if (!query.success) return erro(400, 'BAD_REQUEST', MENSAGEM_TEMPLATE_INVALIDO, requestId)

    const { id: editalId } = await ctx.params

    const edital = await prisma.edital.findUnique({
      where: { id: editalId },
      select: {
        titulo: true, ano: true, slug: true, status: true,
        vagasSuplentes: true, notaMinima: true,
        categoriasConfig: true, bonusVisivelParaAdmin: true, itensBonus: true, resultadoTemplate: true,
      },
    })
    if (!edital) return erro(404, 'NOT_FOUND', 'Edital não encontrado.', requestId)

    const mostraBonus = bonusVisivelPara(role, edital)
    const consolidado =
      (await prisma.inscricao.count({ where: { editalId, notaFinal: { not: null } } })) > 0
    const situacao: SituacaoClassificacao = !consolidado
      ? 'PREVIA'
      : resultadoDefinitivo(edital.status) ? 'FINAL' : 'CONSOLIDADA'

    const categorias = await montarClassificacao(editalId, opcoesDaClassificacao(edital, mostraBonus))

    if (categorias.length === 0) {
      return erro(422, 'SEM_DADOS', 'Nenhuma inscrição avaliada para classificar ainda.', requestId)
    }

    const { foraDaClassificacao } = resolverTemplateResultado(edital.resultadoTemplate)
    const total = categorias.reduce((soma, c) => soma + c.linhas.length, 0)
    const template = query.data.template ?? await templatePreferido(session.user.id, editalId)

    // O hash sai dos dados da classificação, não do PDF: reemitir o mesmo
    // conteúdo precisa dar o mesmo identificador.
    const emissao = await registrarEmissao({
      tipo: 'CLASSIFICACAO',
      titulo: tituloRegistro({ tipo: 'CLASSIFICACAO', edital, situacao }),
      editalId,
      emitidoPorId: session.user.id,
      template,
      conteudo: categorias,
      metadados: {
        Categorias: categorias.length,
        Propostas: total,
        Bonificação: mostraBonus ? 'incluída na nota final' : 'não exibida',
        Situação: TEXTOS_POR_SITUACAO[situacao].situacao,
      },
    })

    const buffer = await GERADORES[template]({
      edital: { titulo: edital.titulo, ano: edital.ano },
      emissao,
      categorias: categorias.map((c) => ({
        nome: c.nome,
        vagasAmplaConcorrencia: c.vagasAmplaConcorrencia,
        cotas: c.cotas.map((cota) => ({ label: cota.label, vagas: cota.vagas })),
        valorPorProjeto: c.valorPorProjeto,
        linhas: c.linhas.map((l) => {
          // A lista oficial não classifica quem o resultado preliminar publicou fora da classificação.
          const fora = foraDaClassificacao.includes(l.numero)
          return {
            posicao: l.posicao,
            numero: l.numero,
            proponente: l.proponenteNome,
            notaBase: l.notaBase,
            notaBonus: l.notaBonus,
            notaFinal: l.notaFinal,
            cotista: l.cotista,
            bonusItens: l.bonusItens,
            status: fora ? 'NAO_SE_APLICA' : l.status,
            semAvaliacao: fora || l.semAvaliacao,
          }
        }),
      })),
      situacao,
      mostraBonus,
      bonus: mostraBonus ? parseItensBonus(edital.itensBonus) : null,
      geradoEm: new Date(),
    })

    await logAudit({
      userId: session.user.id,
      action: 'EXPORTACAO_CLASSIFICACAO_PDF',
      entity: 'Edital',
      entityId: editalId,
      details: { total, categorias: categorias.length, consolidado, situacao, comBonus: mostraBonus, codigo: emissao?.codigo ?? null },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const data = new Date().toISOString().slice(0, 10)
    const nome = `${PREFIXO_DO_ARQUIVO[situacao]}_${edital.slug}_${data}.pdf`

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
