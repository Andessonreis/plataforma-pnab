import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { UserRole } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        cpfCnpj: { label: 'CPF / CNPJ', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.cpfCnpj || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { cpfCnpj: credentials.cpfCnpj as string },
        })

        if (!user || !user.ativo) return null

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )

        if (!senhaValida) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: UserRole }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as UserRole
      return session
    },
  },
})
