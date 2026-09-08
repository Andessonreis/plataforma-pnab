-- Migration manual: AnexoInscricao.adicionadoPorId / origemNota
-- Data: 2026-09-08
-- Motivo: permitir que a Secretaria junte documento em nome do proponente
-- quando o edital já está rodando e a inscrição não aceita mais edição — caso
-- concreto: a Retificação nº 02 do edital de Mestres e Mestras passou a exigir
-- documento de identidade e comprovante de residência, recebidos por e-mail.
--
-- O rastro fica no próprio registro (quem juntou + justificativa da origem),
-- não só no log de auditoria, porque o documento precisa se defender sozinho
-- numa conferência ou auditoria futura. Nulo em adicionadoPorId = enviado pelo
-- próprio proponente, que é o caso de todos os anexos existentes.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback:
--   ALTER TABLE "AnexoInscricao" DROP COLUMN IF EXISTS "adicionadoPorId";
--   ALTER TABLE "AnexoInscricao" DROP COLUMN IF EXISTS "origemNota";

BEGIN;

ALTER TABLE "AnexoInscricao"
  ADD COLUMN IF NOT EXISTS "adicionadoPorId" TEXT,
  ADD COLUMN IF NOT EXISTS "origemNota" TEXT;

CREATE INDEX IF NOT EXISTS "AnexoInscricao_adicionadoPorId_idx"
  ON "AnexoInscricao" ("adicionadoPorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnexoInscricao_adicionadoPorId_fkey'
  ) THEN
    ALTER TABLE "AnexoInscricao"
      ADD CONSTRAINT "AnexoInscricao_adicionadoPorId_fkey"
      FOREIGN KEY ("adicionadoPorId") REFERENCES "User"("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
