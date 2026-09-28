import { prisma } from '@/lib/db'
import { hrefResultados } from '@/lib/edital/rotas-resultado'
import { enqueueEmail } from '@/lib/queue'

interface AvisoDeResultado {
  inscricaoIds: string[]
  editalTitulo: string
  slug: string
  /** Resultado final ou preliminar: muda o assunto, o modelo do e-mail e a página do link. */
  final: boolean
}

/**
 * Enfileira o aviso de resultado a cada proponente. Falha ao enfileirar um e-mail não desfaz a
 * publicação, que já foi gravada: o aviso de um proponente não pode travar o resultado de todos.
 */
export async function avisarProponentesDoResultado({ inscricaoIds, editalTitulo, slug, final }: AvisoDeResultado): Promise<void> {
  const inscricoes = await prisma.inscricao.findMany({
    where: { id: { in: inscricaoIds } },
    include: { proponente: { select: { email: true } } },
  })
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const rotulo = final ? 'Resultado Final' : 'Resultado Preliminar'

  for (const inscricao of inscricoes) {
    try {
      await enqueueEmail({
        to: inscricao.proponente.email,
        subject: `${rotulo} — ${editalTitulo}`,
        template: final ? 'resultado_final' : 'resultado_preliminar',
        data: { edital: editalTitulo, url: `${baseUrl}${hrefResultados(slug, final)}` },
      })
    } catch {
      // segue para os demais proponentes
    }
  }
}
