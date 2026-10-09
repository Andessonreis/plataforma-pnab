import Link from 'next/link'
import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { formatDateTime } from '@/lib/utils/format'
import { dadosDe, snapshotDe, type Resposta } from './tipos'

const th = 'px-4 py-3 text-left text-sm font-semibold text-tinta-800'

/**
 * Tabela a partir de 640px. As colunas juntam as perguntas de todas as versões
 * presentes na página, a mais recente primeiro, alinhadas pelo nome do campo:
 * a mesma regra da planilha exportada. Cada célula mostra até três linhas; a
 * resposta inteira abre pelo protocolo.
 */
export function RespostasTabela({ respostas, base }: { respostas: Resposta[]; base: string }) {
  const snapshots = [...respostas].sort((a, b) => b.versao - a.versao).map(snapshotDe)
  const colunas = colunasDosSnapshots(snapshots)

  return (
    <div className="hidden overflow-hidden rounded-xl border border-tinta-900/10 bg-white sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Respostas recebidas, da mais recente para a mais antiga</caption>
          <thead className="bg-papel-100">
            <tr className="align-bottom">
              <th scope="col" className={`${th} sticky left-0 bg-papel-100`}>Protocolo</th>
              <th scope="col" className={`${th} whitespace-nowrap`}>Enviada em</th>
              <th scope="col" className={th}>Quem enviou</th>
              {colunas.map((c) => (
                <th key={c.chave} scope="col" className={`${th} min-w-[12rem]`}>{c.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta-900/10">
            {respostas.map((r) => {
              const dados = dadosDe(r)
              return (
                <tr key={r.id} className="group align-top hover:bg-papel-50">
                  <th scope="row" className="sticky left-0 whitespace-nowrap bg-white px-4 group-hover:bg-papel-50 py-3 text-left font-semibold">
                    <Link href={`${base}/${r.id}`} className="tabular-nums text-brand-700 underline-offset-4 hover:underline">{r.protocolo}</Link>
                  </th>
                  <td className="whitespace-nowrap px-4 py-3 text-tinta-700">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-tinta-700">{[r.nome, r.email].filter(Boolean).join(', ') || 'Não informado'}</td>
                  {colunas.map((c) => (
                    <td key={c.chave} className="max-w-xs px-4 py-3 text-tinta-900">
                      <span className="line-clamp-3 whitespace-pre-line break-words">{valorDaColuna(dados, c.chave)}</span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
