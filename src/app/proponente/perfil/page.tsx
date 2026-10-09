import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CabecalhoPagina } from '../_componentes/cabecalho-pagina'
import { ProfileForm } from './profile-form'
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
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoPagina
        id="tour-perfil-header"
        titulo="Meu perfil"
        resumo="Os dados que a Secretaria usa para falar com você e que saem nas suas inscrições."
        passosTour={PASSOS_PERFIL}
      />

      <div className="mt-10">
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
      </div>
    </div>
  )
}
