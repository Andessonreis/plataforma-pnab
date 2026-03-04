import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, FadeIn } from '@/components/ui'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = {
  title: 'Meu Perfil — Portal PNAB Irecê',
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      cpfCnpj: true,
      telefone: true,
      cep: true,
      logradouro: true,
      numero: true,
      complemento: true,
      bairro: true,
      cidade: true,
      uf: true,
      tipoProponente: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  const tipoLabels: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual',
    COLETIVO: 'Coletivo / Grupo',
  }

  return (
    <section>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Meu Perfil</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie suas informações pessoais.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Resumo */}
        <FadeIn delay={0.1}>
          <Card>
            <div className="text-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mt-3">{user.nome}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-3">
                <Badge variant="success">
                  {tipoLabels[user.tipoProponente ?? ''] ?? 'Proponente'}
                </Badge>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">CPF/CNPJ</dt>
                  <dd className="text-sm text-slate-900 font-mono">{user.cpfCnpj ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Telefone</dt>
                  <dd className="text-sm text-slate-900">{user.telefone ?? '—'}</dd>
                </div>
                {user.logradouro && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">Endereço</dt>
                    <dd className="text-sm text-slate-900">
                      {user.logradouro}{user.numero ? `, ${user.numero}` : ''}
                      {user.complemento ? ` — ${user.complemento}` : ''}
                      <br />
                      {user.bairro} — {user.cidade}/{user.uf}
                      <br />
                      <span className="font-mono text-xs">{user.cep}</span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Membro desde</dt>
                  <dd className="text-sm text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </FadeIn>

        {/* Formulário de edição */}
        <FadeIn delay={0.2} className="lg:col-span-2">
          <ProfileForm
            initialData={{
              nome: user.nome,
              email: user.email,
              telefone: user.telefone ?? '',
              cep: user.cep ?? '',
              logradouro: user.logradouro ?? '',
              numero: user.numero ?? '',
              complemento: user.complemento ?? '',
              bairro: user.bairro ?? '',
              cidade: user.cidade ?? '',
              uf: user.uf ?? '',
            }}
          />
        </FadeIn>
      </div>
    </section>
  )
}
