/**
 * Formulário de recorte da lista de agentes. Form GET puro: o filtro aplicado
 * fica na URL, então a página é compartilhável e o botão de exportar herda
 * exatamente o mesmo recorte.
 */
import { Button, Card } from '@/components/ui'
import { tipoProponenteLabel, userRoleLabel } from '@/lib/status-maps'
import type { FiltrosAgentes } from '@/lib/agentes/filtros'
import type { TipoProponente, UserRole } from '@prisma/client'

const PERFIS: UserRole[] = [
  'PROPONENTE',
  'AVALIADOR',
  'HABILITADOR',
  'ATENDIMENTO',
  'COMUNICACAO',
  'ADMIN',
  'SUPER_ADMIN',
]

const TIPOS: TipoProponente[] = ['PF', 'MEI', 'PJ', 'COLETIVO']

const CAMPO_CLASSE =
  'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]'

interface Props {
  filtros: FiltrosAgentes
}

export function FiltrosAgentesForm({ filtros }: Props) {
  return (
    <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
      <form method="get" action="/admin/agentes" className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">Perfil de acesso</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {PERFIS.map((perfil) => (
              <label key={perfil} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="perfis"
                  value={perfil}
                  defaultChecked={filtros.perfis.includes(perfil)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {userRoleLabel[perfil]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">Natureza do proponente</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {TIPOS.map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="tipos"
                  value={tipo}
                  defaultChecked={filtros.tipos?.includes(tipo) ?? false}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {tipoProponenteLabel[tipo]}
              </label>
            ))}
            <span className="text-xs text-slate-500 self-center">Nenhuma marcada = todas</span>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="busca" className="block text-sm font-medium text-slate-700 mb-1.5">
              Buscar
            </label>
            <input
              id="busca"
              name="busca"
              type="text"
              defaultValue={filtros.busca}
              placeholder="Nome, e-mail ou CPF/CNPJ..."
              className={CAMPO_CLASSE}
            />
          </div>

          <div>
            <label htmlFor="cidade" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              defaultValue={filtros.cidade}
              placeholder="Irecê"
              className={CAMPO_CLASSE}
            />
          </div>

          <div>
            <label htmlFor="situacao" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cadastro
            </label>
            <select id="situacao" name="situacao" defaultValue={filtros.situacao} className={CAMPO_CLASSE}>
              <option value="todos">Ativos e inativos</option>
              <option value="ativos">Somente ativos</option>
              <option value="inativos">Somente inativos</option>
            </select>
          </div>

          <div>
            <label htmlFor="inscricao" className="block text-sm font-medium text-slate-700 mb-1.5">
              Inscrições
            </label>
            <select id="inscricao" name="inscricao" defaultValue={filtros.inscricao} className={CAMPO_CLASSE}>
              <option value="todos">Com ou sem inscrição</option>
              <option value="com">Somente com inscrição</option>
              <option value="sem">Somente sem inscrição</option>
            </select>
          </div>

          <div>
            <label htmlFor="cadastradoDe" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cadastrado de
            </label>
            <input
              id="cadastradoDe"
              name="cadastradoDe"
              type="date"
              defaultValue={filtros.cadastradoDe}
              className={CAMPO_CLASSE}
            />
          </div>

          <div>
            <label htmlFor="cadastradoAte" className="block text-sm font-medium text-slate-700 mb-1.5">
              até
            </label>
            <input
              id="cadastradoAte"
              name="cadastradoAte"
              type="date"
              defaultValue={filtros.cadastradoAte}
              className={CAMPO_CLASSE}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Filtrar</Button>
          <Button href="/admin/agentes" variant="ghost">
            Limpar
          </Button>
        </div>
      </form>
    </Card>
  )
}
