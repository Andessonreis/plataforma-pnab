-- Regulariza tabelas/colunas que estavam só no schema.prisma (aplicadas via
-- db push em alguns ambientes) e sem migration: RefreshToken (auth JWT),
-- ErrorLog, EmailTemplateOverride, User.avatarUrl, Edital.etapasCustomizadas.
-- Idempotente (IF NOT EXISTS) — seguro reaplicar em qualquer ambiente.

-- ── Colunas ──────────────────────────────────────────────────────────────────
ALTER TABLE "User"   ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Edital" ADD COLUMN IF NOT EXISTS "etapasCustomizadas" JSONB NOT NULL DEFAULT '[]';

-- ── RefreshToken (sessão / refresh do auth custom) ──────────────────────────
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
DO $$ BEGIN
  ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ErrorLog (instrumentação de erros) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ErrorLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "fingerprint" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "path" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "userAgent" TEXT,
    "ip" TEXT,
    "context" JSONB,
    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ErrorLog_timestamp_idx" ON "ErrorLog"("timestamp");
CREATE INDEX IF NOT EXISTS "ErrorLog_fingerprint_idx" ON "ErrorLog"("fingerprint");
CREATE INDEX IF NOT EXISTS "ErrorLog_level_timestamp_idx" ON "ErrorLog"("level", "timestamp");

-- ── EmailTemplateOverride (override de template de e-mail via admin) ─────────
CREATE TABLE IF NOT EXISTS "EmailTemplateOverride" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "EmailTemplateOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplateOverride_key_key" ON "EmailTemplateOverride"("key");
CREATE INDEX IF NOT EXISTS "EmailTemplateOverride_enabled_idx" ON "EmailTemplateOverride"("enabled");
DO $$ BEGIN
  ALTER TABLE "EmailTemplateOverride" ADD CONSTRAINT "EmailTemplateOverride_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
