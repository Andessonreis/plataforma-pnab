import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ProfileForm } from './profile-form'
import { TourButton } from '../tour-button'
import { PASSOS_PERFIL } from './perfil-tour-steps'

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
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="titulo text-3xl text-tinta-950 sm:text-4xl">Meu Perfil</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta-700/70">
          Gerencie suas informações pessoais e de acesso.
        </p>
        <TourButton passos={PASSOS_PERFIL} className="mt-3" />
      </div>

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
          avatarUrl: user.avatarUrl,
          cpfCnpj: user.cpfCnpj,
          tipoProponente: user.tipoProponente,
          createdAt: user.createdAt,
        }}
      />
    </section>
  )
}
