-- Migration manual: cópia do resultado preliminar publicado em Edital
-- Data: 2026-09-25
-- Motivo: o resultado preliminar e o definitivo passam a ter páginas próprias
-- (/resultados-preliminar e /resultados-definitivo). Depois do recurso as notas
-- e as vagas das inscrições mudam, então a lista que foi publicada no Diário
-- Oficial precisa ficar guardada: { publicadoEm, linhas }.
--
-- Nullable de propósito: edital sem a cópia continua funcionando (a página do
-- preliminar mostra a lista atual enquanto o edital está nessa fase).
--
-- Ordem de deploy: o pipeline de produção roda `prisma db push` antes de
-- reiniciar o app, e isso já cria a coluna (nullable, sem perda de dados).
-- Rodar este SQL à mão antes é opcional e não tem efeito colateral. Sem a
-- coluna, consulta de edital sem `select` falha: o código novo omite a coluna
-- nas listagens públicas e na API v1, mas ainda a lê nas páginas de resultado,
-- na publicação de resultados, em avancar-fase e nas telas de edição do admin.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rollback (rodar com o código anterior ANTES):
--   ALTER TABLE "Edital" DROP COLUMN IF EXISTS "resultadoPreliminar";

BEGIN;

ALTER TABLE "Edital" ADD COLUMN IF NOT EXISTS "resultadoPreliminar" JSONB;

COMMIT;
