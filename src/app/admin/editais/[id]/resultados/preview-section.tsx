import { prisma } from '@/lib/db'
import { calculateResults } from '@/lib/results/calculate'
import { alocarVagasCategoria } from '@/lib/results/alocar-cotas'
import type { CategoriaConfig } from '@/types/categoria-config'
import { ResultadosPreview, type PreviewRow, type VagasConfig } from './resultados-preview'

const CONFIG_SEM_VAGAS_DISCRETAS = (nome: string | null): CategoriaConfig => ({
  nome: nome ?? '—',
  vagasAmplaConcorrencia: null,
  cotas: [],
  valorPorProjeto: null,
  valorTotalCategoria: 0,
})

interface Props {
  editalId: string
  vagas: VagasConfig
  categoriasConfig: CategoriaConfig[] | null
  hasFormula: boolean
}

/** Ranking-prévia: notas calculadas ao vivo, antes de publicar. */
export async function PreviewSection({ editalId, vagas, categoriasConfig, hasFormula }: Props) {
  const preview = await calculateResults(editalId)
  const infos = await prisma.inscricao.findMany({
    where: { id: { in: preview.map((p) => p.inscricaoId) } },
    select: { id: true, numero: true, _count: { select: { avaliacoes: true } } },
  })
  const infoMap = new Map(infos.map((i) => [i.id, { numero: i.numero, atribuidos: i._count.avaliacoes }]))

  // Com vagas por categoria: pré-calcula a mesma alocação (ampla + cotas +
  // remanejamento) que seria salva ao publicar, pra mostrar a faixa simulada correta.
  const statusPorInscricao = new Map<string, { status: string; posicaoCategoria: number }>()
  if (categoriasConfig && categoriasConfig.length > 0) {
    const porCategoria = new Map<string | null, typeof preview>()
    for (const p of preview) {
      if (!porCategoria.has(p.categoria)) porCategoria.set(p.categoria, [])
      porCategoria.get(p.categoria)!.push(p)
    }
    for (const [categoria, grupo] of porCategoria) {
      const config = categoriasConfig.find((c) => c.nome === categoria) ?? CONFIG_SEM_VAGAS_DISCRETAS(categoria)
      const alocacao = alocarVagasCategoria(
        grupo.map((p) => ({
          inscricaoId: p.inscricaoId,
          notaFinal: p.notaFinal,
          totalAvaliacoes: p.totalAvaliacoes,
          cotasOptIn: p.cotasOptIn ?? [],
        })),
        config,
        vagas.notaMinima,
        vagas.suplentes,
      )
      for (const a of alocacao) statusPorInscricao.set(a.inscricaoId, a)
    }
  }

  const rows: PreviewRow[] = preview.map((p) => ({
    inscricaoId: p.inscricaoId,
    numero: infoMap.get(p.inscricaoId)?.numero ?? '',
    proponenteNome: p.proponenteNome,
    categoria: p.categoria,
    notaFinal: p.notaFinal,
    finalizadas: p.totalAvaliacoes,
    atribuidos: infoMap.get(p.inscricaoId)?.atribuidos ?? p.totalAvaliacoes,
    empatado: !!(p.empatados && p.empatados.length > 0),
    statusPrevia: statusPorInscricao.get(p.inscricaoId)?.status as PreviewRow['statusPrevia'],
    posicaoCategoria: statusPorInscricao.get(p.inscricaoId)?.posicaoCategoria,
  }))

  return <ResultadosPreview rows={rows} vagas={vagas} hasFormula={hasFormula} />
}
