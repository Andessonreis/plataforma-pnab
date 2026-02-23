import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes',
}

export default function FaqPage() {
  // TODO: Buscar FaqItems por edital e tema geral
  return (
    <section>
      <h1>Perguntas Frequentes</h1>
      {/* TODO: Accordion por tema + busca */}
    </section>
  )
}
