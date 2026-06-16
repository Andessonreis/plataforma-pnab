import { Card } from '@client/components/ui'
import type { Prisma } from '@prisma/client'

interface InformacoesGeraisCardProps {
  numero: string
  categoria: string | null
  submittedAt: Date | null
  notaFinal: Prisma.Decimal | null
  editalStatus: string
  formulaAvaliacao: string | null
  resultadoVisivel: boolean
}

export function InformacoesGeraisCard({
  numero,
  categoria,
  submittedAt,
  notaFinal,
  formulaAvaliacao,
  resultadoVisivel,
}: InformacoesGeraisCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações Gerais</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm font-medium text-slate-500">Número</dt>
          <dd className="text-sm text-slate-900 font-mono">{numero}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Categoria</dt>
          <dd className="text-sm text-slate-900">{categoria ?? 'Não informada'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Data de Envio</dt>
          <dd className="text-sm text-slate-900">
            {submittedAt
              ? new Date(submittedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Sao_Paulo',
                })
              : 'Não enviada'}
          </dd>
        </div>
        {resultadoVisivel && notaFinal && (
          <div>
            <dt className="text-sm font-medium text-slate-500">{formulaAvaliacao ? 'Pontuação Final' : 'Nota Final'}</dt>
            <dd className="text-sm text-slate-900 font-bold">
              {Number(notaFinal).toFixed(2)}{formulaAvaliacao ? ' pts' : ''}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}
