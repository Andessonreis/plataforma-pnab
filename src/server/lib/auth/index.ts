import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { authConfig } from './config'
import type { UserRole } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        // Login bem-sucedido
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
})
