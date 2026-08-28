-- Migration manual: Edital.retificacoes
-- Data: 2026-08-27
-- Motivo: Registrar as retificações publicadas no Diário Oficial que alteram
-- um edital já no ar (prorrogação de prazo, correção de data). O portal passa
-- a exibir a faixa de retificação e a riscar a data antiga ao lado da nova.
--
-- A marca de qual data mudou (`retificado`) vive dentro de cada item do
-- cronograma, que já é jsonb — só o cabeçalho do ato precisa de coluna nova.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback: ALTER TABLE "Edital" DROP COLUMN IF EXISTS "retificacoes";

BEGIN;

ALTER TABLE "Edital"
  ADD COLUMN IF NOT EXISTS "retificacoes" JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
