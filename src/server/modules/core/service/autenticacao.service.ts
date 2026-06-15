import { AUDIT_ACTIONS, logAudit } from '@/lib/audit'
import { hashPassword, needsRehash, verifyPassword } from '@server/lib/auth/password'
import { signAccessToken } from '@server/lib/auth/jwt'
import {
  issueRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshTokenByJti,
  validateRefreshToken,
} from '@server/lib/auth/tokens'
import type { UserRole } from '@shared/enums/user-role'
import { autenticacaoRepository } from '../repository/autenticacao.repository'
import {
  CredenciaisInvalidasError,
  RefreshTokenInvalidoError,
  UsuarioInativoError,
} from '../errors/autenticacao.errors'

export type LoginInput = {
  cpfCnpj: string
  password: string
  deviceLabel?: string
  userAgent?: string | null
  ip?: string | null
}

export type SessionTokens = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    nome: string
    role: UserRole
  }
}

export const autenticacaoService = {
  async login(input: LoginInput): Promise<SessionTokens> {
    const user = await autenticacaoRepository.findUserByCpfCnpj(input.cpfCnpj)

    if (!user) {
      await logAudit({
        action: AUDIT_ACTIONS.LOGIN_FALHA,
        entity: 'User',
        details: { motivo: 'usuario_nao_encontrado' },
      })
      throw new CredenciaisInvalidasError()
    }

    if (!user.ativo) {
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN_FALHA,
        entity: 'User',
        entityId: user.id,
        details: { motivo: 'usuario_inativo' },
      })
      throw new UsuarioInativoError()
    }

    const senhaValida = await verifyPassword(input.password, user.password)
    if (!senhaValida) {
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN_FALHA,
        entity: 'User',
        entityId: user.id,
        details: { motivo: 'senha_incorreta' },
      })
      throw new CredenciaisInvalidasError()
    }

    if (needsRehash(user.password)) {
      const novoHash = await hashPassword(input.password)
      await autenticacaoRepository.updateUserPassword(user.id, novoHash)
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role as UserRole,
      email: user.email,
      nome: user.nome,
    })

    const refreshToken = await issueRefreshToken(user.id, {
      deviceLabel: input.deviceLabel,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
    })

    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN,
      entity: 'User',
      entityId: user.id,
      details: { role: user.role },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role as UserRole,
      },
    }
  },

  async refresh(refreshToken: string, ctx: { userAgent?: string | null; ip?: string | null }): Promise<SessionTokens> {
    const validated = await validateRefreshToken(refreshToken)
    if (!validated) throw new RefreshTokenInvalidoError()

    const user = await autenticacaoRepository.findUserById(validated.userId)
    if (!user || !user.ativo) {
      await revokeRefreshTokenByJti(validated.jti)
      throw new RefreshTokenInvalidoError()
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role as UserRole,
      email: user.email,
      nome: user.nome,
    })

    const novoRefresh = await issueRefreshToken(user.id, {
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    })

    await revokeRefreshTokenByJti(validated.jti)

    return {
      accessToken,
      refreshToken: novoRefresh,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role as UserRole,
      },
    }
  },

  async logout(refreshToken: string | null, userId: string | null): Promise<void> {
    if (refreshToken) {
      const validated = await validateRefreshToken(refreshToken)
      if (validated) await revokeRefreshTokenByJti(validated.jti)
    }
    if (userId) {
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.LOGOUT,
        entity: 'User',
        entityId: userId,
      })
    }
  },

  async logoutAllSessions(userId: string): Promise<void> {
    await revokeAllUserRefreshTokens(userId)
  },
}
