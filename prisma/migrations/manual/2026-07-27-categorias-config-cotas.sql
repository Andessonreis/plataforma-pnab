-- Migração: vagas/cotas/valor por categoria de edital
-- Gerada via: npx prisma db push (schema.prisma é o source of truth)
-- Aplicação em produção: ocorre automaticamente via `prisma db push` no docker-compose.prod.yml
-- Este arquivo é referência/auditoria.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.

-- AlterTable
ALTER TABLE "Edital" ADD COLUMN     "categoriasConfig" JSONB;

-- AlterTable
ALTER TABLE "Inscricao" ADD COLUMN     "cotasOptIn" TEXT[] DEFAULT ARRAY[]::TEXT[];
