import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscrição ${id}` }
}

export default async function InscricaoPage({ params }: Props) {
  const { id } = await params
  void id
  // TODO: Buscar inscrição, exibir stepper de status, anexos, avaliação (se disponível)
  return (
    <article>
      <h1>Detalhes da Inscrição</h1>
      {/* TODO: Stepper status, dados da proposta, download comprovante, abrir recurso */}
    </article>
  )
}
