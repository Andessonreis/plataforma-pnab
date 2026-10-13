import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { situacaoRecurso } from '@/lib/edital/recurso-proponente'
import { STATUS_POS_HABILITACAO_NAO_DIVULGADO } from '@/lib/edital/resultado-habilitacao'
import { listarVisitasDoPainel } from '@/lib/services/memorial-visitas-painel.service'
import type { EditalVigente } from './convite-editais'
import { compararDataHora, type UpcomingDeadline } from './prazos'

/** Visitas ao Memorial por vir (da mais próxima à mais distante), a última que passou e o total de pedidos. */
async function visitasMemorial(userId: string) {
  // O painel não pode cair por causa do Memorial (ex.: tabela ainda não
  // migrada num ambiente), então qualquer falha vira "sem visitas".
  try {
    return await listarVisitasDoPainel(userId)
  } catch {
    return { proximas: [], ultima: null, total: 0 }
  }
}

/** Um prazo por edital aberto (o próximo marco futuro), do mais urgente pro menos. */
function prazosDosEditaisAbertos(editais: EditalVigente[]): UpcomingDeadline[] {
  return editais
    .filter((edital) => edital.status === 'INSCRICOES_ABERTAS')
    .map((edital) => {
      const next = getNextDeadline(edital.cronograma)
      if (!next) return null
      return {
        editalId: edital.id,
        editalTitulo: edital.titulo,
        slug: edital.slug,
        label: next.label,
        dataHora: next.dataHora,
      }
    })
    .filter((d): d is UpcomingDeadline => d !== null)
    .sort((a, b) => compararDataHora(a.dataHora, b.dataHora))
    .slice(0, 3)
}

/** Reúne tudo o que o painel do proponente mostra, em uma única rodada de consultas. */
export async function carregarPainel(userId: string) {
  const [
    totalInscricoes,
    inscricoesPendentes,
    inscricoesContempladas,
    editaisAbertosCount,
    recentInscricoes,
    draftInscricoes,
    draftCount,
    editaisNaoEncerrados,
    recentNotifications,
    unreadNotificationsCount,
    inscricoesComRecurso,
    memorial,
  ] = await Promise.all([
    prisma.inscricao.count({ where: { proponenteId: userId } }),
    // "Pendente" pro proponente é o que ele ainda vê como "Em análise": inclui
    // ENVIADA de verdade e os status pós-habilitação/avaliação ainda não
    // liberados (mesmo critério de statusVisivelParaProponente), senão esse
    // contador cai sozinho quando a inscrição muda de status internamente,
    // vazando de forma indireta que ela avançou de fase.
    prisma.inscricao.count({
      where: {
        proponenteId: userId,
        OR: [
          { status: 'ENVIADA' },
          {
            status: { in: [...STATUS_POS_HABILITACAO_NAO_DIVULGADO] as InscricaoStatus[] },
            resultadoLiberadoEm: null,
          },
        ],
      },
    }),
    prisma.inscricao.count({ where: { proponenteId: userId, status: 'CONTEMPLADA' } }),
    prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    prisma.inscricao.findMany({
      where: { proponenteId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { edital: { select: { titulo: true, slug: true } } },
    }),
    prisma.inscricao.findMany({
      where: { proponenteId: userId, status: 'RASCUNHO' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: { edital: { select: { titulo: true, slug: true } } },
    }),
    prisma.inscricao.count({ where: { proponenteId: userId, status: 'RASCUNHO' } }),
    // Uma consulta serve aos prazos (só os abertos) e ao convite de quem ainda
    // não se inscreveu (abertos, publicados e em andamento). O portal tem
    // poucas dezenas de editais vivos ao mesmo tempo, então o teto não corta.
    prisma.edital.findMany({
      where: { status: { notIn: ['RASCUNHO', 'ENCERRADO'] } },
      select: { id: true, titulo: true, slug: true, status: true, cronograma: true, valorTotal: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.notification.count({ where: { userId, lidaEm: null } }),
    prisma.inscricao.findMany({
      where: {
        proponenteId: userId,
        status: { in: ['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE'] },
        resultadoLiberadoEm: { not: null },
      },
      select: {
        id: true,
        status: true,
        edital: { select: { titulo: true, cronograma: true } },
        recursos: { select: { fase: true } },
      },
    }),
    visitasMemorial(userId),
  ])

  // Inscrição com prazo de recurso aberto e ainda sem recurso: é a pendência
  // mais urgente do painel, porque o prazo é curto e só o proponente age.
  const recursoAberto = inscricoesComRecurso
    .map((i) => ({ i, situacao: situacaoRecurso(i.status, i.edital.cronograma, i.recursos.map((r) => r.fase)) }))
    .find(({ situacao }) => situacao?.aberto && situacao.janela?.fim)
  const recursoPendente = recursoAberto
    ? {
        inscricaoId: recursoAberto.i.id,
        editalTitulo: recursoAberto.i.edital.titulo,
        fim: recursoAberto.situacao!.janela!.fim!,
      }
    : null

  const primeiroRascunho = draftInscricoes[0]
  const nearestDraft = primeiroRascunho
    ? { id: primeiroRascunho.id, editalTitulo: primeiroRascunho.edital.titulo }
    : null

  const editaisVigentes: EditalVigente[] = editaisNaoEncerrados.map((e) => ({
    ...e,
    valorTotal: e.valorTotal === null ? null : Number(e.valorTotal),
  }))
  const prazos = prazosDosEditaisAbertos(editaisVigentes)

  return {
    totalInscricoes,
    inscricoesPendentes,
    inscricoesContempladas,
    editaisAbertosCount,
    recentInscricoes,
    draftInscricoes,
    draftCount,
    recentNotifications,
    unreadNotificationsCount,
    recursoPendente,
    nearestDraft,
    prazos,
    editaisVigentes,
    memorial,
  }
}
