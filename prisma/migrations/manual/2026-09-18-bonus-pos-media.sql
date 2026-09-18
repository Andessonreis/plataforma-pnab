-- Migration manual: Edital.itensBonus / Inscricao.bonusItens
-- Data: 2026-09-18
-- Gerada via: npx prisma db push (schema.prisma é o source of truth)
-- Aplicação em produção: automática via `prisma db push` no docker-compose.prod.yml.
-- Este arquivo é referência/auditoria.
--
-- Motivo: no Festival de Arte e Cultura a bonificação do Anexo VI foi
-- configurada como um bloco de critérios ("Bloco 2 — Bonificação"), preenchido
-- por cada parecerista dentro da própria nota. Como a nota final da proposta é
-- a média dos três, o bônus era diluído sempre que eles divergiam na marcação:
-- em 32 das 111 propostas habilitadas os pareceristas discordaram, e quem tinha
-- direito a 10 pontos recebeu 1,67 / 3,33 / 6,67. A bonificação não é juízo de
-- mérito — é fato documental, conferido na autodeclaração — então passa a ser
-- decidida pela comissão e somada UMA vez sobre a média (Inscricao.notaBonus,
-- que já existia para o bônus colado na cota).
--
-- Efeito medido antes da correção: uniformizando o bônus, 4 propostas trocam
-- entre contemplada e suplente e 14 mudam de posição dentro da categoria.
--
-- ⚠️ Aditiva: zero DROP, RENAME ou ALTER destrutivo em tabelas existentes.
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback: ALTER TABLE "Edital" DROP COLUMN IF EXISTS "itensBonus";
--           ALTER TABLE "Inscricao" DROP COLUMN IF EXISTS "bonusItens";

BEGIN;

ALTER TABLE "Edital"
  ADD COLUMN IF NOT EXISTS "itensBonus" JSONB;

ALTER TABLE "Inscricao"
  ADD COLUMN IF NOT EXISTS "bonusItens" TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMIT;
