import { prisma } from '@/lib/db'
import { Card } from '@/components/ui'
import { formatDateTime } from '@/lib/utils/format'
import { listarVersoes, type EntidadeMemorial } from '@/lib/services/memorial-conteudo.service'

const QUANTAS = 10

/** Campos simples do snapshot (texto, número, sim/não), na ordem em que foram gravados. */
function camposLegiveis(snapshot: unknown): [string, string][] {
  if (!snapshot || typeof snapshot !== 'object') return []
  return Object.entries(snapshot as Record<string, unknown>)
    .filter(([chave, valor]) => !['id', 'createdAt', 'updatedAt'].includes(chave) && valor !== null && typeof valor !== 'object')
    .map(([chave, valor]) => {
      const texto = typeof valor === 'boolean' ? (valor ? 'sim' : 'não') : String(valor)
      return [chave, texto.length > 280 ? `${texto.slice(0, 280)}…` : texto]
    })
}

/**
 * Versões gravadas a cada alteração. Mostra as últimas dez, cada uma abrindo o
 * que estava registrado naquele momento.
 */
export async function HistoricoVersoes({
  entidade,
  entidadeId,
  titulo = 'Histórico de versões',
}: {
  entidade: EntidadeMemorial
  entidadeId: string
  titulo?: string
}) {
  const { itens, total } = await listarVersoes(entidade, entidadeId, { page: 1, pageSize: QUANTAS })
  const autores = await prisma.user.findMany({
    where: { id: { in: itens.map((v) => v.criadoPorId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, nome: true },
  })
  const nomeDe = new Map(autores.map((a) => [a.id, a.nome]))

  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {total === 0 ? 'Nenhuma versão gravada ainda.' : `${total} ${total === 1 ? 'versão gravada' : 'versões gravadas'}.`}
        {total > QUANTAS && ` Mostrando as ${QUANTAS} mais recentes.`}
      </p>
      <ol className="mt-4 space-y-2">
        {itens.map((v) => (
          <li key={v.id}>
            <details className="rounded-lg border border-slate-200 px-3 py-2">
              <summary className="flex min-h-[44px] cursor-pointer items-center text-sm text-slate-800">
                Versão {v.versao} · {formatDateTime(v.createdAt)}
                {v.criadoPorId && nomeDe.get(v.criadoPorId) ? ` · ${nomeDe.get(v.criadoPorId)}` : ''}
              </summary>
              <dl className="mt-2 grid gap-x-4 gap-y-1 pb-2 text-xs sm:grid-cols-[10rem_1fr]">
                {camposLegiveis(v.snapshot).map(([chave, valor]) => (
                  <div key={chave} className="contents">
                    <dt className="font-medium text-slate-500">{chave}</dt>
                    <dd className="whitespace-pre-line break-words text-slate-800">{valor}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </Card>
  )
}
