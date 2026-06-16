import { NextResponse } from 'next/server'
import { getOpenApiDocument } from '@server/openapi/document'
import { resolveApiCaller, callerHasRole } from '@server/lib/auth/api-caller'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const caller = await resolveApiCaller(req.headers)
  if (!callerHasRole(caller, 'ADMIN')) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Não encontrado' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(getOpenApiDocument(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
