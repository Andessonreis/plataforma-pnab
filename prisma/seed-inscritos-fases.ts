import { PrismaClient, type InscricaoStatus, type EditalStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Complementa o seed principal: garante pelo menos 1 inscrição em cada edital
 * que ainda estiver com 0, usando um status de inscrição coerente com a fase
 * do edital — pra dar pra ver a tela de visão geral (admin/editais/[id])
 * populada em qualquer fase, não só no edital encerrado do seed.ts.
 */
const STATUS_POR_FASE: Partial<Record<EditalStatus, InscricaoStatus>> = {
  RASCUNHO: 'ENVIADA',
  PUBLICADO: 'ENVIADA',
  INSCRICOES_ABERTAS: 'ENVIADA',
  INSCRICOES_ENCERRADAS: 'ENVIADA',
  HABILITACAO: 'HABILITADA',
  AVALIACAO: 'EM_AVALIACAO',
  RESULTADO_PRELIMINAR: 'RESULTADO_PRELIMINAR',
  RECURSO: 'RECURSO_ABERTO',
  RESULTADO_FINAL: 'CONTEMPLADA',
  ENCERRADO: 'CONTEMPLADA',
}

function slugParaNumero(slug: string, indice: number): string {
  return `SEED-${slug.toUpperCase().replace(/-/g, '_').slice(0, 20)}-${String(indice).padStart(3, '0')}`
}

async function main() {
  const proponentes = await prisma.user.findMany({
    where: { role: 'PROPONENTE' },
    select: { id: true, nome: true },
  })

  if (proponentes.length === 0) {
    console.log('⚠ Nenhum proponente encontrado — rode o seed principal (npm run db:seed) primeiro.')
    return
  }

  const editais = await prisma.edital.findMany({
    select: { id: true, slug: true, status: true, categorias: true, _count: { select: { inscricoes: true } } },
  })

  let criadas = 0

  for (let i = 0; i < editais.length; i++) {
    const edital = editais[i]
    if (edital._count.inscricoes > 0) continue

    const status = STATUS_POR_FASE[edital.status as EditalStatus] ?? 'ENVIADA'
    const proponente = proponentes[i % proponentes.length]
    const numero = slugParaNumero(edital.slug, 1)

    const existing = await prisma.inscricao.findUnique({ where: { numero } })
    if (existing) continue

    await prisma.inscricao.create({
      data: {
        numero,
        editalId: edital.id,
        proponenteId: proponente.id,
        status,
        categoria: edital.categorias[0] ?? null,
        campos: JSON.stringify({ nomeProjeto: `Projeto de teste — ${proponente.nome}` }),
        submittedAt: new Date(),
      },
    })

    criadas++
    console.log(`  + ${numero} (${status}) em "${edital.slug}"`)
  }

  console.log(`✔ ${criadas} inscrição(ões) de teste criada(s) para popular fases sem inscritos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
