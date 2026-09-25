-- Migration manual: template das páginas de resultado em Edital
-- Data: 2026-09-25
-- Motivo: fotos da capa, títulos, rótulos da coluna Situação e a lista de
-- inscrições fora da classificação eram fixos no código, com a PNAB-2026-0046 do
-- Festival escrita à mão. Passam a ficar em Edital.resultadoTemplate
-- (ver src/lib/edital/template-resultado.ts); o que faltar cai no padrão.
--
-- ORDEM DE DEPLOY (importante): rodar este SQL ANTES de subir o código novo. O
-- código novo lê a exceção da 0046 desta coluna; sem o UPDATE abaixo, a
-- classificação, os PDFs e o lote de contemplados a tratariam como classificada.
-- O código antigo ignora a coluna, então rodar antes é seguro.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral. O UPDATE só
-- preenche quando a coluna ainda está vazia.
-- Rollback (rodar com o código anterior ANTES):
--   ALTER TABLE "Edital" DROP COLUMN IF EXISTS "resultadoTemplate";

BEGIN;

ALTER TABLE "Edital" ADD COLUMN IF NOT EXISTS "resultadoTemplate" JSONB;

-- A PNAB-2026-0046 é pessoa jurídica inscrita numa categoria que o edital do
-- Festival não tem: o preliminar a publicou como "Não se aplica".
UPDATE "Edital"
   SET "resultadoTemplate" = '{"foraDaClassificacao": ["PNAB-2026-0046"]}'::jsonb
 WHERE slug = 'festival-arte-cultura-irece-centenario-2026'
   AND "resultadoTemplate" IS NULL;

COMMIT;
