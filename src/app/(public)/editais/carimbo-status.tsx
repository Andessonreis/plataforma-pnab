import type { EditalStatus } from '@prisma/client'
import { CLOSED_STATUSES } from '@/lib/utils/edital-status'

interface CarimboStatusProps {
  status: EditalStatus
  label: string
  className?: string
}

/**
 * Cores do carimbo, tiradas dos conceitos que a identidade atribui a cada uma:
 * oliva é esperança e safra (o que está aberto), âmbar é vitalidade (o que foi
 * publicado e ainda vai abrir), tinta é o registro encerrado.
 */
function tomDoStatus(status: EditalStatus): string {
  if (status === 'INSCRICOES_ABERTAS') return 'border-oliva-700 bg-oliva-700/10 text-oliva-800'
  if (CLOSED_STATUSES.includes(status)) return 'border-tinta-400 bg-tinta-900/5 text-tinta-600'
  return 'border-accent-600 bg-accent-500/12 text-accent-800'
}

/**
 * Situação do edital como carimbo, não como pílula colorida.
 *
 * Documento oficial recebe carimbo, e é assim que a Secretaria comunica em
 * suas peças: retângulo de canto vivo, contorno grosso, texto em caixa alta
 * espaçada, batido levemente torto. A inclinação é o que separa a leitura de
 * "marca aplicada sobre o papel" da de "componente de interface".
 */
export function CarimboStatus({ status, label, className = '' }: CarimboStatusProps) {
  return (
    <span
      className={`inline-block -rotate-[1.5deg] border-2 px-2.5 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.16em] ${tomDoStatus(status)} ${className}`}
    >
      {label}
    </span>
  )
}
