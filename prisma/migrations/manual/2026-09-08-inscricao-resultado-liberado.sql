-- Migration manual: Inscricao.resultadoLiberadoEm
-- Data: 2026-09-08
-- Motivo: separar "conferido internamente" de "comunicado ao proponente".
-- Marcar habilitada/inabilitada avisava o agente cultural na hora (e-mail e
-- painel), antecipando ato que ainda não saiu no Diário Oficial. A liberação
-- passa a ser explícita: enquanto esta coluna for nula, o painel mostra
-- "Em análise" e nenhum e-mail de resultado é disparado.
--
-- Não se usa a data do cronograma como gatilho porque a Secretaria remarca
-- essas datas com frequência — amarrar divulgação a elas publicaria por
-- engano.
--
-- Backfill: as 5 inscrições do Festival marcadas em 08/09/2026 já receberam
-- e-mail de resultado antes desta correção. Como não há como desfazer o que
-- elas já leram, entram como liberadas (decisão do gestor), preservando o
-- horário real em que cada uma foi marcada.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback: ALTER TABLE "Inscricao" DROP COLUMN IF EXISTS "resultadoLiberadoEm";

BEGIN;

ALTER TABLE "Inscricao"
  ADD COLUMN IF NOT EXISTS "resultadoLiberadoEm" TIMESTAMP(3);

UPDATE "Inscricao" i
SET "resultadoLiberadoEm" = a.marcado_em
FROM (
  SELECT "entityId" AS inscricao_id, MAX("createdAt") AS marcado_em
  FROM "AuditLog"
  WHERE action IN ('INSCRICAO_HABILITADA', 'INSCRICAO_INABILITADA')
    AND "createdAt" >= TIMESTAMP '2026-09-08 00:00:00'
  GROUP BY "entityId"
) a
WHERE i.id = a.inscricao_id
  AND i."resultadoLiberadoEm" IS NULL
  AND i.status IN ('HABILITADA', 'INABILITADA');

COMMIT;
