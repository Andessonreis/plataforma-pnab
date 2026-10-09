-- Migration manual: um pedido ativo por horário de visita do Memorial
-- Data: 2026-10-09
-- Motivo: dois grupos nunca podem ficar com o mesmo dia e horário de início.
-- O serviço já confere isso dentro de uma transação com trava por dia
-- (pg_advisory_xact_lock); o índice abaixo é a garantia final no próprio banco,
-- valendo também para qualquer escrita que não passe pela aplicação.
--
-- Só os status que seguram vaga entram no índice (os mesmos de
-- STATUS_QUE_OCUPAM em src/lib/memorial/agendamento/regras.ts). Recusado,
-- cancelado, realizado e não compareceu liberam o horário e podem repetir.
--
-- O Prisma não descreve índice parcial no schema, mas o `prisma db push` do
-- deploy não o remove (conferido com `prisma migrate diff`).
--
-- Antes de rodar em staging/produção, confira se já não há conflito gravado;
-- se esta consulta devolver linhas, resolva-as no painel antes:
--   SELECT data, "horaInicio", COUNT(*) FROM "MemorialAgendamento"
--   WHERE status IN ('SOLICITADO','EM_ANALISE','CONFIRMADO','REAGENDAMENTO_SOLICITADO')
--   GROUP BY 1, 2 HAVING COUNT(*) > 1;
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback:
--   DROP INDEX IF EXISTS "MemorialAgendamento_horario_ativo_key";

CREATE UNIQUE INDEX IF NOT EXISTS "MemorialAgendamento_horario_ativo_key"
  ON "MemorialAgendamento" ("data", "horaInicio")
  WHERE "status" IN ('SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'REAGENDAMENTO_SOLICITADO');
