import type { Metadata } from 'next'
import { getConfig } from '@/lib/memorial/config'
import { NavegacaoMemorial } from './_componentes/navegacao-memorial'

export async function generateMetadata(): Promise<Metadata> {
  const { titulo, chamada } = await getConfig('institucional')
  return {
    title: { default: titulo, template: `%s — ${titulo}` },
    description: chamada,
  }
}

/** Identidade da Secretaria (cores e tipografia) e a navegação própria do Memorial. */
export default async function MemorialLayout({ children }: { children: React.ReactNode }) {
  const { titulo } = await getConfig('institucional')

  return (
    <div className="tema-secult font-questrial">
      <NavegacaoMemorial nome={titulo} />
      {children}
    </div>
  )
}
