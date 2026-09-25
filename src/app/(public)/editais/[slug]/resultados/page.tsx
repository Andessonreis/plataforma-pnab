import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { resultadoDefinitivo } from '@/lib/edital/fase'
import { hrefResultados } from '@/lib/edital/rotas-resultado'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Endereço antigo da classificação, que os e-mails já enviados e os links
 * salvos ainda usam: leva para a página da fase em que o edital está.
 */
export default async function ResultadosAtual({ params }: Props) {
  const { slug } = await params
  const edital = await prisma.edital.findUnique({ where: { slug }, select: { status: true } })
  if (!edital) notFound()

  redirect(hrefResultados(slug, resultadoDefinitivo(edital.status)))
}
