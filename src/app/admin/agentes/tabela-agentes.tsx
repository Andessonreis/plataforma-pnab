/**
 * Prévia do recorte: cards no celular, tabela no desktop.
 * Mostra as colunas de contato; a exportação é que escolhe o conjunto completo.
 */
import { Badge, Card } from '@/components/ui'
import { valorDoCampo, type AgenteRow } from '@/lib/agentes/campos'
import { userRoleLabel } from '@/lib/status-maps'

const OPCOES = { mascararDocumento: false }

interface Props {
  agentes: Array<AgenteRow & { id: string }>
}

export function TabelaAgentes({ agentes }: Props) {
  return (
    <>
      <div className="sm:hidden space-y-3">
        {agentes.map((agente) => (
          <div
            key={agente.id}
            className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-medium text-slate-900 leading-snug">{agente.nome}</p>
              <Badge variant={agente.ativo ? 'success' : 'error'}>
                {agente.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{agente.email}</p>
            <p className="text-xs text-slate-500">{valorDoCampo(agente, 'telefone', OPCOES)}</p>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>{valorDoCampo(agente, 'tipo', OPCOES)}</span>
              <span>{valorDoCampo(agente, 'inscricoes', OPCOES)} inscrição(ões)</span>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm" className="overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">E-mail</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Telefone</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">CPF/CNPJ</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Perfil</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Inscrições</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {agentes.map((agente) => (
                <tr
                  key={agente.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-900">{agente.nome}</td>
                  <td className="py-3 px-4 text-slate-600">{agente.email}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {valorDoCampo(agente, 'telefone', OPCOES)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    {valorDoCampo(agente, 'cpfCnpj', OPCOES)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{valorDoCampo(agente, 'tipo', OPCOES)}</td>
                  <td className="py-3 px-4 text-slate-600">{userRoleLabel[agente.role]}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                      {agente.totalInscricoes}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {valorDoCampo(agente, 'cadastradoEm', OPCOES)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
