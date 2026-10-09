-- Aponta as URLs de arquivos para o armazenamento em disco da VPS (rota /api/arquivos).
-- Antes: https://<projeto>.supabase.co/storage/v1/object/public/<bucket>/<caminho>
-- Depois: /api/arquivos/<bucket>/<caminho>
--
-- Idempotente: só toca em valores que ainda têm o formato antigo.
-- Pré-requisito: os arquivos já estarem em UPLOAD_DIR/<bucket>/<caminho> (restaurados do backup).
-- AuditLog.details fica de fora de propósito: é histórico e não deve ser reescrito.

BEGIN;

UPDATE "ArquivoEdital"
SET url = regexp_replace(url, '^https?://[^/]+/storage/v1/object/public/', '/api/arquivos/')
WHERE url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE "AnexoInscricao"
SET url = regexp_replace(url, '^https?://[^/]+/storage/v1/object/public/', '/api/arquivos/')
WHERE url ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE "User"
SET "avatarUrl" = regexp_replace("avatarUrl", '^https?://[^/]+/storage/v1/object/public/', '/api/arquivos/')
WHERE "avatarUrl" ~ '^https?://[^/]+/storage/v1/object/public/';

UPDATE "Recurso"
SET "urlAnexos" = ARRAY(
  SELECT regexp_replace(u, '^https?://[^/]+/storage/v1/object/public/', '/api/arquivos/')
  FROM unnest("urlAnexos") WITH ORDINALITY AS t(u, ordem)
  ORDER BY ordem
)
WHERE EXISTS (
  SELECT 1 FROM unnest("urlAnexos") AS u WHERE u ~ '^https?://[^/]+/storage/v1/object/public/'
);

UPDATE "Edital"
SET retificacoes = regexp_replace(
  retificacoes::text,
  'https?://[^/"]+/storage/v1/object/public/',
  '/api/arquivos/',
  'g'
)::jsonb
WHERE retificacoes::text ~ 'https?://[^/"]+/storage/v1/object/public/';

COMMIT;
