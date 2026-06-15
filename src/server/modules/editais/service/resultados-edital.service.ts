import { AUDIT_ACTIONS, logAudit } from '@/lib/audit'
import { calculateResults, saveManualOrder, saveResults } from '@/lib/results/calculate'
import { enqueueEmail } from '@/lib/queue'
import { generateRelatorioFinal } from '@/lib/pdf/relatorio-final'
import { generateListaInscricoes } from '@/lib/pdf/lista-inscricoes'
import { inscricaoStatusLabel, cumulativeStatuses } from '@shared/status-maps'
import { BadRequestError } from '@server/lib/http/errors'
import { EditalNaoEncontradoError } from '@server/modules/editais/errors/editais.errors'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'
import type {
  ResultadosListagemDTO,
  PublicacaoResultadoDTO,
} from '@shared/dtos/resultados-edital.dto'
import { resultadosEditalRepository } from '../repository/resultados-edital.repository'

const STATUS_COM_NOTA = new Set<string>(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])
const ALLOWED_STATUSES_RELATORIO: EditalStatus[] = ['RESULTADO_FINAL', 'ENCERRADO']

export const resultadosEditalService = {
  async listar(editalId: string): Promise<ResultadosListagemDTO> {
    const edital = await resultadosEditalRepository.findEditalForListagem(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    const inscricoes = await resultadosEditalRepository.listInscricoesParaResultados(editalId)
    const filtered = inscricoes.filter((i) => !['RASCUNHO', 'ENVIADA'].includes(i.status))

    const notaGroups = new Map<number, number>()
    for (const i of filtered) {
      if (i.notaFinal != null) {
        const nota = Number(i.notaFinal)
        notaGroups.set(nota, (notaGroups.get(nota) ?? 0) + 1)
      }
    }
    const hasEmpates = Array.from(notaGroups.values()).some((count) => count > 1)

    return {
      edital: { id: edital.id, titulo: edital.titulo, status: edital.status },
      resultados: filtered.map((i, index) => ({
        posicao: i.posicao ?? index + 1,
        inscricaoId: i.id,
        numero: i.numero,
        proponenteNome: i.proponente.nome,
        categoria: i.categoria,
        notaFinal: i.notaFinal ? Number(i.notaFinal) : null,
        status: i.status,
        totalAvaliacoes: i.avaliacoes.length,
      })),
      hasEmpates,
    }
  },

  async publicar(
    editalId: string,
    fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL',
    ctx: { actorId: string; ip?: string | null },
  ): Promise<PublicacaoResultadoDTO> {
    const edital = await resultadosEditalRepository.findEditalForPublicacao(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    const resultados = await calculateResults(editalId)
    if (resultados.length === 0) {
      throw new BadRequestError('Nenhuma inscrição avaliada encontrada')
    }

    const hasEmpates = resultados.some((r) => r.empatados && r.empatados.length > 0)

    await saveResults(resultados, fase, {
      contemplados: edital.vagasContemplados,
      suplentes: edital.vagasSuplentes,
      notaMinima: edital.notaMinima ? Number(edital.notaMinima) : null,
    })

    await resultadosEditalRepository.updateEditalStatus(editalId, fase)

    const inscricoes = await resultadosEditalRepository.listInscricoesParaEmail(
      resultados.map((r) => r.inscricaoId),
    )

    const template = fase === 'RESULTADO_FINAL' ? 'resultado_final' : 'resultado_preliminar'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    for (const inscricao of inscricoes) {
      await enqueueEmail({
        to: inscricao.proponente.email,
        subject: `${fase === 'RESULTADO_FINAL' ? 'Resultado Final' : 'Resultado Preliminar'} — ${edital.titulo}`,
        template,
        data: {
          edital: edital.titulo,
          url: `${baseUrl}/editais/${edital.slug}/resultados`,
        },
      })
    }

    await logAudit({
      userId: ctx.actorId,
      action: fase === 'RESULTADO_FINAL' ? AUDIT_ACTIONS.RESULTADO_FINAL_PUBLICADO : AUDIT_ACTIONS.RESULTADO_PRELIMINAR_PUBLICADO,
      entity: 'Edital',
      entityId: editalId,
      details: { fase, totalInscricoes: resultados.length },
      ip: ctx.ip ?? undefined,
    })

    return {
      mensagem: `${fase === 'RESULTADO_FINAL' ? 'Resultado final' : 'Resultado preliminar'} publicado com sucesso`,
      totalInscricoes: resultados.length,
      hasEmpates,
    }
  },

  async reordenar(
    editalId: string,
    orderedIds: string[],
    ctx: { actorId: string; ip?: string | null },
  ): Promise<void> {
    await saveManualOrder(editalId, orderedIds)
    await logAudit({
      userId: ctx.actorId,
      action: 'DESEMPATE_MANUAL',
      entity: 'Edital',
      entityId: editalId,
      details: { orderedIds },
      ip: ctx.ip ?? undefined,
    })
  },

  async gerarRelatorioFinal(
    editalId: string,
    ctx: { actorId: string; ip?: string | null },
  ): Promise<{ buffer: Buffer; filename: string }> {
    const edital = await resultadosEditalRepository.findEditalForRelatorio(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    if (!ALLOWED_STATUSES_RELATORIO.includes(edital.status as EditalStatus)) {
      throw new BadRequestError(
        `Relatório final disponível apenas para editais em fase RESULTADO_FINAL ou ENCERRADO. Status atual: ${edital.status}`,
      )
    }

    const [contemplados, suplentes, naoContemplados] = await Promise.all([
      resultadosEditalRepository.listInscricoesPorStatus(editalId, 'CONTEMPLADA'),
      resultadosEditalRepository.listInscricoesPorStatus(editalId, 'SUPLENTE'),
      resultadosEditalRepository.listInscricoesPorStatus(editalId, 'NAO_CONTEMPLADA'),
    ])

    const mapItems = (items: typeof contemplados) =>
      items.map((insc, i) => ({
        posicao: i + 1,
        numero: insc.numero,
        nome: insc.proponente.nome,
        cpfCnpj: insc.proponente.cpfCnpj ?? '',
        categoria: insc.categoria,
        notaFinal: insc.notaFinal ? Number(insc.notaFinal) : null,
      }))

    const totalAvaliados = contemplados.length + suplentes.length + naoContemplados.length

    const buffer = await generateRelatorioFinal({
      edital: {
        titulo: edital.titulo,
        ano: edital.ano,
        slug: edital.slug,
        valorTotal: edital.valorTotal ? Number(edital.valorTotal) : null,
      },
      contemplados: mapItems(contemplados),
      suplentes: mapItems(suplentes),
      naoContemplados: mapItems(naoContemplados),
      totalAvaliados,
    })

    await logAudit({
      userId: ctx.actorId,
      action: AUDIT_ACTIONS.EXPORTACAO_RELATORIO_FINAL,
      entity: 'Edital',
      entityId: editalId,
      details: {
        slug: edital.slug,
        contemplados: contemplados.length,
        suplentes: suplentes.length,
        naoContemplados: naoContemplados.length,
        totalAvaliados,
      },
      ip: ctx.ip ?? undefined,
    })

    const datePart = new Date().toISOString().slice(0, 10)
    const filename = `relatorio_final_${edital.slug}_${datePart}.pdf`
    return { buffer, filename }
  },

  async gerarLista(
    editalId: string,
    status: InscricaoStatus,
    ctx: { actorId: string; ip?: string | null },
  ): Promise<{ buffer: Buffer; filename: string }> {
    const edital = await resultadosEditalRepository.findEditalForLista(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    const statusFilter = cumulativeStatuses[status]
    const orderByNota = statusFilter.some((s) => STATUS_COM_NOTA.has(s))

    const inscricoes = await resultadosEditalRepository.listInscricoesPorFiltro(
      editalId,
      statusFilter,
      orderByNota,
    )

    const statusLabel = inscricaoStatusLabel[status] ?? status
    const items = inscricoes.map((insc, i) => ({
      posicao: i + 1,
      numero: insc.numero,
      nome: insc.proponente.nome,
      cpfCnpj: insc.proponente.cpfCnpj ?? '',
      categoria: insc.categoria,
      notaFinal: insc.notaFinal ? Number(insc.notaFinal) : null,
      motivoInabilitacao: insc.motivoInabilitacao,
    }))

    const buffer = await generateListaInscricoes({
      edital: { titulo: edital.titulo, ano: edital.ano },
      status,
      statusLabel,
      inscricoes: items,
      total: items.length,
    })

    await logAudit({
      userId: ctx.actorId,
      action: AUDIT_ACTIONS.EXPORTACAO_LISTA_PDF,
      entity: 'Edital',
      entityId: editalId,
      details: { status, total: items.length, slug: edital.slug },
      ip: ctx.ip ?? undefined,
    })

    const datePart = new Date().toISOString().slice(0, 10)
    const filename = `lista_${status.toLowerCase()}_${edital.slug}_${datePart}.pdf`
    return { buffer, filename }
  },
}
