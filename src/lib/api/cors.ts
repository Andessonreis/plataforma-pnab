import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// CORS para rotas /api/v1/*
// ─────────────────────────────────────────────────────────────────────────────

function getAllowedOrigins(): string[] {
  const env = process.env.API_CORS_ORIGINS
  if (!env) return []
  return env.split(',').map((o) => o.trim()).filter(Boolean)
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = getAllowedOrigins()

  // Se não tem origens configuradas, permite qualquer (dev)
  const isAllowed = allowed.length === 0 || allowed.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Expose-Headers': 'X-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Responde preflight OPTIONS para /api/v1/*
 */
export function handlePreflight(req: NextRequest): NextResponse {
  const headers = corsHeaders(req)
  const res = new NextResponse(null, { status: 204 })
  for (const [key, value] of Object.entries(headers)) {
    if (value) res.headers.set(key, value)
  }
  return res
}
