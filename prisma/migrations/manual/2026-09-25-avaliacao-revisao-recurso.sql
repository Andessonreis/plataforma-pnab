-- Migration manual: valores anteriores da avaliação revisada no recurso
-- Data: 2026-09-25
-- Motivo: quando a comissão julga um recurso e revisa a nota de uma avaliação, a
-- tela precisa mostrar o valor original riscado ao lado do novo (como a
-- retificação faz com as datas do cronograma). A coluna guarda o que havia antes:
-- { revisadoEm, notasAnteriores, notaTotalAnterior }.
--
-- Nullable e sem default: avaliação sem revisão continua igual. O pipeline de
-- produção roda `prisma db push` antes de reiniciar o app e já cria a coluna;
-- rodar este SQL à mão antes é opcional e não tem efeito colateral. Consulta de
-- avaliação sem `select` lê todas as colunas, então o código novo exige a coluna.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback (rodar com o código anterior ANTES):
--   ALTER TABLE "Avaliacao" DROP COLUMN IF EXISTS "revisaoRecurso";

BEGIN;

ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "revisaoRecurso" JSONB;

COMMIT;
