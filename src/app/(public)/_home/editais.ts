import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getStatusDisplay, OPEN_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'
import type { BadgeVariant } from '@/components/ui/badge'
import type { EditalResumo } from '@/components/home/types'

// Editais em andamento p/ o painel de oportunidades da home — mais amplo que
// OPEN_STATUSES (que em /editais marca "aberto" só até inscrição): aqui um
// edital em habilitação ou avaliação ainda está rolando, só não recebe mais
// inscrição. Não reaproveita OPEN_STATUSES pra não mudar a aba "Abertos" de
// /editais nem o carimbo de arquivado dos cards.
const HOME_EDITAIS_STATUSES: EditalStatus[] = [...OPEN_STATUSES, 'HABILITACAO', 'AVALIACAO']

// O painel de abertura anuncia oportunidades, então editais recebendo
// inscrição vêm antes dos apenas publicados.
const prioridadeStatus = (status: string) => (status === 'INSCRICOES_ABERTAS' ? 0 : 1)

/** Até três editais em andamento para o painel da abertura, já formatados. */
export async function buscarEditaisAbertura(): Promise<EditalResumo[]> {
  const editais = await prisma.edital.findMany({
    // Banner exibe editais em andamento (aberto, habilitação ou
    // avaliação) — encerrados não entram nem pra completar as 3 vagas.
    where: { status: { in: HOME_EDITAIS_STATUSES } },
    orderBy: { createdAt: 'desc' },
    // Busca além dos 3 exibidos para conseguir promover os que estão com
    // inscrições abertas antes de cortar a lista.
    take: 8,
    select: {
      id: true,
      titulo: true,
      slug: true,
      status: true,
      valorTotal: true,
      categorias: true,
      cronograma: true,
    },
  })

  return [...editais]
    .sort((a, b) => prioridadeStatus(a.status) - prioridadeStatus(b.status))
    .slice(0, 3)
    .map((edital) => {
      const status = getStatusDisplay(edital.status)
      const prazo = getNextDeadline(edital.cronograma)
      return {
        id: edital.id,
        titulo: edital.titulo,
        slug: edital.slug,
        categoria: edital.categorias[0] ?? 'Fomento à cultura',
        valor: formatCurrency(edital.valorTotal),
        statusLabel: status.label,
        statusVariant: status.badgeVariant as BadgeVariant,
        prazoLabel: prazo ? `${prazo.label}: ${formatDate(prazo.dataHora)}` : null,
      }
    })
}
