-- Migration manual: Edital.resultadoPreliminarPublicadoEm / resultadoFinalPublicadoEm
-- Data: 2026-09-12
-- Motivo: nota e parecer individuais de avaliação (card "Avaliações" na tela
-- do proponente) ficavam visíveis assim que "edital.status" chegava a
-- RESULTADO_PRELIMINAR/RECURSO/RESULTADO_FINAL/ENCERRADO — e esse status
-- avança sozinho pelo scheduler, pela data do cronograma, sem checar se a
-- Secretaria de fato publicou o resultado (mesmo problema que
-- resultadoLiberadoEm já resolveu pra habilitação). Com o Festival de Arte e
-- Cultura em fase de AVALIACAO agora e avaliadores já lançando nota, uma data
-- de cronograma desatualizada ou um avanço manual de fase bastava pra vazar
-- nota e parecer antes da hora.
--
-- A visibilidade passa a depender de um ato explícito de publicação,
-- registrado nestas duas colunas — não do status do edital.
--
-- Backfill: o Chamamento Público — Rede Municipal de Pontos de Cultura de
-- Irecê (ENCERRADO) já publicou os dois resultados de verdade no passado;
-- preservamos as datas reais de quando isso aconteceu, tiradas do AuditLog
-- (RESULTADO_PRELIMINAR_PUBLICADO / RESULTADO_FINAL_PUBLICADO), pra não
-- esconder da noite pro dia um resultado que os proponentes já viram. Os
-- demais editais (HABILITACAO, AVALIACAO) ficam com as colunas nulas — é
-- exatamente o estado que fecha o vazamento.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback: ALTER TABLE "Edital" DROP COLUMN IF EXISTS "resultadoPreliminarPublicadoEm", DROP COLUMN IF EXISTS "resultadoFinalPublicadoEm";

BEGIN;

ALTER TABLE "Edital"
  ADD COLUMN IF NOT EXISTS "resultadoPreliminarPublicadoEm" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resultadoFinalPublicadoEm" TIMESTAMP(3);

UPDATE "Edital" e
SET "resultadoPreliminarPublicadoEm" = a.publicado_em
FROM (
  SELECT "entityId" AS edital_id, MAX("createdAt") AS publicado_em
  FROM "AuditLog"
  WHERE action = 'RESULTADO_PRELIMINAR_PUBLICADO'
  GROUP BY "entityId"
) a
WHERE e.id = a.edital_id
  AND e."resultadoPreliminarPublicadoEm" IS NULL;

UPDATE "Edital" e
SET "resultadoFinalPublicadoEm" = a.publicado_em
FROM (
  SELECT "entityId" AS edital_id, MAX("createdAt") AS publicado_em
  FROM "AuditLog"
  WHERE action = 'RESULTADO_FINAL_PUBLICADO'
  GROUP BY "entityId"
) a
WHERE e.id = a.edital_id
  AND e."resultadoFinalPublicadoEm" IS NULL;

COMMIT;
