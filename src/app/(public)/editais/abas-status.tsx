import { AbasFiltro } from '@/components/ui/abas-filtro'

export const ABAS = [
  { chave: 'todos', label: 'Todos', href: '/editais' },
  { chave: 'abertos', label: 'Abertos', href: '/editais?status=abertos' },
  { chave: 'encerrados', label: 'Encerrados', href: '/editais?status=encerrados' },
] as const

export type ChaveAba = (typeof ABAS)[number]['chave']

/** Filtro de situação dos editais, sobre as abas compartilhadas. */
export function AbasStatus({ ativa }: { ativa: ChaveAba }) {
  return <AbasFiltro abas={ABAS} ativa={ativa} rotulo="Filtrar editais por situação" />
}
