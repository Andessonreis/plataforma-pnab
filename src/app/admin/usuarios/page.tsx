import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'
import type { UserRole } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Usuarios — Portal PNAB Irece',
}

interface Props {
  searchParams: Promise<{
    page?: string
    role?: string
    search?: string
  }>
}

const roleLabels: Record<UserRole, string> = {
  PROPONENTE: 'Proponente',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
  ADMIN: 'Administrador',
}

const roleBadgeVariant: Record<UserRole, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  PROPONENTE: 'neutral',
  ATENDIMENTO: 'info',
  HABILITADOR: 'warning',
  AVALIADOR: 'success',
  ADMIN: 'error',
}

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const roleFilter = params.role || undefined
  const searchQuery = params.search || undefined

  const where: Record<string, unknown> = {}
  if (roleFilter) where.role = roleFilter
  if (searchQuery) {
    where.OR = [
      { nome: { contains: searchQuery, mode: 'insensitive' } },
      { email: { contains: searchQuery, mode: 'insensitive' } },
      { cpfCnpj: { contains: searchQuery } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nome: true,
        email: true,
        cpfCnpj: true,
        role: true,
        ativo: true,
        createdAt: true,
        _count: { select: { inscricoes: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const allRoles: UserRole[] = ['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']

  const filterParams = new URLSearchParams()
  if (roleFilter) filterParams.set('role', roleFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/usuarios${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-slate-600 mt-1">{total} usuario(s) encontrado(s)</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6" padding="md">
        <form method="get" action="/admin/usuarios" className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">
              Buscar
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={searchQuery}
              placeholder="Nome, e-mail ou CPF/CNPJ..."
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">
              Perfil
            </label>
            <select
              id="role"
              name="role"
              defaultValue={roleFilter}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">Todos</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
            >
              Filtrar
            </button>
            <a
              href="/admin/usuarios"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center"
            >
              Limpar
            </a>
          </div>
        </form>
      </Card>

      {users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhum usuario encontrado</h2>
            <p className="text-slate-500 mt-1">Ajuste os filtros.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">CPF/CNPJ</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">E-mail</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Perfil</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Inscricoes</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{user.nome}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{user.cpfCnpj ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={roleBadgeVariant[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {user._count.inscricoes}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.ativo ? 'success' : 'error'}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
