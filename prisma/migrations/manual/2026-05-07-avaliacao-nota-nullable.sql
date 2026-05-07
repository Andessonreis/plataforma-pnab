-- Migration manual: Avaliacao.notaTotal nullable
-- Data: 2026-05-07
-- Motivo: Distinguir "não avaliado" (null) de "avaliado e zerado" (0).
-- Critério de auditoria/transparência (PNAB Irecê — bug #66).
--
-- Rollback: ALTER TABLE "Avaliacao" ALTER COLUMN "notaTotal" SET NOT NULL;
-- (requer UPDATE prévio: SET "notaTotal" = 0 WHERE "notaTotal" IS NULL)

BEGIN;

ALTER TABLE "Avaliacao" ALTER COLUMN "notaTotal" DROP NOT NULL;

-- Limpa placeholders existentes: avaliações criadas no momento da atribuição
-- (sem notas preenchidas e não finalizadas) passam a ter notaTotal NULL.
-- Rascunhos com notas preenchidas (jsonb_array_length > 0) são preservados.
UPDATE "Avaliacao"
SET "notaTotal" = NULL
WHERE finalizada = false
  AND jsonb_array_length(notas::jsonb) = 0;

COMMIT;
