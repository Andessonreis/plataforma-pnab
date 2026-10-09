import { formatDate, formatDateTime } from '@/lib/utils/format'
import { contagemRegressiva, type UpcomingDeadline } from './prazos'

export interface EntradaAgora {
  recursoPendente: { inscricaoId: string; editalTitulo: string; fim: Date } | null
  nearestDeadline: UpcomingDeadline | null
  draftCount: number
  nearestDraft: { id: string; editalTitulo: string } | null
  editaisAbertosCount: number
}

/** Situação do bloco "agora"; a cor de cada uma fica em `agora-panel.tsx`. */
export type TomAgora = 'recurso' | 'prazo' | 'rascunho' | 'abertos' | 'livre'

export interface Agora {
  tom: TomAgora
  destaque: string
  detalhe: string
  complemento?: string
  cta: { label: string; href: string }
}

/**
 * Resolve a única coisa que mais importa pro proponente agora: prazo de
 * recurso aberto > prazo mais próximo > rascunho pendente > editais abertos.
 * O botão principal do painel segue a mesma prioridade.
 */
export function resolverAgora({
  recursoPendente,
  nearestDeadline,
  draftCount,
  nearestDraft,
  editaisAbertosCount,
}: EntradaAgora): Agora {
  if (recursoPendente) {
    return {
      tom: 'recurso',
      destaque: 'Prazo de recurso aberto',
      detalhe: recursoPendente.editalTitulo,
      complemento: `Envie até ${formatDateTime(recursoPendente.fim)}`,
      cta: { label: 'Enviar recurso', href: `/proponente/inscricoes/${recursoPendente.inscricaoId}#interpor-recurso` },
    }
  }

  if (nearestDeadline) {
    return {
      tom: 'prazo',
      destaque: contagemRegressiva(nearestDeadline.dataHora),
      detalhe: `${nearestDeadline.label}: ${nearestDeadline.editalTitulo}`,
      complemento: formatDate(nearestDeadline.dataHora),
      cta: { label: 'Ver edital', href: `/editais/${nearestDeadline.slug}` },
    }
  }

  if (draftCount > 0 && nearestDraft) {
    return {
      tom: 'rascunho',
      destaque: draftCount === 1 ? 'Um rascunho espera por você' : `${draftCount} rascunhos esperam por você`,
      detalhe: nearestDraft.editalTitulo,
      cta: { label: 'Continuar rascunho', href: `/proponente/inscricoes/${nearestDraft.id}/editar` },
    }
  }

  if (editaisAbertosCount > 0) {
    return {
      tom: 'abertos',
      destaque: editaisAbertosCount === 1 ? 'Há um edital aberto' : `Há ${editaisAbertosCount} editais abertos`,
      detalhe: 'Veja as regras e o que é preciso para se inscrever.',
      cta: { label: 'Ver editais', href: '/editais' },
    }
  }

  return {
    tom: 'livre',
    destaque: 'Nada pendente por aqui',
    detalhe: 'Quando sair um edital novo ou algo precisar da sua atenção, aparece neste lugar.',
    cta: { label: 'Ver editais', href: '/editais' },
  }
}
