import type { InscricaoStatus } from '@prisma/client'
import { AbasFiltro } from '@/components/ui/abas-filtro'
import { STATUS_BUCKETS, contarBucket, type StatusBucketKey } from './status-buckets'

interface StatusTabsProps {
  activeKey: StatusBucketKey
  contagemPorStatus: Map<InscricaoStatus, number>
  totalGeral: number
}

/**
 * Filtro por situação nas abas de pasta compartilhadas com /editais. Grupo
 * vazio não vira aba: quem nunca foi contemplado não precisa de uma aba
 * "Contempladas (0)" disputando espaço no celular. A aba ativa sempre fica,
 * mesmo zerada, para o filtro aberto pela URL não sumir da tela.
 */
export function StatusTabs({ activeKey, contagemPorStatus, totalGeral }: StatusTabsProps) {
  const abas = (Object.keys(STATUS_BUCKETS) as StatusBucketKey[])
    .map((chave) => ({ chave, contagem: contarBucket(STATUS_BUCKETS[chave].statuses, contagemPorStatus, totalGeral) }))
    .filter(({ chave, contagem }) => chave === 'todas' || chave === activeKey || contagem > 0)
    .map(({ chave, contagem }) => ({
      chave,
      label: `${STATUS_BUCKETS[chave].label} (${contagem})`,
      href: chave === 'todas' ? '/proponente/inscricoes' : `/proponente/inscricoes?status=${chave}`,
    }))

  // No celular as abas correm numa fileira só, com rolagem lateral: quebradas
  // em três linhas, as abas de pasta perdiam a aresta comum e viravam botões
  // soltos. A última aba aparece cortada na borda, o que já indica a rolagem.
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0 [&>nav]:w-max [&>nav]:min-w-full [&>nav]:flex-nowrap sm:[&>nav]:w-auto sm:[&>nav]:flex-wrap">
      <AbasFiltro abas={abas} ativa={activeKey} rotulo="Filtrar inscrições por situação" />
    </div>
  )
}
