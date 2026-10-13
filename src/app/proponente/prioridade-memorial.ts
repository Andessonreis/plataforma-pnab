import type { TomAgora } from './agora'

/**
 * Onde o Memorial entra no painel:
 * - `memorial-agora`: abre o painel, antes do bloco "agora";
 * - `agora-memorial`: logo depois do "agora", lado a lado no desktop;
 * - `memorial-abaixo`: convite compacto no fim da coluna lateral.
 */
export type PosicaoMemorial = 'memorial-agora' | 'agora-memorial' | 'memorial-abaixo'

interface EntradaPrioridade {
  temVisitasPorVir: boolean
  totalInscricoes: number
  tomAgora: TomAgora
}

/**
 * Quem nunca se inscreveu em edital veio pelo Memorial: o bloco abre o
 * painel, porque o "agora" dessa conta é só sugestão de edital alheio. Quem
 * tem visita marcada vê o Memorial logo depois do "agora". O prazo de recurso
 * ou de edital, quando a conta participa de editais, nunca cede o topo.
 * Sem visita por vir e com inscrições, o Memorial vira convite discreto.
 */
export function posicaoDoMemorial({ temVisitasPorVir, totalInscricoes, tomAgora }: EntradaPrioridade): PosicaoMemorial {
  const participaDeEditais = totalInscricoes > 0
  const agoraCritico = tomAgora === 'recurso' || (tomAgora === 'prazo' && participaDeEditais)

  if (!participaDeEditais && !agoraCritico) return 'memorial-agora'
  if (temVisitasPorVir || !participaDeEditais) return 'agora-memorial'
  return 'memorial-abaixo'
}
