-- Migração: etapa opcional de inscrição por vídeo
-- Gerada via: npx prisma db push (schema.prisma é o source of truth)
-- Aplicação em produção: ocorre automaticamente via `prisma db push` no docker-compose.prod.yml
-- Este arquivo é referência/auditoria.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.

-- AlterTable
ALTER TABLE "Edital" ADD COLUMN     "videoHabilitado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Inscricao" ADD COLUMN     "submissaoPorVideo" BOOLEAN NOT NULL DEFAULT false;
