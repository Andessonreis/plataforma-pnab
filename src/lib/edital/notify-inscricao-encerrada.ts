/**
 * Notifica a equipe interna (ADMIN ativos) quando um edital sai da fase
 * INSCRICOES_ABERTAS — disparado pela transição automática do scheduler.
 *
 * Duas listas completas em anexo (enviadas + rascunhos), reaproveitando o
 * mesmo gerador de PDF do relatório sob demanda (`gerarRelatorioPdfs`).
 * Não confundir com `notifyEquipeHabilitacaoAberta`, que é o lembrete da
 * fase seguinte (HABILITACAO), sem anexo.
 */

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mail'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { gerarRelatorioPdfs } from '@/lib/services/relatorio-inscricoes.service'

const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

export interface NotifyInscricaoEncerradaResult {
  admins: number
  totalEnviadas: number
  totalRascunhos: number
  enviado: boolean
}

export async function notifyEquipeInscricaoEncerrada(
  editalId: string,
): Promise<NotifyInscricaoEncerradaResult> {
  const [edital, admins, enviadas, rascunhos] = await Promise.all([
    prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true },
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN', ativo: true },
      select: { id: true, nome: true, email: true },
    }),
    gerarRelatorioPdfs({ status: 'ENVIADA', editalId }),
    gerarRelatorioPdfs({ status: 'RASCUNHO', editalId }),
  ])

  const totalEnviadas = enviadas.total
  const totalRascunhos = rascunhos.total
  const anexos = [...enviadas.anexos, ...rascunhos.anexos]

  // Sem admin pra receber, ou sem nenhum registro (nem enviado nem rascunho)
  // — não há PDF pra anexar, não há o que mandar.
  if (!edital || admins.length === 0 || anexos.length === 0) {
    return { admins: admins.length, totalEnviadas, totalRascunhos, enviado: false }
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')
  const url = `${base}/admin/habilitacao`
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  await Promise.all(
    admins.map((admin) =>
      sendEmail({
        to: admin.email,
        template: 'edital_inscricao_encerrada',
        attachments: anexos,
        data: {
          nomeAdmin: admin.nome,
          editalTitulo: edital.titulo,
          editalAno: edital.ano,
          totalEnviadas,
          totalRascunhos,
          dataGeracao,
          url,
        },
      }),
    ),
  )

  await logAudit({
    action: AUDIT_ACTIONS.RELATORIO_INSCRICOES_ENVIADO,
    entity: 'Edital',
    entityId: editalId,
    details: {
      titulo: edital.titulo,
      automatico: true,
      motivo: 'encerramento_inscricao',
      totalEnviadas,
      totalRascunhos,
      arquivos: anexos.length,
      destinatarios: admins.length,
    },
  })

  return { admins: admins.length, totalEnviadas, totalRascunhos, enviado: true }
}
