import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createContext, forbidden, handleError, logRequest, type ApiContext } from '@/lib/api/response'
import type { UserRole } from '@prisma/client'
import { ROLES_SLIDES } from '@/lib/services/slide-destaque.service'

interface Autor {
  userId: string
  ip?: string
}

/**
 * Envolve as rotas de /api/admin/slides: requestId, checagem de papel, log e
 * conversão de erro (Zod → 400 com `fieldErrors`, ServiceError → status próprio).
 * O corpo de sucesso continua plano (`{ message, id }`), como o formulário espera.
 */
export function rotaSlides(
  metodo: string,
  executar: (req: NextRequest, autor: Autor, id: string | undefined) => Promise<{ status: number; body: object }>,
  roles: UserRole[] = ROLES_SLIDES,
) {
  return async (req: NextRequest, contexto?: { params: Promise<{ id?: string }> }) => {
    const ctx: ApiContext = createContext()
    const caminho = new URL(req.url).pathname
    try {
      const session = await auth()
      if (!session || !roles.includes(session.user.role)) return forbidden(ctx)

      const id = (await contexto?.params)?.id
      const autor = { userId: session.user.id, ip: req.headers.get('x-forwarded-for') ?? undefined }
      const { status, body } = await executar(req, autor, id)

      // A abertura da home é estática com ISR: sem isso o slide só apareceria
      // na próxima regeneração.
      if (metodo !== 'GET') revalidatePath('/')

      const res = NextResponse.json({ ...body, requestId: ctx.requestId }, { status })
      res.headers.set('X-Request-Id', ctx.requestId)
      res.headers.set('Cache-Control', 'no-store')
      logRequest(ctx, metodo, caminho, status)
      return res
    } catch (err) {
      return handleError(ctx, err)
    }
  }
}
