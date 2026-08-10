-- Migração: galeria opcional em Notícia (programação por dia, ex.: festivais)
-- Gerada via: npx prisma db push (schema.prisma é o source of truth)
-- Aplicação em produção: ocorre automaticamente via `prisma db push` no docker-compose.prod.yml
-- Este arquivo é referência/auditoria.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.

-- AlterTable
ALTER TABLE "Noticia" ADD COLUMN     "galeria" JSONB;
