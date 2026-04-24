import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from '@prisma/client'

// Configuração compatível com Edge Runtime (sem bcrypt, prisma, etc.)
// Usada pelo middleware para verificar sessão JWT.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/sair',
    error: '/login',
  },
  providers: [],
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
}
