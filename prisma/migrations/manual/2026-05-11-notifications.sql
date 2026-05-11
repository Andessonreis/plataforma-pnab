-- Migração: Sistema de Notificações (in-app + email gated)
-- Gerada via: npx prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --script
-- Aplicação em produção: ocorre automaticamente via `prisma db push` no docker-compose.prod.yml
-- Este arquivo é referência/auditoria — o source of truth é prisma/schema.prisma.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('MANUAL', 'REGRA');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('RASCUNHO', 'ENVIANDO', 'ENVIADA', 'CANCELADA', 'FALHA');

-- CreateEnum
CREATE TYPE "NotificationRuleTrigger" AS ENUM ('INSCRICAO_RASCUNHO_PENDENTE', 'EDITAL_PUBLICADO', 'INSCRICAO_INABILITADA', 'INSCRICAO_ANEXOS_FALTANDO', 'RESULTADO_PUBLICADO', 'ATENDIMENTO_RESPONDIDO', 'USER_SEM_INSCRICAO');

-- CreateTable
CREATE TABLE "NotificationCampaign" (
    "id" TEXT NOT NULL,
    "tipo" "CampaignType" NOT NULL DEFAULT 'MANUAL',
    "status" "CampaignStatus" NOT NULL DEFAULT 'RASCUNHO',
    "titulo" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "link" TEXT,
    "ctaLabel" TEXT,
    "canais" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "filtro" JSONB NOT NULL DEFAULT '{}',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalAlvo" INTEGER NOT NULL DEFAULT 0,
    "totalEnviado" INTEGER NOT NULL DEFAULT 0,
    "totalErro" INTEGER NOT NULL DEFAULT 0,
    "ruleId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "trigger" "NotificationRuleTrigger" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "link" TEXT,
    "ctaLabel" TEXT,
    "canais" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "filtro" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "link" TEXT,
    "ctaLabel" TEXT,
    "canais" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "lidaEm" TIMESTAMP(3),
    "emailEnviadoEm" TIMESTAMP(3),
    "emailErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationCampaign_status_idx" ON "NotificationCampaign"("status");

-- CreateIndex
CREATE INDEX "NotificationCampaign_createdAt_idx" ON "NotificationCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationCampaign_ruleId_idx" ON "NotificationCampaign"("ruleId");

-- CreateIndex
CREATE INDEX "NotificationRule_trigger_ativo_idx" ON "NotificationRule"("trigger", "ativo");

-- CreateIndex
CREATE INDEX "Notification_userId_lidaEm_idx" ON "Notification"("userId", "lidaEm");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_campaignId_userId_key" ON "Notification"("campaignId", "userId");

-- AddForeignKey
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NotificationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
