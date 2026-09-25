import { FaixaEspelho } from '@/components/espelho/faixa-espelho'

/** Faixa do modo espelho no topo das telas de habilitação; some fora do espelho. */
export function AvisoEspelho({ nome }: { nome: string | null }) {
  if (!nome) return null
  return <FaixaEspelho papel="HABILITADOR" nome={nome} className="mb-5 rounded-lg border" />
}
