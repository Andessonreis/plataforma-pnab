import { Card } from '@/components/ui'
import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { formatDateTime } from '@/lib/utils/format'
import { dadosDe, snapshotDe, type Resposta } from './tipos'

/**
 * Tabela a partir de 640px. As colunas juntam as perguntas de todas as versões
 * presentes na página, a mais recente primeiro, alinhadas pelo nome do campo —
 * a mesma regra da planilha exportada.
 */
export function RespostasTabela({ respostas }: { respostas: Resposta[] }) {
  const snapshots = [...respostas].sort((a, b) => b.versao - a.versao).map(snapshotDe)
  const colunas = colunasDosSnapshots(snapshots)

  return (
    <Card padding="sm" className="hidden overflow-hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Respostas recebidas, da mais recente para a mais antiga</caption>
          <thead>
            <tr className="bg-slate-50 text-left align-bottom">
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Protocolo</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Enviada em</th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Versão</th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Quem enviou</th>
              {colunas.map((c) => (
                <th key={c.chave} scope="col" className="min-w-[10rem] px-4 py-3 font-medium text-slate-600">{c.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {respostas.map((r) => {
              const dados = dadosDe(r)
              return (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-mono font-medium text-slate-900">{r.protocolo}</th>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.versao}</td>
                  <td className="px-4 py-3 text-slate-600">{[r.nome, r.email].filter(Boolean).join(', ') || '—'}</td>
                  {colunas.map((c) => (
                    <td key={c.chave} className="max-w-xs whitespace-pre-line break-words px-4 py-3 text-slate-800">
                      {valorDaColuna(dados, c.chave)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
