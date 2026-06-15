import { NextResponse } from 'next/server'
import { getOpenApiDocument } from '@server/openapi/document'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json(getOpenApiDocument(), {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
