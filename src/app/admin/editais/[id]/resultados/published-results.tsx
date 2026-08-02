import { prisma } from '@/lib/db'
import type { CategoriaConfig } from '@/types/categoria-config'
import { TiebreakerPanel } from './tiebreaker-panel'
import { PublishedDesktopTable } from './published-desktop-table'
import { PublishedMobileCards } from './published-mobile-cards'
import type { PublishedRow } from './published-types'

interface Props {
  editalId: string
  categoriasConfig: CategoriaConfig[] | null
}

/** Tabela oficial pós-publicação (valores gravados no banco). */
export async function PublishedResults({ editalId, categoriasConfig }: Props) {
  const inscricoes = await prisma.inscricao.findMany({
    // Inabilitada não chega à avaliação — não entra na classificação do resultado.
    where: { editalId, status: { notIn: ['RASCUNHO', 'ENVIADA', 'INABILITADA'] } },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
      avaliacoes: { where: { finalizada: true }, select: { notaTotal: true } },
    },
    orderBy: [
      { posicao: { sort: 'asc', nulls: 'last' } },
      { notaFinal: { sort: 'desc', nulls: 'last' } },
    ],
  })

  const notaCount = new Map<number, number>()
  for (const i of inscricoes) {
    if (i.notaFinal != null) {
      const nota = Number(i.notaFinal)
      notaCount.set(nota, (notaCount.get(nota) ?? 0) + 1)
    }
  }
  const empatadas = new Set<number>()
  for (const [nota, count] of notaCount) {
    if (count > 1) empatadas.add(nota)
  }
  const hasEmpates = empatadas.size > 0

  const tiebreakerData = inscricoes.map((i) => ({
    inscricaoId: i.id,
    numero: i.numero,
    proponenteNome: i.proponente.nome,
    categoria: i.categoria,
    notaFinal: i.notaFinal ? Number(i.notaFinal) : null,
    posicao: i.posicao,
    status: i.status,
  }))

  if (inscricoes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Nenhuma inscrição classificável encontrada.</p>
        <p className="text-sm text-slate-400 mt-1">
          As inscrições precisam estar habilitadas e avaliadas para aparecer aqui.
        </p>
      </div>
    )
  }

  const usaCategorias = categoriasConfig != null && categoriasConfig.length > 0
  const grupos = usaCategorias
    ? [...new Map(inscricoes.map((i) => [i.categoria, i.categoria])).keys()].map((categoria) => ({
        categoria,
        itens: inscricoes.filter((i) => i.categoria === categoria),
      }))
    : [{ categoria: null, itens: inscricoes }]

  return (
    <>
      {hasEmpates && <TiebreakerPanel editalId={editalId} inscricoes={tiebreakerData} />}

      {grupos.map(({ categoria, itens }) => {
        const rows: PublishedRow[] = itens.map((inscricao, index) => {
          const nota = inscricao.notaFinal ? Number(inscricao.notaFinal) : null
          return {
            inscricaoId: inscricao.id,
            posicaoExibida: inscricao.posicao ?? index + 1,
            proponenteNome: inscricao.proponente.nome,
            numero: inscricao.numero,
            categoria: inscricao.categoria,
            totalAvaliacoes: inscricao.avaliacoes.length,
            notaFinal: nota,
            isEmpatada: nota != null && empatadas.has(nota),
            status: inscricao.status,
          }
        })

        return (
          <div key={categoria ?? '—'} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <p className="text-sm text-slate-500 px-4 pt-4">
              {usaCategorias && <span className="font-medium text-slate-700">{categoria ?? 'Sem categoria'} — </span>}
              {itens.length} inscrições classificáveis
            </p>
            <PublishedMobileCards rows={rows} mostraCategoria={!usaCategorias} />
            <PublishedDesktopTable rows={rows} mostraCategoria={!usaCategorias} />
          </div>
        )
      })}
    </>
  )
}
