/**
 * Relatório de inscrições por edital — geração dos PDFs e envio por e-mail
 * para a equipe da Secretaria. Disparado sob demanda pela tela de exportação.
 */
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { sendEmail, type EmailAttachment } from '@/lib/mail'
import { generateListaInscricoes } from '@/lib/pdf/lista-inscricoes'
import { inscricaoStatusLabel, cumulativeStatuses } from '@/lib/status-maps'
import { categoriaWhere, labelArea } from '@/lib/inscricoes/area-filter'
import type { InscricaoStatus } from '@prisma/client'

export interface RelatorioFiltro {
  status: InscricaoStatus
  editalId?: string
  categoria?: string
  /** Descarta cadastros de teste da equipe (nome contendo "teste"). */
  ocultarTeste?: boolean
}

export interface Destinatario {
  nome: string
  email: string
}

export interface RelatorioGerado {
  anexos: EmailAttachment[]
  /** Uma linha por edital, pronta pro corpo do e-mail. */
  resumo: string[]
  total: number
  /** Quantos registros foram descartados por parecerem cadastro de teste. */
  descartados: number
}

export interface EnvioResultado {
  enviados: string[]
  falhas: { email: string; motivo: string }[]
  total: number
  arquivos: number
}

const isCadastroTeste = (nome: string) => /teste/i.test(nome)

function dataBR(): string {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Busca as inscrições do recorte e devolve um PDF por edital.
 * Editais sem nenhuma inscrição no recorte simplesmente não geram arquivo.
 */
export async function gerarRelatorioPdfs(filtro: RelatorioFiltro): Promise<RelatorioGerado> {
  const where: Record<string, unknown> = {
    status: { in: cumulativeStatuses[filtro.status] },
  }
  if (filtro.editalId) where.editalId = filtro.editalId
  const recorteArea = categoriaWhere(filtro.categoria)
  if (recorteArea !== undefined) where.categoria = recorteArea

  const inscricoes = await prisma.inscricao.findMany({
    where,
    orderBy: [{ editalId: 'asc' }, { numero: 'asc' }],
    include: {
      edital: { select: { id: true, titulo: true, ano: true, slug: true } },
      proponente: { select: { nome: true, cpfCnpj: true, telefone: true } },
    },
  })

  const considerados = filtro.ocultarTeste
    ? inscricoes.filter((i) => !isCadastroTeste(i.proponente.nome))
    : inscricoes
  const descartados = inscricoes.length - considerados.length

  // Agrupa por edital preservando a ordem que veio do banco
  const porEdital = new Map<string, typeof considerados>()
  for (const insc of considerados) {
    const atual = porEdital.get(insc.edital.id) ?? []
    atual.push(insc)
    porEdital.set(insc.edital.id, atual)
  }

  const datePart = new Date().toISOString().slice(0, 10)
  const statusSlug = filtro.status.toLowerCase()
  const anexos: EmailAttachment[] = []
  const resumo: string[] = []

  for (const linhas of porEdital.values()) {
    const { titulo, ano, slug } = linhas[0].edital

    const buffer = await generateListaInscricoes({
      edital: { titulo, ano },
      status: filtro.status,
      statusLabel: inscricaoStatusLabel[filtro.status],
      total: linhas.length,
      inscricoes: linhas.map((insc, i) => ({
        posicao: i + 1,
        numero: insc.numero,
        nome: insc.proponente.nome,
        cpfCnpj: insc.proponente.cpfCnpj ?? '',
        categoria: insc.categoria,
        telefone: insc.proponente.telefone,
        notaFinal: insc.notaFinal ? Number(insc.notaFinal) : null,
        motivoInabilitacao: insc.motivoInabilitacao,
      })),
    })

    anexos.push({ filename: `${statusSlug}_${slug}_${datePart}.pdf`, content: buffer })
    resumo.push(`${titulo} — ${linhas.length} inscrição(ões)`)
  }

  return { anexos, resumo, total: considerados.length, descartados }
}

/**
 * Gera os PDFs e envia para cada destinatário, um e-mail por pessoa.
 * Falha de um destinatário não derruba os demais — o resultado reporta ambos.
 */
export async function enviarRelatorioInscricoes(params: {
  filtro: RelatorioFiltro
  destinatarios: Destinatario[]
  solicitanteId: string
  ip?: string
  baseUrl?: string
}): Promise<EnvioResultado> {
  const { filtro, destinatarios, solicitanteId, ip, baseUrl } = params

  const { anexos, resumo, total, descartados } = await gerarRelatorioPdfs(filtro)
  if (anexos.length === 0) {
    throw new Error('Nenhuma inscrição encontrada para o recorte selecionado.')
  }

  const dataGeracao = dataBR()
  const enviados: string[] = []
  const falhas: { email: string; motivo: string }[] = []

  for (const dest of destinatarios) {
    try {
      await sendEmail({
        to: dest.email,
        template: 'relatorio_inscricoes',
        attachments: anexos,
        data: {
          nome: dest.nome,
          statusLabel: inscricaoStatusLabel[filtro.status],
          dataGeracao,
          resumo,
          total,
          areaLabel: filtro.categoria ? labelArea(categoriaWhere(filtro.categoria)) : undefined,
          url: baseUrl ? `${baseUrl}/admin/inscricoes/export` : undefined,
        },
      })
      enviados.push(dest.email)
    } catch (err) {
      falhas.push({
        email: dest.email,
        motivo: err instanceof Error ? err.message : 'Falha desconhecida',
      })
    }
  }

  await logAudit({
    userId: solicitanteId,
    action: AUDIT_ACTIONS.RELATORIO_INSCRICOES_ENVIADO,
    entity: 'Inscricao',
    entityId: filtro.editalId,
    details: {
      status: filtro.status,
      editalId: filtro.editalId ?? 'todos',
      categoria: filtro.categoria ? labelArea(categoriaWhere(filtro.categoria)) : 'todas',
      ocultarTeste: filtro.ocultarTeste ?? false,
      totalInscricoes: total,
      descartadosTeste: descartados,
      arquivos: anexos.length,
      destinatarios: enviados.length,
      // E-mail de equipe interna, não de proponente — não é PII de cidadão
      enviadosPara: enviados.join(', '),
      falhas: falhas.length,
    },
    ip,
  })

  return { enviados, falhas, total, arquivos: anexos.length }
}
