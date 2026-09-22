-- Migration manual: coluna template em DocumentoEmitido
-- Data: 2026-09-21
-- Motivo: os PDFs de listas e relatórios passam a sair em duas versões — 1 é o
-- layout anterior e 2 é o padrão do Diário Oficial, que continua sendo o do
-- sistema. A coluna guarda a versão de cada emissão, e é dela que sai a
-- preferência: a tela de emissão já abre na versão que aquela pessoa usou da
-- última vez naquele edital.
--
-- A página pública de verificação NÃO lê esta coluna — ela exibe a versão pelo
-- rótulo gravado em metadados ("Versão do PDF"), que já é listado sem depender
-- do schema. É o que mantém /verificar funcionando se o código chegar antes
-- desta migration: nenhum QR em circulação deixa de ser conferível.
--
-- O DEFAULT 2 vale para o passado também: tudo que já foi emitido saiu no
-- layout atual, então nenhuma emissão existente precisa ser corrigida.
--
-- O índice (emitidoPorId, emitidoEm) é o da consulta de preferência — última
-- emissão daquela pessoa, do mais recente para o mais antigo.
--
-- Ordem de deploy: esta migration ANTES do código. Sem a coluna o INSERT falha,
-- registrarEmissao devolve null e o PDF sai sem código nem QR (só log de erro).
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback (rodar com o código anterior ANTES):
--   DROP INDEX IF EXISTS "DocumentoEmitido_emitidoPorId_emitidoEm_idx";
--   ALTER TABLE "DocumentoEmitido" DROP COLUMN IF EXISTS "template";

BEGIN;

ALTER TABLE "DocumentoEmitido" ADD COLUMN IF NOT EXISTS "template" SMALLINT NOT NULL DEFAULT 2
  CONSTRAINT "DocumentoEmitido_template_check" CHECK ("template" IN (1, 2));

CREATE INDEX IF NOT EXISTS "DocumentoEmitido_emitidoPorId_emitidoEm_idx"
  ON "DocumentoEmitido" ("emitidoPorId", "emitidoEm");

COMMIT;
