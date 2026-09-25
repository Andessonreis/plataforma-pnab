import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button, Card, EmptyState, IconUsers } from '@/components/ui'
import { entrarModoEspelho } from './actions'

export const metadata: Metadata = {
  title: 'Ver como avaliador — Portal PNAB Irecê',
}

export default async function EscolhaEspelhoPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'SUPER_ADMIN') redirect('/avaliador/inscricoes')

  const avaliadores = await prisma.user.findMany({
    where: { role: 'AVALIADOR', ativo: true },
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      editalMembros: {
        where: { funcao: 'AVALIADOR' },
        select: { edital: { select: { id: true, titulo: true } } },
      },
    },
  })

  return (
    <section>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Ver como avaliador</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
          Escolha um avaliador para percorrer a área dele exatamente como ele vê, com as mesmas
          listas, filtros e formulários. O acesso é somente leitura e fica registrado na auditoria.
        </p>
      </header>

      {avaliadores.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconUsers className="h-8 w-8 text-slate-400" />}
            title="Nenhum avaliador ativo"
            description="Cadastre um usuário com o papel de avaliador para poder acompanhá-lo por aqui."
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Avaliadores">
          {avaliadores.map((avaliador) => (
            <li key={avaliador.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">{avaliador.nome}</h2>
              <p className="mt-1 flex-1 text-xs text-slate-500">
                {avaliador.editalMembros.length > 0
                  ? avaliador.editalMembros.map((m) => m.edital.titulo).join(' · ')
                  : 'Não está na equipe de nenhum edital'}
              </p>
              <form action={entrarModoEspelho} className="mt-4">
                <input type="hidden" name="avaliadorId" value={avaliador.id} />
                <Button type="submit" variant="outline" size="sm" className="min-h-[44px] w-full">
                  Ver como {avaliador.nome}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
