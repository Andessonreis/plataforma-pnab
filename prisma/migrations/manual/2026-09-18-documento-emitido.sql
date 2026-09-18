-- Migration manual: tabela DocumentoEmitido
-- Data: 2026-09-18
-- Motivo: todo PDF oficial que sai do portal passa a levar um código e um QR
-- que levam a /verificar/<codigo>, uma página pública que diz o que foi
-- emitido, quando, por qual órgão e sobre qual edital. Sem esta tabela o
-- registro falha em silêncio (registrarEmissao devolve null) e os documentos
-- saem sem código de verificação.
--
-- hashConteudo é SHA-256 dos DADOS que geraram o documento, não do arquivo: o
-- PDF muda a cada render (data impressa, metadados do PDFKit), então um hash
-- do binário acusaria adulteração em duas emissões idênticas do mesmo
-- conteúdo. Com o hash dos dados, reemitir o mesmo conteúdo dá o mesmo hash.
--
-- metadados guarda só resumo publicável (totais, fase, categoria) — nunca dado
-- pessoal, porque é o que a página pública de verificação exibe.
--
-- editalId/emitidoPorId ficam nulos quando o documento não é de edital ou o
-- emissor foi removido: o registro de emissão não pode sumir junto, ou um
-- documento em circulação deixaria de ser verificável.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback:
--   DROP TABLE IF EXISTS "DocumentoEmitido";

BEGIN;

CREATE TABLE IF NOT EXISTS "DocumentoEmitido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "hashConteudo" TEXT NOT NULL,
    "metadados" JSONB NOT NULL DEFAULT '{}',
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editalId" TEXT,
    "emitidoPorId" TEXT,

    CONSTRAINT "DocumentoEmitido_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentoEmitido_codigo_key" ON "DocumentoEmitido"("codigo");
CREATE INDEX IF NOT EXISTS "DocumentoEmitido_editalId_idx" ON "DocumentoEmitido"("editalId");
CREATE INDEX IF NOT EXISTS "DocumentoEmitido_emitidoEm_idx" ON "DocumentoEmitido"("emitidoEm");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentoEmitido_editalId_fkey'
  ) THEN
    ALTER TABLE "DocumentoEmitido"
      ADD CONSTRAINT "DocumentoEmitido_editalId_fkey"
      FOREIGN KEY ("editalId") REFERENCES "Edital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentoEmitido_emitidoPorId_fkey'
  ) THEN
    ALTER TABLE "DocumentoEmitido"
      ADD CONSTRAINT "DocumentoEmitido_emitidoPorId_fkey"
      FOREIGN KEY ("emitidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
