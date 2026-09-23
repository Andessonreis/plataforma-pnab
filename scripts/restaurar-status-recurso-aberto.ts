/**
 * Restaura o resultado publicado das inscrições que ficaram presas em
 * RECURSO_ABERTO.
 *
 * Protocolar recurso sobrescrevia `Inscricao.status` com RECURSO_ABERTO,
 * apagando o resultado publicado (CONTEMPLADA/SUPLENTE/NAO_CONTEMPLADA) e
 * carimbando "Em recurso" ao lado do nome da pessoa na lista pública. O código
 * já não faz isso; este script conserta quem passou pelo comportamento antigo.
 *
 * O status original não está no banco — é recalculado por `montarClassificacao`,
 * a mesma rotina que a publicação usa. Nota e posição publicadas não são
 * tocadas: só o status volta ao lugar.
 *
 *   npx tsx scripts/restaurar-status-recurso-aberto.ts <slug>           # simula
 *   npx tsx scripts/restaurar-status-recurso-aberto.ts <slug> --aplicar # grava
 */
import { PrismaClient, type InscricaoStatus } from '@prisma/client'
import { montarClassificacao } from '../src/lib/results/classificacao'
import type { CategoriaConfig } from '../src/types/categoria-config'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2]
  const aplicar = process.argv.includes('--aplicar')
  if (!slug) throw new Error('Informe o slug do edital.')

  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: {
      id: true, titulo: true, categoriasConfig: true,
      notaMinima: true, vagasSuplentes: true,
    },
  })
  if (!edital) throw new Error(`Edital "${slug}" não encontrado.`)

  const presas = await prisma.inscricao.findMany({
    where: { editalId: edital.id, status: 'RECURSO_ABERTO' },
    select: { id: true, numero: true, categoria: true },
  })

  if (presas.length === 0) {
    console.log('Nenhuma inscrição em RECURSO_ABERTO. Nada a fazer.')
    return
  }

  console.log(`${edital.titulo}`)
  console.log(`${presas.length} inscrição(ões) em RECURSO_ABERTO\n`)

  const categorias = await montarClassificacao(edital.id, {
    incluirBonus: true,
    notaMinima: edital.notaMinima ? Number(edital.notaMinima) : null,
    maxSuplentes: edital.vagasSuplentes,
    categoriasConfig: Array.isArray(edital.categoriasConfig)
      ? (edital.categoriasConfig as unknown as CategoriaConfig[])
      : null,
  })

  const statusPorInscricao = new Map<string, string>()
  for (const categoria of categorias) {
    for (const linha of categoria.linhas) {
      statusPorInscricao.set(linha.inscricaoId, linha.status)
    }
  }

  let restauradas = 0
  for (const inscricao of presas) {
    const destino = statusPorInscricao.get(inscricao.id)
    if (!destino) {
      console.log(`  ! ${inscricao.numero} — não apareceu no recálculo, conferir na mão`)
      continue
    }
    console.log(`  ${inscricao.numero} (${inscricao.categoria ?? 'sem categoria'}): RECURSO_ABERTO → ${destino}`)
    if (aplicar) {
      // Só o status. Nota e posição publicadas ficam como estão.
      await prisma.inscricao.update({
        where: { id: inscricao.id },
        data: { status: destino as InscricaoStatus },
      })
    }
    restauradas++
  }

  console.log()
  console.log(aplicar
    ? `${restauradas} inscrição(ões) restaurada(s).`
    : 'Simulação. Rode de novo com --aplicar para gravar.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
