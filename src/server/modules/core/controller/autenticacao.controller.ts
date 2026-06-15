import { UnauthorizedError } from '@server/lib/http/errors'
import { ipFromHeaders } from '@server/lib/auth/api-caller'
import { clearAuthCookies, setAuthCookies } from '@server/lib/auth/cookies'
import { getCurrentUserFromHeaders } from '@server/lib/auth/current-user'
import { ACCESS_TOKEN_TTL_SECONDS } from '@server/lib/auth/jwt'
import type { RequestContext } from '@server/adapters/next-route'
import { loginInputSchema } from '@shared/schemas/autenticacao.schema'
import type { SessaoDTO } from '@shared/dtos/autenticacao.dto'
import type { UserRole } from '@shared/enums/user-role'
import { autenticacaoService } from '../service/autenticacao.service'

const REFRESH_COOKIE_NAME = 'pnab.refresh'

function extractRefreshCookie(headers: Headers): string | null {
  const cookie = headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${REFRESH_COOKIE_NAME.replace('.', '\\.')}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function buildSessaoDTO(user: { id: string; email: string; nome: string; role: UserRole }): SessaoDTO {
  return {
    usuario: user,
    expiraEm: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
  }
}

export const autenticacaoController = {
  async login(ctx: RequestContext) {
    const input = loginInputSchema.parse(ctx.body)
    const { accessToken, refreshToken, user } = await autenticacaoService.login({
      cpfCnpj: input.cpfCnpj,
      password: input.password,
      deviceLabel: input.deviceLabel,
      userAgent: ctx.headers.get('user-agent'),
      ip: ipFromHeaders(ctx.headers),
    })

    await setAuthCookies(accessToken, refreshToken)
    return { data: buildSessaoDTO(user), status: 200 }
  },

  async refresh(ctx: RequestContext) {
    const refreshToken = extractRefreshCookie(ctx.headers)
    if (!refreshToken) throw new UnauthorizedError('Sem refresh token')

    const result = await autenticacaoService.refresh(refreshToken, {
      userAgent: ctx.headers.get('user-agent'),
      ip: ipFromHeaders(ctx.headers),
    })

    await setAuthCookies(result.accessToken, result.refreshToken)
    return { data: buildSessaoDTO(result.user), status: 200 }
  },

  async logout(ctx: RequestContext) {
    const refreshToken = extractRefreshCookie(ctx.headers)
    const user = await getCurrentUserFromHeaders(ctx.headers)

    await autenticacaoService.logout(refreshToken, user?.id ?? null)
    await clearAuthCookies()

    return { data: { ok: true }, status: 200 }
  },

  async sessaoAtual(ctx: RequestContext) {
    const user = await getCurrentUserFromHeaders(ctx.headers)
    if (!user) throw new UnauthorizedError()
    return { data: buildSessaoDTO(user), status: 200 }
  },
}

