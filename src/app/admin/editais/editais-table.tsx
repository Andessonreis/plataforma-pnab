import { Card } from '@/components/ui'
import { EditalTableRow } from './edital-table-row'
import type { EditalListItem } from './edital-mobile-card'

interface EditaisTableProps {
  editais: EditalListItem[]
}

function EditaisTable({ editais }: EditaisTableProps) {
  return (
    <Card padding="sm" className="overflow-hidden hidden lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="w-[24%] text-left py-3 px-4 font-medium text-slate-600">Título</th>
              <th className="w-[6%] text-left py-3 px-4 font-medium text-slate-600">Ano</th>
              <th className="w-[16%] text-left py-3 px-4 font-medium text-slate-600">Status</th>
              <th className="w-[18%] text-left py-3 px-4 font-medium text-slate-600">Categorias</th>
              <th className="w-[11%] text-right py-3 px-4 font-medium text-slate-600">Valor Total</th>
              <th className="w-[8%] text-center py-3 px-4 font-medium text-slate-600">Inscrições</th>
              <th className="w-[17%] text-right py-3 px-4 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {editais.map((edital) => (
              <EditalTableRow key={edital.id} edital={edital} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export { EditaisTable }
