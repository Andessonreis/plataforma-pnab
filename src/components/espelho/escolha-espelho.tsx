import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { entrarModoEspelho } from '@/lib/espelho/actions'
import { ESPELHO, type PapelEspelho } from '@/lib/espelho/papeis'
import { Button, Card, EmptyState, IconUsers } from '@/components/ui'

/**
 * Tela em que o SUPER_ADMIN escolhe quem acompanhar no modo espelho. É a mesma
 * para todo papel: muda só a lista e os textos, que vêm de `ESPELHO`.
 */
export async function EscolhaEspelho({ papel }: { papel: PapelEspelho }) {
  const { rotulo, inicio, semEquipe } = ESPELHO[papel]

  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'SUPER_ADMIN') redirect(inicio)

  const usuarios = await prisma.user.findMany({
    where: { role: papel, ativo: true },
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      editalMembros: {
        where: { funcao: papel },
        select: { edital: { select: { id: true, titulo: true } } },
      },
    },
  })

  return (
    <section>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Ver como {rotulo}</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
          Escolha um {rotulo} para percorrer a área dele exatamente como ele vê, com as mesmas
          listas, filtros e ações. O acesso é somente leitura e fica registrado na auditoria.
        </p>
      </header>

      {usuarios.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconUsers className="h-8 w-8 text-slate-400" />}
            title={`Nenhum ${rotulo} ativo`}
            description={`Cadastre um usuário com o papel de ${rotulo} para poder acompanhá-lo por aqui.`}
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={`Lista de ${rotulo}es`}>
          {usuarios.map((usuario) => (
            <li key={usuario.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">{usuario.nome}</h2>
              <p className="mt-1 flex-1 text-xs text-slate-500">
                {usuario.editalMembros.length > 0
                  ? usuario.editalMembros.map((m) => m.edital.titulo).join(' · ')
                  : semEquipe}
              </p>
              <form action={entrarModoEspelho} className="mt-4">
                <input type="hidden" name="papel" value={papel} />
                <input type="hidden" name="usuarioId" value={usuario.id} />
                <Button type="submit" variant="outline" size="sm" className="min-h-[44px] w-full">
                  Ver como {usuario.nome}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
