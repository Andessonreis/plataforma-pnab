/**
 * Notifica a equipe interna (ADMIN ativos) quando um edital entra na
 * fase de HABILITACAO. Disparado tanto pela transição automática
 * (scheduler.worker) quanto pela manual (rota /avancar-fase).
 *
 * Não confundir com o template `habilitacao`, que comunica o RESULTADO
 * individual (HABILITADA/INABILITADA) ao proponente. Aqui é só um
 * lembrete operacional pra equipe da Secretaria.
 */

import { prisma } from '@server/lib/db'
import { enqueueEmail } from '@server/lib/queue'
import { getBaseUrl } from '@server/lib/config'

export interface NotifyHabilitacaoAbertaResult {
  admins: number
  inscricoesPendentes: number
}

export async function notifyEquipeHabilitacaoAberta(
  editalId: string,
): Promise<NotifyHabilitacaoAbertaResult> {
  const [edital, admins, inscricoesPendentes] = await Promise.all([
    prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true },
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN', ativo: true },
      select: { nome: true, email: true },
    }),
    prisma.inscricao.count({
      where: { editalId, status: 'ENVIADA' },
    }),
  ])

  if (!edital || admins.length === 0) {
    return { admins: admins.length, inscricoesPendentes }
  }

  const base = getBaseUrl()
  const url = `${base}/admin/habilitacao`

  await Promise.all(
    admins.map((admin) =>
      enqueueEmail({
        to: admin.email,
        template: 'equipe_habilitacao_pendente',
        data: {
          nomeAdmin: admin.nome,
          editalTitulo: edital.titulo,
          editalAno: edital.ano,
          inscricoesPendentes,
          url,
        },
      }),
    ),
  )

  return { admins: admins.length, inscricoesPendentes }
}
