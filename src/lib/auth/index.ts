import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
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

        const cpfCnpj = credentials.cpfCnpj as string

        const user = await prisma.user.findUnique({
          where: { cpfCnpj },
        })

        if (!user || !user.ativo) {
          // Registra tentativa de login com falha (usuário inexistente ou inativo)
          await logAudit({
            action: AUDIT_ACTIONS.LOGIN_FALHA,
            entity: 'User',
            details: { motivo: !user ? 'usuario_nao_encontrado' : 'usuario_inativo' },
          })
          return null
        }

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )

        if (!senhaValida) {
          await logAudit({
            userId: user.id,
            action: AUDIT_ACTIONS.LOGIN_FALHA,
            entity: 'User',
            entityId: user.id,
            details: { motivo: 'senha_incorreta' },
          })
          return null
        }

        // Registra login bem-sucedido
        await logAudit({
          userId: user.id,
          action: AUDIT_ACTIONS.LOGIN,
          entity: 'User',
          entityId: user.id,
          details: { role: user.role },
        })

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
