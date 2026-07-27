-- Migração: campo telefone em Atendimento (recurso ao edital reaproveita esse model)
-- Gerada via: npx prisma db push (schema.prisma é o source of truth)
-- Aplicação em produção: ocorre automaticamente via `prisma db push` no docker-compose.prod.yml
-- Este arquivo é referência/auditoria.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.

-- AlterTable
ALTER TABLE "Atendimento" ADD COLUMN     "telefone" TEXT;
